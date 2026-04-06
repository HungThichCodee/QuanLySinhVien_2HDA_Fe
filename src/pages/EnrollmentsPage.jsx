import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as enrollmentService from '../services/enrollments.service.js'
import * as courseClassService from '../services/courseclasses.service.js'
import Toast from '../components/ui/Toast.jsx'

function EnrollmentsPage() {
  let { isStudent } = useAuth()
  let [enrollments, setEnrollments] = useState([])
  let [courseClasses, setCourseClasses] = useState([])
  let [loading, setLoading] = useState(true)
  let [toast, setToast] = useState(null)

  useEffect(function () {
    async function load() {
      try {
        let PromiseFetchEnr = isStudent ? enrollmentService.getMyEnrollments() : enrollmentService.getAll()
        let [enr, cc] = await Promise.all([PromiseFetchEnr, courseClassService.getAll()])
        setEnrollments(Array.isArray(enr) ? enr : [])
        setCourseClasses(Array.isArray(cc) ? cc : [])
      } catch (err) { console.log(err) }
      setLoading(false)
    }
    load()
  }, [])

  let enrolledIds = enrollments.map(function (e) { return e.courseClass?._id || e.courseClass })

  async function handleRegister(ccId) {
    try { await enrollmentService.register(ccId); setToast({ message: 'Đăng ký thành công', type: 'success' }); let enr = isStudent ? await enrollmentService.getMyEnrollments() : await enrollmentService.getAll(); setEnrollments(Array.isArray(enr) ? enr : []) }
    catch (err) { setToast({ message: err.message, type: 'error' }) }
  }
  async function handleCancel(ccId) {
    try { await enrollmentService.cancel(ccId); setToast({ message: 'Hủy thành công', type: 'success' }); let enr = isStudent ? await enrollmentService.getMyEnrollments() : await enrollmentService.getAll(); setEnrollments(Array.isArray(enr) ? enr : []) }
    catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <h1 className="text-2xl font-bold text-gray-800 font-display mb-6">{isStudent ? 'Đăng ký học phần' : 'Quản lý đăng ký học phần'}</h1>

      {isStudent ? (
        <>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Lớp học phần đã đăng ký ({enrollments.length})</h2>
          <div className="bg-white rounded-xl shadow-card overflow-hidden mb-8"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Môn học</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Học kỳ</th><th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th></tr></thead><tbody>
            {enrollments.map(function (item, i) { let cc = item.courseClass; return (<tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td><td className="px-5 py-3 text-sm font-medium text-gray-800">{cc?.subject?.name || 'N/A'}</td><td className="px-5 py-3 text-sm text-gray-500">{cc?.semester?.name || 'N/A'}</td><td className="px-5 py-3 text-right"><button onClick={function () { handleCancel(cc?._id) }} className="text-red-500 hover:underline text-sm">Hủy ĐK</button></td></tr>) })}
            {enrollments.length === 0 && <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 text-sm">Chưa đăng ký lớp nào</td></tr>}
          </tbody></table></div>

          <h2 className="text-lg font-semibold text-gray-700 mb-3">Lớp học phần khả dụng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseClasses.filter(function (cc) { return !enrolledIds.includes(cc._id) }).map(function (cc) {
              return (
                <div key={cc._id} className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-1">{cc.subject?.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">Học kỳ: {cc.semester?.name}</p>
                  <p className="text-sm text-gray-500 mb-1">GV: {cc.teacher?.fullName || cc.teacher?.user?.fullName}</p>
                  <p className="text-sm text-gray-500 mb-3">Phòng: {cc.room} | {cc.currentStudents || 0}/{cc.maxStudents} SV</p>
                  <button onClick={function () { handleRegister(cc._id) }}
                    className="w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                    disabled={cc.currentStudents >= cc.maxStudents}>
                    {cc.currentStudents >= cc.maxStudents ? 'Đã đầy' : 'Đăng ký'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden mb-8"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sinh viên</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Môn học</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Học kỳ</th></tr></thead><tbody>
          {enrollments.map(function (item, i) { let cc = item.courseClass; return (<tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td><td className="px-5 py-3 text-sm font-medium text-gray-800">{item.student?.fullName || item.student?.studentCode}</td><td className="px-5 py-3 text-sm font-medium text-gray-800">{cc?.subject?.name || 'N/A'}</td><td className="px-5 py-3 text-sm text-gray-500">{cc?.semester?.name || 'N/A'}</td></tr>) })}
          {enrollments.length === 0 && <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 text-sm">Chưa có đăng ký nào</td></tr>}
        </tbody></table></div>
      )}
    </div>
  )
}
export default EnrollmentsPage
