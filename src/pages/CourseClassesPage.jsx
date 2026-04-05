import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as service from '../services/courseclasses.service.js'
import * as semesterService from '../services/semesters.service.js'
import * as subjectService from '../services/subjects.service.js'
import * as teacherService from '../services/teachers.service.js'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Toast from '../components/ui/Toast.jsx'

function CourseClassesPage() {
  let { isAdmin, isTeacher } = useAuth()
  let [data, setData] = useState([])
  let [loading, setLoading] = useState(true)
  let [semesters, setSemesters] = useState([])
  let [subjects, setSubjects] = useState([])
  let [teachers, setTeachers] = useState([])
  let [modalOpen, setModalOpen] = useState(false)
  let [form, setForm] = useState({ semester: '', subject: '', teacher: '', maxStudents: 40, room: '', schedule: '' })
  let [confirmId, setConfirmId] = useState(null)
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
      setLoading(false)
    }
    load()
  }, [isAdmin, isTeacher])

  async function handleSubmit(e) {
    e.preventDefault()
    try { let result = await service.create(form); setData([...data, result]); setModalOpen(false); setToast({ message: 'Tao thanh cong', type: 'success' }) }
    catch (err) { setToast({ message: err.message, type: 'error' }) }
  }
  async function handleDelete() { try { await service.remove(confirmId); setData(data.filter(function (d) { return d._id !== confirmId })); setConfirmId(null); setToast({ message: 'Xoa thanh cong', type: 'success' }) } catch (err) { setToast({ message: err.message, type: 'error' }) } }
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 font-display">{isTeacher ? 'Lop hoc phan cua toi' : 'Quan ly Lop hoc phan'}</h1>
        {isAdmin && <button onClick={function () { setModalOpen(true) }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Them LHP</button>}
      </div>
      <div className="bg-white rounded-xl shadow-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Mon hoc</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Hoc ky</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">GV</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Phong</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">SS</th>{isAdmin && <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tac</th>}</tr></thead><tbody>
        {data.map(function (item, i) { return (<tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td><td className="px-5 py-3 text-sm font-medium text-gray-800">{item.subject?.name}</td><td className="px-5 py-3 text-sm text-gray-500">{item.semester?.name}</td><td className="px-5 py-3 text-sm text-gray-500">{item.teacher?.fullName || item.teacher?.user?.fullName}</td><td className="px-5 py-3 text-sm text-gray-500">{item.room}</td><td className="px-5 py-3 text-sm text-gray-500">{item.currentStudents || 0}/{item.maxStudents}</td>{isAdmin && <td className="px-5 py-3 text-right"><button onClick={function () { setConfirmId(item._id) }} className="text-red-500 hover:underline text-sm">Xoa</button></td>}</tr>) })}
        {data.length === 0 && <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-400 text-sm">Khong co du lieu</td></tr>}
      </tbody></table></div>
      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title="Them Lop hoc phan">
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Hoc ky</label><select value={form.semester} onChange={function (e) { setForm({ ...form, semester: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required><option value="">-- Chon --</option>{semesters.map(function (s) { return <option key={s._id} value={s._id}>{s.name}</option> })}</select></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Mon hoc</label><select value={form.subject} onChange={function (e) { setForm({ ...form, subject: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required><option value="">-- Chon --</option>{subjects.map(function (s) { return <option key={s._id} value={s._id}>{s.name}</option> })}</select></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Giao vien</label><select value={form.teacher} onChange={function (e) { setForm({ ...form, teacher: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required><option value="">-- Chon --</option>{teachers.map(function (t) { return <option key={t._id} value={t._id}>{t.fullName}</option> })}</select></div>
          <div className="grid grid-cols-2 gap-4 mb-4"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Si so toi da</label><input type="number" value={form.maxStudents} onChange={function (e) { setForm({ ...form, maxStudents: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phong</label><input type="text" value={form.room} onChange={function (e) { setForm({ ...form, room: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1.5">Lich hoc</label><input type="text" value={form.schedule} onChange={function (e) { setForm({ ...form, schedule: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="VD: Thu 2 - Tiet 1-3" /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Huy</button><button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">Tao moi</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!confirmId} onClose={function () { setConfirmId(null) }} onConfirm={handleDelete} />
    </div>
  )
}
export default CourseClassesPage
