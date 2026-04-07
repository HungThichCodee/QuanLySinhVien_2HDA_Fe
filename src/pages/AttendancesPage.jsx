import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as attendanceService from '../services/attendances.js'
import * as courseClassService from '../services/courseclasses.js'
import * as enrollmentService from '../services/enrollments.js'
import Toast from '../components/ui/Toast.jsx'

function statusLabel(status) {
  if (status === 'present') return { text: 'Có mặt', cls: 'text-green-700 bg-green-50' }
  if (status === 'absent') return { text: 'Vắng', cls: 'text-red-700 bg-red-50' }
  if (status === 'late') return { text: 'Trễ', cls: 'text-yellow-700 bg-yellow-50' }
  return { text: status, cls: 'text-gray-500' }
}

function AttendancesPage() {
  let { isTeacher, isAdmin } = useAuth()
  let [courseClasses, setCourseClasses] = useState([])
  let [selectedCC, setSelectedCC] = useState('')
  let [students, setStudents] = useState([])
  let [attendances, setAttendances] = useState([])
  let [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  let [loading, setLoading] = useState(true)
  let [toast, setToast] = useState(null)
  let [bulkData, setBulkData] = useState({})
  let [notesData, setNotesData] = useState({})
  let [saving, setSaving] = useState(false)
  let [isExistingDate, setIsExistingDate] = useState(false)
  let [absentCounts, setAbsentCounts] = useState({})
  let [expandedStudent, setExpandedStudent] = useState(null)

  useEffect(function () {
    async function load() {
      try {
        let cc = isTeacher ? await courseClassService.getMyTeaching() : await courseClassService.getAll()
        setCourseClasses(cc)
      } catch (err) { console.log(err) }
      setLoading(false)
    }
    load()
  }, [isTeacher])

  async function loadStudents(ccId) {
    setSelectedCC(ccId)
    setExpandedStudent(null)
    if (!ccId) { setStudents([]); setAttendances([]); setBulkData({}); setNotesData({}); return }
    try {
      let enr = await enrollmentService.getByCourseClass(ccId)
      let studentList = Array.isArray(enr) ? enr : []
      setStudents(studentList)
      let att = await attendanceService.getByCourseClass(ccId)
      let attList = Array.isArray(att) ? att : []
      setAttendances(attList)
      calcAbsentCounts(studentList, attList)
      mapDateData(studentList, attList, date)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  function calcAbsentCounts(studentList, attList) {
    let counts = {}
    studentList.forEach(function (s) {
      let absentCount = 0
      attList.forEach(function (a) {
        if (getEnrollmentId(a) === s._id && a.status === 'absent') {
          absentCount++
        }
      })
      counts[s._id] = absentCount
    })
    setAbsentCounts(counts)
  }

  function getEnrollmentId(att) {
    if (typeof att.enrollment === 'object' && att.enrollment !== null) return att.enrollment._id
    return att.enrollment
  }

  function getTotalSessions(attList) {
    let dates = {}
    attList.forEach(function (a) {
      let d = new Date(a.date).toDateString()
      dates[d] = true
    })
    return Object.keys(dates).length
  }

  function getStudentHistory(enrollmentId) {
    let history = []
    attendances.forEach(function (a) {
      if (getEnrollmentId(a) === enrollmentId) {
        history.push(a)
      }
    })
    history.sort(function (a, b) { return new Date(a.date) - new Date(b.date) })
    return history
  }

  function mapDateData(studentList, attList, targetDate) {
    let targetDateStr = new Date(targetDate).toDateString()
    let newBulkData = {}
    let newNotesData = {}
    let hasExisting = false

    studentList.forEach(function (s) {
      let existingAtt = null
      for (let i = 0; i < attList.length; i++) {
        let a = attList[i]
        if (getEnrollmentId(a) === s._id && new Date(a.date).toDateString() === targetDateStr) {
          existingAtt = a
          break
        }
      }
      if (existingAtt) {
        hasExisting = true
        newBulkData[s._id] = existingAtt.status
        newNotesData[s._id] = existingAtt.note || ''
      } else {
        newBulkData[s._id] = 'present'
        newNotesData[s._id] = ''
      }
    })

    setBulkData(newBulkData)
    setNotesData(newNotesData)
    setIsExistingDate(hasExisting)
  }

  useEffect(function () {
    if (!students || students.length === 0) return
    mapDateData(students, attendances, date)
  }, [date])

  function handleBulkChange(enrollmentId, status) {
    setBulkData({ ...bulkData, [enrollmentId]: status })
  }

  function handleNoteChange(enrollmentId, note) {
    setNotesData({ ...notesData, [enrollmentId]: note })
  }

  function handleCheckAll() {
    let newBulkData = {}
    students.forEach(function (s) {
      newBulkData[s._id] = 'present'
    })
    setBulkData(newBulkData)
  }

  function toggleStudentHistory(enrollmentId) {
    if (expandedStudent === enrollmentId) {
      setExpandedStudent(null)
    } else {
      setExpandedStudent(enrollmentId)
    }
  }

  let allPresent = students.length > 0 && students.every(function (s) { return bulkData[s._id] === 'present' })

  async function handleBulkSubmit() {
    setSaving(true)
    try {
      let items = Object.keys(bulkData).map(function (enrollmentId) {
        return { enrollmentId: enrollmentId, date: date, status: bulkData[enrollmentId], note: notesData[enrollmentId] || '' }
      })
      await attendanceService.createBulk({ records: items })
      setToast({ message: isExistingDate ? 'Cập nhật điểm danh thành công' : 'Điểm danh thành công', type: 'success' })
      let att = await attendanceService.getByCourseClass(selectedCC)
      let attList = Array.isArray(att) ? att : []
      setAttendances(attList)
      calcAbsentCounts(students, attList)
      setIsExistingDate(true)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
    finally { setSaving(false) }
  }

  let totalSessions = getTotalSessions(attendances)

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <h1 className="text-2xl font-bold text-gray-800 font-display mb-6">Điểm danh</h1>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lớp học phần</label>
          <select value={selectedCC} onChange={function (e) { loadStudents(e.target.value) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option value="">-- Chọn --</option>
            {courseClasses.map(function (cc) { return <option key={cc._id} value={cc._id}>{cc.subject?.name} - {cc.semester?.name}</option> })}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày</label>
          <input type="date" value={date} onChange={function (e) { setDate(e.target.value) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        {selectedCC && (
          <div className="flex gap-2">
            <button onClick={handleCheckAll} disabled={allPresent} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${allPresent ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>✓ Có mặt tất cả</button>
            <button onClick={handleBulkSubmit} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
              {saving ? 'Đang lưu...' : (isExistingDate ? 'Cập nhật điểm danh' : 'Lưu điểm danh')}
            </button>
          </div>
        )}
      </div>

      {isExistingDate && selectedCC && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
          Ngày <strong>{new Date(date).toLocaleDateString('vi-VN')}</strong> đã có dữ liệu điểm danh. Chỉnh sửa và nhấn "Cập nhật điểm danh" để lưu thay đổi.
        </div>
      )}

      {selectedCC && (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sinh viên</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">MSSV</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Có mặt</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vắng</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Trễ</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Ghi chú</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tổng vắng</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Lịch sử</th>
                </tr>
              </thead>
              <tbody>
                {students.map(function (enr, i) {
                  let st = enr.student
                  let current = bulkData[enr._id] || 'present'
                  let absent = absentCounts[enr._id] || 0
                  let isWarning = totalSessions > 0 && absent / totalSessions > 0.2
                  let isExpanded = expandedStudent === enr._id
                  let history = isExpanded ? getStudentHistory(enr._id) : []

                  return (
                    <>
                      <tr key={enr._id} className={'border-b border-gray-100 hover:bg-gray-50' + (isExpanded ? ' bg-primary-light/30' : '')}>
                        <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">{st?.fullName}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{st?.studentCode}</td>
                        <td className="px-5 py-3 text-center"><input type="radio" name={'att_' + enr._id} checked={current === 'present'} onChange={function () { handleBulkChange(enr._id, 'present') }} className="accent-green-500 w-4 h-4 cursor-pointer" /></td>
                        <td className="px-5 py-3 text-center"><input type="radio" name={'att_' + enr._id} checked={current === 'absent'} onChange={function () { handleBulkChange(enr._id, 'absent') }} className="accent-red-500 w-4 h-4 cursor-pointer" /></td>
                        <td className="px-5 py-3 text-center"><input type="radio" name={'att_' + enr._id} checked={current === 'late'} onChange={function () { handleBulkChange(enr._id, 'late') }} className="accent-yellow-500 w-4 h-4 cursor-pointer" /></td>
                        <td className="px-5 py-3"><input type="text" value={notesData[enr._id] || ''} onChange={function (e) { handleNoteChange(enr._id, e.target.value) }} placeholder="Ghi chú..." className="w-full max-w-[200px] px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-sm font-semibold ${isWarning ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded-full' : 'text-gray-600'}`}>{absent}{totalSessions > 0 ? '/' + totalSessions : ''}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={function () { toggleStudentHistory(enr._id) }} className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${isExpanded ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {isExpanded ? 'Ẩn' : 'Xem'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={enr._id + '_history'}>
                          <td colSpan="9" className="px-0 py-0">
                            <div className="bg-gray-50 border-t border-b border-gray-200 px-8 py-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Lịch sử điểm danh — {st?.fullName} ({st?.studentCode})</p>
                              {history.length === 0 ? (
                                <p className="text-sm text-gray-400">Chưa có dữ liệu điểm danh</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {history.map(function (h) {
                                    let label = statusLabel(h.status)
                                    return (
                                      <div key={h._id} className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ' + label.cls + ' border-current/20'}>
                                        <span className="font-semibold">{new Date(h.date).toLocaleDateString('vi-VN')}</span>
                                        <span>·</span>
                                        <span>{label.text}</span>
                                        {h.note && <span className="text-gray-400">({h.note})</span>}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                                <span>Có mặt: <strong className="text-green-600">{history.filter(function (h) { return h.status === 'present' }).length}</strong></span>
                                <span>Vắng: <strong className="text-red-600">{history.filter(function (h) { return h.status === 'absent' }).length}</strong></span>
                                <span>Trễ: <strong className="text-yellow-600">{history.filter(function (h) { return h.status === 'late' }).length}</strong></span>
                                <span>Tổng: <strong>{history.length}</strong> buổi</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
                {students.length === 0 && <tr><td colSpan="9" className="px-5 py-8 text-center text-gray-400 text-sm">Chọn lớp học phần để điểm danh</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
export default AttendancesPage
