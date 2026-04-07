import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as attendanceService from '../services/attendances.js'
import * as courseClassService from '../services/courseclasses.js'
import * as enrollmentService from '../services/enrollments.js'
import Toast from '../components/ui/Toast.jsx'

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
    try {
      let enr = await enrollmentService.getByCourseClass(ccId)
      setStudents(Array.isArray(enr) ? enr : [])
      let att = await attendanceService.getByCourseClass(ccId)
      setAttendances(Array.isArray(att) ? att : [])
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  useEffect(function() {
    if (!students || students.length === 0) return;
    let newBulkData = {}
    let targetDate = new Date(date).toDateString()
    
    students.forEach(function(s) {
       let existingAtt = attendances.find(function(a) { 
         return a.enrollment?._id === s._id && new Date(a.date).toDateString() === targetDate 
       })
       newBulkData[s._id] = existingAtt ? existingAtt.status : 'present'
    })
    setBulkData(newBulkData)
  }, [date, attendances, students])

  function handleBulkChange(enrollmentId, status) {
    setBulkData({ ...bulkData, [enrollmentId]: status })
  }

  async function handleBulkSubmit() {
    try {
      let items = Object.keys(bulkData).map(function (enrollmentId) {
        return { enrollmentId: enrollmentId, date: date, status: bulkData[enrollmentId], note: '' }
      })
      await attendanceService.createBulk({ records: items })
      setToast({ message: 'Điểm danh thành công', type: 'success' })
      setBulkData({})
      loadStudents(selectedCC)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <h1 className="text-2xl font-bold text-gray-800 font-display mb-6">Điểm danh</h1>

      <div className="flex gap-4 mb-6 items-end">
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Lớp học phần</label><select value={selectedCC} onChange={function (e) { loadStudents(e.target.value) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"><option value="">-- Chọn --</option>{courseClasses.map(function (cc) { return <option key={cc._id} value={cc._id}>{cc.subject?.name}</option> })}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày</label><input type="date" value={date} onChange={function (e) { setDate(e.target.value) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
        {selectedCC && <button onClick={handleBulkSubmit} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">Lưu điểm danh</button>}
      </div>

      {selectedCC && (
        <div className="bg-white rounded-xl shadow-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sinh viên</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">MSSV</th><th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Có mặt</th><th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vắng</th><th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Trễ</th></tr></thead><tbody>
          {students.map(function (enr, i) {
            let st = enr.student
            let current = bulkData[enr._id] || 'present'
            return (<tr key={enr._id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td><td className="px-5 py-3 text-sm font-medium text-gray-800">{st?.fullName}</td><td className="px-5 py-3 text-sm text-gray-500">{st?.studentCode}</td>
              <td className="px-5 py-3 text-center"><input type="radio" name={'att_' + enr._id} checked={current === 'present'} onChange={function () { handleBulkChange(enr._id, 'present') }} className="accent-green-500" /></td>
              <td className="px-5 py-3 text-center"><input type="radio" name={'att_' + enr._id} checked={current === 'absent'} onChange={function () { handleBulkChange(enr._id, 'absent') }} className="accent-red-500" /></td>
              <td className="px-5 py-3 text-center"><input type="radio" name={'att_' + enr._id} checked={current === 'late'} onChange={function () { handleBulkChange(enr._id, 'late') }} className="accent-yellow-500" /></td>
            </tr>)
          })}
          {students.length === 0 && <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400 text-sm">Chọn lớp học phần để điểm danh</td></tr>}
        </tbody></table></div>
      )}
    </div>
  )
}
export default AttendancesPage
