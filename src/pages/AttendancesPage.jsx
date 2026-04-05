import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as attendanceService from '../services/attendances.service.js'
import * as courseClassService from '../services/courseclasses.service.js'
import * as enrollmentService from '../services/enrollments.service.js'
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

  function handleBulkChange(enrollmentId, status) {
    setBulkData({ ...bulkData, [enrollmentId]: status })
  }

  async function handleBulkSubmit() {
    try {
      let items = Object.keys(bulkData).map(function (enrollmentId) {
        return { enrollment: enrollmentId, date: date, status: bulkData[enrollmentId] }
      })
      await attendanceService.createBulk({ attendances: items })
      setToast({ message: 'Diem danh thanh cong', type: 'success' })
      setBulkData({})
      loadStudents(selectedCC)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <h1 className="text-2xl font-bold text-gray-800 font-display mb-6">Diem danh</h1>

      <div className="flex gap-4 mb-6 items-end">
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Lop hoc phan</label><select value={selectedCC} onChange={function (e) { loadStudents(e.target.value) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"><option value="">-- Chon --</option>{courseClasses.map(function (cc) { return <option key={cc._id} value={cc._id}>{cc.subject?.name}</option> })}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Ngay</label><input type="date" value={date} onChange={function (e) { setDate(e.target.value) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
        {selectedCC && <button onClick={handleBulkSubmit} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">Luu diem danh</button>}
      </div>

      {selectedCC && (
        <div className="bg-white rounded-xl shadow-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sinh vien</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">MSSV</th><th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Co mat</th><th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vang</th><th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tre</th></tr></thead><tbody>
          {students.map(function (enr, i) {
            let st = enr.student
            let current = bulkData[enr._id] || 'PRESENT'
            return (<tr key={enr._id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td><td className="px-5 py-3 text-sm font-medium text-gray-800">{st?.fullName}</td><td className="px-5 py-3 text-sm text-gray-500">{st?.studentCode}</td>
              <td className="px-5 py-3 text-center"><input type="radio" name={'att_' + enr._id} checked={current === 'PRESENT'} onChange={function () { handleBulkChange(enr._id, 'PRESENT') }} className="accent-green-500" /></td>
              <td className="px-5 py-3 text-center"><input type="radio" name={'att_' + enr._id} checked={current === 'ABSENT'} onChange={function () { handleBulkChange(enr._id, 'ABSENT') }} className="accent-red-500" /></td>
              <td className="px-5 py-3 text-center"><input type="radio" name={'att_' + enr._id} checked={current === 'LATE'} onChange={function () { handleBulkChange(enr._id, 'LATE') }} className="accent-yellow-500" /></td>
            </tr>)
          })}
          {students.length === 0 && <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400 text-sm">Chon lop hoc phan de diem danh</td></tr>}
        </tbody></table></div>
      )}
    </div>
  )
}
export default AttendancesPage
