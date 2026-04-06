import { useState } from 'react'
import { useCRUD } from '../hooks/useCRUD'
import * as service from '../services/teachers.service.js'
import Toast from '../components/ui/Toast.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Modal from '../components/ui/Modal.jsx'
import { useEffect } from 'react'
import * as departmentService from '../services/departments.service.js'

function TeachersPage() {
  let { data, loading, createItem, updateItem, removeItem, fetchData } = useCRUD(service)
  let [departments, setDepartments] = useState([])
  let [modalOpen, setModalOpen] = useState(false)
  let [form, setForm] = useState({ username: '', password: '', email: '', fullName: '', phone: '', department: '' })
  let [confirmId, setConfirmId] = useState(null)
  let [editId, setEditId] = useState(null)
  let [toast, setToast] = useState(null)

  useEffect(function () { departmentService.getAll().then(setDepartments).catch(function () { }) }, [])

  async function handleSubmit(e) { 
    e.preventDefault(); 
    try { 
      if (editId) {
        let updateData = { ...form }
        if (!updateData.password) delete updateData.password // Don't update password if empty
        await updateItem(editId, updateData); 
        setToast({ message: 'Cập nhật GV thành công', type: 'success' }); 
      } else {
        await createItem(form); 
        setToast({ message: 'Tạo GV thành công', type: 'success' }); 
      }
      setModalOpen(false); 
      setEditId(null);
      fetchData() 
    } catch (err) { setToast({ message: err.message, type: 'error' }) } 
  }
  
  function handleEdit(item) {
    setEditId(item._id)
    setForm({ username: item.user?.username || '', password: '', email: item.email, fullName: item.fullName, phone: item.phone, department: item.department?._id || '' })
    setModalOpen(true)
  }

  async function handleDelete() { try { await removeItem(confirmId); setConfirmId(null); setToast({ message: 'Xóa thành công', type: 'success' }) } catch (err) { setToast({ message: err.message, type: 'error' }) } }
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold text-gray-800 font-display">Quản lý Giáo viên</h1><button onClick={function () { setEditId(null); setModalOpen(true); setForm({ username: '', password: '', email: '', fullName: '', phone: '', department: '' }) }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Thêm GV</button></div>
      <div className="bg-white rounded-xl shadow-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Họ tên</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">SĐT</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Khoa</th><th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th></tr></thead><tbody>
        {data.map(function (item, i) { return (<tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td><td className="px-5 py-3 text-sm font-medium text-gray-800">{item.fullName}</td><td className="px-5 py-3 text-sm text-gray-500">{item.email}</td><td className="px-5 py-3 text-sm text-gray-500">{item.phone}</td><td className="px-5 py-3 text-sm text-gray-500">{item.department?.name}</td><td className="px-5 py-3 text-right"><button onClick={function () { handleEdit(item) }} className="text-blue-500 hover:underline text-sm mr-3">Sửa</button><button onClick={function () { setConfirmId(item._id) }} className="text-red-500 hover:underline text-sm">Xóa</button></td></tr>) })}
        {data.length === 0 && <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400 text-sm">Không có dữ liệu</td></tr>}
      </tbody></table></div>
      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title={editId ? "Sửa Giáo viên" : "Thêm Giáo viên"}>
        <form onSubmit={handleSubmit}>
          {!editId && <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label><input type="text" value={form.username} onChange={function (e) { setForm({ ...form, username: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>}
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">{editId ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}</label><input type="text" value={form.password} onChange={function (e) { setForm({ ...form, password: e.target.value }) }} placeholder="VD: GiaoVien123@" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required={!editId} /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><input type="email" value={form.email} onChange={function (e) { setForm({ ...form, email: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Họ tên</label><input type="text" value={form.fullName} onChange={function (e) { setForm({ ...form, fullName: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">SĐT</label><input type="text" value={form.phone} onChange={function (e) { setForm({ ...form, phone: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1.5">Khoa</label><select value={form.department} onChange={function (e) { setForm({ ...form, department: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required><option value="">-- Chọn Khoa --</option>{departments.map(function (d) { return <option key={d._id} value={d._id}>{d.name}</option> })}</select></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button><button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">{editId ? "Cập nhật" : "Tạo mới"}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!confirmId} onClose={function () { setConfirmId(null) }} onConfirm={handleDelete} />
    </div>
  )
}
export default TeachersPage
