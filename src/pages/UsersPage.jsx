import { useState } from 'react'
import { useCRUD } from '../hooks/useCRUD'
import * as service from '../services/users.service.js'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Toast from '../components/ui/Toast.jsx'

function UsersPage() {
  let { data, loading, createItem, removeItem } = useCRUD(service)
  let [modalOpen, setModalOpen] = useState(false)
  let [form, setForm] = useState({ username: '', password: '', email: '', role: 'STUDENT', fullname: '' })
  let [confirmId, setConfirmId] = useState(null)
  let [toast, setToast] = useState(null)

  function openCreate() { setForm({ username: '', password: '', email: '', role: 'STUDENT', fullname: '' }); setModalOpen(true) }
  async function handleSubmit(e) { e.preventDefault(); try { await createItem(form); setToast({ message: 'Tao thanh cong', type: 'success' }); setModalOpen(false) } catch (err) { setToast({ message: err.message, type: 'error' }) } }
  async function handleDelete() { try { await removeItem(confirmId); setConfirmId(null); setToast({ message: 'Xoa thanh cong', type: 'success' }) } catch (err) { setToast({ message: err.message, type: 'error' }) } }
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold text-gray-800 font-display">Quan ly Tai khoan</h1><button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Them Tai khoan</button></div>
      <div className="bg-white rounded-xl shadow-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Username</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th><th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tac</th></tr></thead><tbody>
        {data.map(function (item, i) { let roleColor = item.role === 'ADMIN' ? 'bg-red-100 text-red-700' : item.role === 'TEACHER' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'; return (<tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td><td className="px-5 py-3 text-sm font-medium text-gray-800">{item.username}</td><td className="px-5 py-3 text-sm text-gray-500">{item.email}</td><td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColor}`}>{item.role}</span></td><td className="px-5 py-3 text-right"><button onClick={function () { setConfirmId(item._id) }} className="text-red-500 hover:underline text-sm">Xoa</button></td></tr>) })}
        {data.length === 0 && <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400 text-sm">Khong co du lieu</td></tr>}
      </tbody></table></div>
      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title="Them Tai khoan">
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label><input type="text" value={form.username} onChange={function (e) { setForm({ ...form, username: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><input type="email" value={form.email} onChange={function (e) { setForm({ ...form, email: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Mat khau</label><input type="password" value={form.password} onChange={function (e) { setForm({ ...form, password: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Ho ten</label><input type="text" value={form.fullname} onChange={function (e) { setForm({ ...form, fullname: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label><select value={form.role} onChange={function (e) { setForm({ ...form, role: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"><option value="ADMIN">ADMIN</option><option value="TEACHER">TEACHER</option><option value="STUDENT">STUDENT</option></select></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Huy</button><button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">Tao moi</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!confirmId} onClose={function () { setConfirmId(null) }} onConfirm={handleDelete} />
    </div>
  )
}
export default UsersPage
