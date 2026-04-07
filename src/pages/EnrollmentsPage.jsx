import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as enrollmentService from '../services/enrollments.js'
import * as courseClassService from '../services/courseclasses.js'
import * as attendanceService from '../services/attendances.js'
import Toast from '../components/ui/Toast.jsx'
import Modal from '../components/ui/Modal.jsx'

let DAY_LABELS = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7' }

function formatSchedule(schedule) {
  if (!schedule || !schedule.dayOfWeek) return ''
  return DAY_LABELS[schedule.dayOfWeek] + ' - Tiết ' + schedule.startPeriod + '-' + schedule.endPeriod
}

function EnrollmentsPage() {
  let { isStudent } = useAuth()
  let [enrollments, setEnrollments] = useState([])
  let [courseClasses, setCourseClasses] = useState([])
  let [cart, setCart] = useState([])
  let [loading, setLoading] = useState(true)
  let [submitting, setSubmitting] = useState(false)
  let [toast, setToast] = useState(null)
  let [attModalOpen, setAttModalOpen] = useState(false)
  let [selectedHistory, setSelectedHistory] = useState([])
  let [selectedClassTitle, setSelectedClassTitle] = useState('')
  let [selectedCC, setSelectedCC] = useState('')
  let [ccEnrollments, setCcEnrollments] = useState([])
  let [ccLoading, setCcLoading] = useState(false)

  async function loadData() {
    try {
      let PromiseFetchEnr = isStudent ? enrollmentService.getMyEnrollments() : Promise.resolve([])
      let [enr, cc] = await Promise.all([PromiseFetchEnr, courseClassService.getAll()])
      setEnrollments(Array.isArray(enr) ? enr : [])
      setCourseClasses(Array.isArray(cc) ? cc : [])
    } catch (err) { console.log(err) }
    setLoading(false)
  }

  useEffect(function () { loadData() }, [])

  async function openAttendanceHistory(enrollmentId, subjectName) {
    try {
      setSelectedClassTitle(subjectName)
      let atts = await attendanceService.getByEnrollment(enrollmentId)
      setSelectedHistory(Array.isArray(atts) ? atts : [])
      setAttModalOpen(true)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  let enrolledIds = enrollments.map(function (e) { return e.courseClass?._id || e.courseClass })
  let cartIds = cart.map(function (c) { return c._id })

  let availableClasses = courseClasses.filter(function (cc) {
    return !enrolledIds.includes(cc._id) && !cartIds.includes(cc._id)
  })

  let totalCredits = cart.reduce(function (sum, cc) { return sum + (cc.subject?.credits || 0) }, 0)

  function addToCart(cc) {
    setCart([...cart, cc])
  }

  function removeFromCart(ccId) {
    setCart(cart.filter(function (c) { return c._id !== ccId }))
  }

  async function handleSubmitCart() {
    if (cart.length === 0) return
    setSubmitting(true)
    let successCount = 0
    let errorMsg = ''
    for (let i = 0; i < cart.length; i++) {
      try {
        await enrollmentService.register(cart[i]._id)
        successCount++
      } catch (err) {
        errorMsg = cart[i].subject?.name + ': ' + err.message
        break
      }
    }
    if (errorMsg) {
      setToast({ message: (successCount > 0 ? successCount + ' lớp thành công. ' : '') + 'Lỗi — ' + errorMsg, type: 'error' })
    } else {
      setToast({ message: 'Đăng ký ' + successCount + ' lớp thành công', type: 'success' })
    }
    setCart([])
    await loadData()
    setSubmitting(false)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  if (!isStudent) {
    async function handleSelectCC(e) {
      let ccId = e.target.value
      setSelectedCC(ccId)
      if (!ccId) { setCcEnrollments([]); return }
      setCcLoading(true)
      try {
        let result = await enrollmentService.getByCourseClass(ccId)
        setCcEnrollments(Array.isArray(result) ? result : [])
      } catch (err) { setToast({ message: err.message, type: 'error' }) }
      setCcLoading(false)
    }

    let selectedClass = courseClasses.find(function (cc) { return cc._id === selectedCC })

    return (
      <div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
        <h1 className="text-2xl font-bold text-gray-800 font-display mb-6">Quản lý đăng ký học phần</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Chọn Lớp học phần</label>
          <select value={selectedCC} onChange={handleSelectCC} className="w-full max-w-md px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option value="">-- Chọn lớp HP --</option>
            {courseClasses.map(function (cc) {
              return <option key={cc._id} value={cc._id}>{cc.subject?.name} — {cc.semester?.name} — {formatSchedule(cc.schedule)} ({cc.currentStudents || 0}/{cc.maxStudents})</option>
            })}
          </select>
        </div>

        {selectedCC && (
          <>
            {selectedClass && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700"><strong>Môn:</strong> {selectedClass.subject?.name} | <strong>GV:</strong> {selectedClass.teacher?.fullName || selectedClass.teacher?.user?.fullName} | <strong>Phòng:</strong> {selectedClass.room} | <strong>Lịch:</strong> {formatSchedule(selectedClass.schedule)} | <strong>Sĩ số:</strong> {selectedClass.currentStudents || 0}/{selectedClass.maxStudents}</p>
              </div>
            )}
            {ccLoading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div> : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">MSSV</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Họ tên</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Ngày đăng ký</th>
                  </tr>
                </thead>
                <tbody>
                  {ccEnrollments.map(function (item, i) {
                    return (
                      <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                        <td className="px-5 py-3 text-sm font-medium text-primary">{item.student?.studentCode}</td>
                        <td className="px-5 py-3 text-sm text-gray-800">{item.student?.fullName}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{item.student?.email}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                      </tr>
                    )
                  })}
                  {ccEnrollments.length === 0 && <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400 text-sm">Chưa có sinh viên đăng ký</td></tr>}
                </tbody>
              </table>
            </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <h1 className="text-2xl font-bold text-gray-800 font-display mb-6">Đăng ký học phần</h1>

      <h2 className="text-lg font-semibold text-gray-700 mb-3">Lớp đã đăng ký thành công ({enrollments.length})</h2>
      <div className="bg-white rounded-xl shadow-card overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Môn học</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tín chỉ</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Học kỳ</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Lịch học</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Phòng</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">GV</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map(function (item, i) {
              let cc = item.courseClass
              return (
                <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{cc?.subject?.name || 'N/A'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{cc?.subject?.credits || '-'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{cc?.semester?.name || 'N/A'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatSchedule(cc?.schedule)}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{cc?.room}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{cc?.teacher?.fullName || cc?.teacher?.user?.fullName}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={function () { openAttendanceHistory(item._id, cc?.subject?.name) }} className="text-blue-500 hover:underline text-sm">Xem Điểm danh</button>
                  </td>
                </tr>
              )
            })}
            {enrollments.length === 0 && <tr><td colSpan="8" className="px-5 py-8 text-center text-gray-400 text-sm">Chưa đăng ký lớp nào</td></tr>}
          </tbody>
        </table>
      </div>

      {cart.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Danh sách chờ lưu ({cart.length} lớp — {totalCredits} tín chỉ)</h2>
          <div className="bg-white rounded-xl shadow-card overflow-hidden mb-2">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-amber-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Môn học</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tín chỉ</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Lịch học</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Phòng</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sĩ số</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(function (cc, i) {
                  return (
                    <tr key={cc._id} className="border-b border-gray-100 hover:bg-amber-50/50">
                      <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">{cc.subject?.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{cc.subject?.credits || '-'}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{formatSchedule(cc.schedule)}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{cc.room}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{cc.currentStudents || 0}/{cc.maxStudents}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={function () { removeFromCart(cc._id) }} className="text-red-500 hover:underline text-sm">Xóa</button>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-amber-50 border-t-2 border-amber-200">
                  <td colSpan="2" className="px-5 py-3 text-sm font-semibold text-gray-700">Tổng cộng</td>
                  <td className="px-5 py-3 text-sm font-bold text-primary">{totalCredits} TC</td>
                  <td colSpan="4"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mb-8">
            <button onClick={handleSubmitCart} disabled={submitting} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
              {submitting ? 'Đang xử lý...' : 'Xác nhận lưu đăng ký (' + cart.length + ' lớp)'}
            </button>
          </div>
        </>
      )}

      <h2 className="text-lg font-semibold text-gray-700 mb-3">Lớp học phần khả dụng ({availableClasses.length})</h2>
      {availableClasses.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Không còn lớp khả dụng để đăng ký</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableClasses.map(function (cc) {
            let isFull = cc.currentStudents >= cc.maxStudents
            return (
              <div key={cc._id} className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{cc.subject?.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{cc.subject?.credits || '?'} TC</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{cc.subject?.subjectCode}</p>
                <p className="text-sm text-gray-500 mb-1">GV: {cc.teacher?.fullName || cc.teacher?.user?.fullName}</p>
                <p className="text-sm text-gray-500 mb-1">Lịch: {formatSchedule(cc.schedule)}</p>
                <p className="text-sm text-gray-500 mb-1">Phòng: {cc.room}</p>
                <p className="text-sm text-gray-500 mb-3">Sĩ số: {cc.currentStudents || 0}/{cc.maxStudents}</p>
                <button onClick={function () { addToCart(cc) }}
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${isFull ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'}`}
                  disabled={isFull}>
                  {isFull ? 'Đã đầy' : 'Chọn'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={attModalOpen} onClose={function () { setAttModalOpen(false) }} title={'Lịch sử điểm danh: ' + selectedClassTitle}>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Ngày điểm danh</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {selectedHistory.map(function (att) {
                return (
                  <tr key={att._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-800">{new Date(att.date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-5 py-3 text-sm">
                      {att.status === 'present' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Có mặt</span>}
                      {att.status === 'absent' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Vắng mặt</span>}
                      {att.status === 'late' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium">Trễ</span>}
                    </td>
                  </tr>
                )
              })}
              {selectedHistory.length === 0 && <tr><td colSpan="2" className="px-5 py-8 text-center text-gray-400 text-sm">Chưa có dữ liệu điểm danh</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={function () { setAttModalOpen(false) }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Đóng</button>
        </div>
      </Modal>
    </div>
  )
}
export default EnrollmentsPage
