import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCRUD } from '../hooks/useCRUD.js'
import * as service from '../services/courseclasses.service.js'
import * as semesterService from '../services/semesters.service.js'
import * as subjectService from '../services/subjects.service.js'
import * as teacherService from '../services/teachers.service.js'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Toast from '../components/ui/Toast.jsx'

function CourseClassesPage() {
  let { isAdmin, isTeacher } = useAuth()
  let { loading, error, fetchData, updateItem } = useCRUD(service)
  let [data, setData] = useState([])
  let [semesters, setSemesters] = useState([])
  let [subjects, setSubjects] = useState([])
  let [teachers, setTeachers] = useState([])
  let [modalOpen, setModalOpen] = useState(false)
  let [form, setForm] = useState({ semester: '', subject: '', teacher: '', maxStudents: 40, room: '', schedule: '' })
  let [confirmId, setConfirmId] = useState(null)
  let [editId, setEditId] = useState(null)
  let [toast, setToast] = useState(null)

  useEffect(function () {
    async function load() {
      try {
        let result = isTeacher ? await service.getMyTeaching() : await service.getAll()
        setData(Array.isArray(result) ? result : [])
        if (isAdmin) {
          let [s, sub, t] = await Promise.all([semesterService.getAll(), subjectService.getAll(), teacherService.getAll()])
          setSemesters(s); setSubjects(sub); setTeachers(t)
        }
      } catch (err) { console.log(err) }
      // setLoading(false) - managed by useCRUD but we overrode it, need to handle state properly in useCRUD or just ignore local loading
    }
    load()
  }, [isAdmin, isTeacher])

  async function handleSubmit(e) {
    e.preventDefault()
    try { 
      if (editId) {
        let updated = await service.update(editId, form)
        setData(data.map(function (d) { return d._id === editId ? updated : d }))
        setToast({ message: 'Cập nhật thành công', type: 'success' })
      } else {
        let result = await service.create(form); 
        setData([...data, result]); 
        setToast({ message: 'Tạo thành công', type: 'success' })
      }
      setModalOpen(false); 
      setEditId(null)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  function handleEdit(item) {
    setEditId(item._id)
    setForm({ semester: item.semester?._id || '', subject: item.subject?._id || '', teacher: item.teacher?._id || '', maxStudents: item.maxStudents || 40, room: item.room || '', schedule: item.schedule || '' })
    setModalOpen(true)
  }

  async function handleDelete() { try { await service.remove(confirmId); setData(data.filter(function (d) { return d._id !== confirmId })); setConfirmId(null); setToast({ message: 'Xóa thành công', type: 'success' }) } catch (err) { setToast({ message: err.message, type: 'error' }) } }
  // if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 font-display">{isTeacher ? 'Lớp học phần của tôi' : 'Quản lý Lớp học phần'}</h1>
        {isAdmin && <button onClick={function () { setEditId(null); setForm({ semester: '', subject: '', teacher: '', maxStudents: 40, room: '', schedule: '' }); setModalOpen(true) }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Thêm LHP</button>}
      </div>
      <div className="bg-white rounded-xl shadow-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Môn học</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Học kỳ</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">GV</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Phòng</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">SS</th>{isAdmin && <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>}</tr></thead><tbody>
        {data.map(function (item, i) { return (<tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td><td className="px-5 py-3 text-sm font-medium text-gray-800">{item.subject?.name}</td><td className="px-5 py-3 text-sm text-gray-500">{item.semester?.name}</td><td className="px-5 py-3 text-sm text-gray-500">{item.teacher?.fullName || item.teacher?.user?.fullName}</td><td className="px-5 py-3 text-sm text-gray-500">{item.room}</td><td className="px-5 py-3 text-sm text-gray-500">{item.currentStudents || 0}/{item.maxStudents}</td>{isAdmin && <td className="px-5 py-3 text-right"><button onClick={function () { handleEdit(item) }} className="text-blue-500 hover:underline text-sm mr-3">Sửa</button><button onClick={function () { setConfirmId(item._id) }} className="text-red-500 hover:underline text-sm">Xóa</button></td>}</tr>) })}
        {data.length === 0 && <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-400 text-sm">Không có dữ liệu</td></tr>}
      </tbody></table></div>
      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title={editId ? "Sửa Lớp học phần" : "Thêm Lớp học phần"}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Học kỳ</label><select value={form.semester} onChange={function (e) { setForm({ ...form, semester: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required><option value="">-- Chọn --</option>{semesters.map(function (s) { return <option key={s._id} value={s._id}>{s.name}</option> })}</select></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Môn học</label><select value={form.subject} onChange={function (e) { setForm({ ...form, subject: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required><option value="">-- Chọn --</option>{subjects.map(function (s) { return <option key={s._id} value={s._id}>{s.name}</option> })}</select></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Giáo viên</label><select value={form.teacher} onChange={function (e) { setForm({ ...form, teacher: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required><option value="">-- Chọn --</option>{teachers.map(function (t) { return <option key={t._id} value={t._id}>{t.fullName}</option> })}</select></div>
          <div className="grid grid-cols-2 gap-4 mb-4"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Sĩ số tối đa</label><input type="number" value={form.maxStudents} onChange={function (e) { setForm({ ...form, maxStudents: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phòng</label><input type="text" value={form.room} onChange={function (e) { setForm({ ...form, room: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1.5">Lịch học</label><input type="text" value={form.schedule} onChange={function (e) { setForm({ ...form, schedule: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="VD: Thu 2 - Tiet 1-3" /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button><button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">{editId ? "Cập nhật" : "Tạo mới"}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!confirmId} onClose={function () { setConfirmId(null) }} onConfirm={handleDelete} />
    </div>
  )
}
export default CourseClassesPage
