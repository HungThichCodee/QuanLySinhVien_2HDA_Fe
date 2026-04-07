import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as gradeService from '../services/grades.js'
import * as courseClassService from '../services/courseclasses.js'
import Toast from '../components/ui/Toast.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'

function GradesPage() {
  let { isStudent, isTeacher, isAdmin } = useAuth()
  let [grades, setGrades] = useState([])
  let [courseClasses, setCourseClasses] = useState([])
  let [selectedCC, setSelectedCC] = useState('')
  let [loading, setLoading] = useState(true)
  let [toast, setToast] = useState(null)
  let [confirmData, setConfirmData] = useState(null)

  useEffect(function () {
    async function load() {
      try {
        if (isStudent) {
          let g = await gradeService.getMyGrades()
          setGrades(Array.isArray(g) ? g : [])
        }
        if (isTeacher) { let cc = await courseClassService.getMyTeaching(); setCourseClasses(cc) }
        if (isAdmin) { let cc = await courseClassService.getAll(); setCourseClasses(cc) }
      } catch (err) { console.log(err) }
      setLoading(false)
    }
    load()
  }, [isStudent, isTeacher, isAdmin])

  async function loadCCGrades(ccId) {
    setSelectedCC(ccId)
    try { let g = await gradeService.getByCourseClass(ccId); setGrades(Array.isArray(g) ? g : []) }
    catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  async function handleUpdate() {
    if (!confirmData) return
    let { gradeId, field, value } = confirmData
    try {
      let updated = await gradeService.update(gradeId, { [field]: parseFloat(value) })
      setGrades(grades.map(function (g) { return g._id === gradeId ? updated : g }))
      setToast({ message: 'Cập nhật điểm thành công', type: 'success' })
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
    finally { setConfirmData(null) }
  }

  function handleBlur(gradeId, field, value, oldValue) {
    if (parseFloat(value) !== parseFloat(oldValue)) {
      setConfirmData({ gradeId, field, value })
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <ConfirmDialog isOpen={!!confirmData} onClose={function () { setConfirmData(null) }} onConfirm={handleUpdate} title="Xác nhận" message="Bạn có chắc chắn muốn cập nhật điểm này không?" confirmText="Cập nhật" />
      <h1 className="text-2xl font-bold text-gray-800 font-display mb-6">{isStudent ? 'Bảng điểm cá nhân' : 'Quản lý Điểm'}</h1>

      {(isTeacher || isAdmin) && (
        <div className="mb-6"><label className="text-sm font-medium text-gray-700 mr-3">Chọn lớp học phần:</label>
          <select value={selectedCC} onChange={function (e) { loadCCGrades(e.target.value) }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option value="">-- Chọn --</option>{courseClasses.map(function (cc) { return <option key={cc._id} value={cc._id}>{cc.subject?.name} - {cc.semester?.name}</option> })}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
        {isStudent && <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Môn học</th>}
        {!isStudent && <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sinh viên</th>}
        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">CC</th><th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">GK</th><th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">CK</th><th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">TB</th></tr></thead><tbody>
        {grades.map(function (g, i) {
          return (<tr key={g._id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
            {isStudent && <td className="px-5 py-3 text-sm font-medium text-gray-800">{g.enrollment?.courseClass?.subject?.name || 'N/A'}</td>}
            {!isStudent && <td className="px-5 py-3 text-sm font-medium text-gray-800">{g.enrollment?.student?.fullName || g.enrollment?.student?.studentCode || 'N/A'}</td>}
            <td className="px-5 py-3 text-center">{(isTeacher || isAdmin) ? <input type="number" defaultValue={g.attendanceScore} onBlur={function (e) { handleBlur(g._id, 'attendanceScore', e.target.value, g.attendanceScore) }} className="w-16 px-2 py-1 rounded border border-gray-300 text-sm text-center" step="0.1" min="0" max="10" /> : <span className="text-sm">{g.attendanceScore ?? '-'}</span>}</td>
            <td className="px-5 py-3 text-center">{(isTeacher || isAdmin) ? <input type="number" defaultValue={g.midtermScore} onBlur={function (e) { handleBlur(g._id, 'midtermScore', e.target.value, g.midtermScore) }} className="w-16 px-2 py-1 rounded border border-gray-300 text-sm text-center" step="0.1" min="0" max="10" /> : <span className="text-sm">{g.midtermScore ?? '-'}</span>}</td>
            <td className="px-5 py-3 text-center">{(isTeacher || isAdmin) ? <input type="number" defaultValue={g.finalScore} onBlur={function (e) { handleBlur(g._id, 'finalScore', e.target.value, g.finalScore) }} className="w-16 px-2 py-1 rounded border border-gray-300 text-sm text-center" step="0.1" min="0" max="10" /> : <span className="text-sm">{g.finalScore ?? '-'}</span>}</td>
            <td className="px-5 py-3 text-center"><span className={`text-sm font-semibold ${g.averageScore >= 5 ? 'text-green-600' : 'text-red-500'}`}>{g.averageScore?.toFixed(1) ?? '-'}</span></td>
          </tr>)
        })}
        {grades.length === 0 && <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-400 text-sm">Không có dữ liệu</td></tr>}
      </tbody></table></div>
    </div>
  )
}
export default GradesPage
