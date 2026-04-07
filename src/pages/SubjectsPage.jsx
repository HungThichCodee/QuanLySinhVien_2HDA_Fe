import { useState } from 'react'
import { useCRUD } from '../hooks/useCRUD'
import * as service from '../services/subjects.js'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Toast from '../components/ui/Toast.jsx'

function SubjectsPage() {
  let { data, loading, createItem, updateItem, removeItem } = useCRUD(service)
  let [modalOpen, setModalOpen] = useState(false)
  let [editItem, setEditItem] = useState(null)
  let [form, setForm] = useState({ name: '', subjectCode: '', credits: '' })
  let [confirmId, setConfirmId] = useState(null)
  let [toast, setToast] = useState(null)

  function openCreate() { setEditItem(null); setForm({ name: '', subjectCode: '', credits: '' }); setModalOpen(true) }
  function openEdit(item) { setEditItem(item); setForm({ name: item.name, subjectCode: item.subjectCode, credits: item.credits }); setModalOpen(true) }
  async function handleSubmit(e) { e.preventDefault(); try { if (editItem) { await updateItem(editItem._id, form); setToast({ message: 'Cập nhật thành công', type: 'success' }) } else { await createItem(form); setToast({ message: 'Tạo mới thành công', type: 'success' }) }; setModalOpen(false) } catch (err) { setToast({ message: err.message, type: 'error' }) } }
  async function handleDelete() { try { await removeItem(confirmId); setConfirmId(null); setToast({ message: 'Xóa thành công', type: 'success' }) } catch (err) { setToast({ message: err.message, type: 'error' }) } }
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold text-gray-800 font-display">Quản lý Môn học</h1><button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Thêm Môn học</button></div>
      <div className="bg-white rounded-xl shadow-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Mã môn</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tên môn</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tín chỉ</th><th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th></tr></thead><tbody>
        {data.map(function (item, i) { return (<tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td><td className="px-5 py-3 text-sm font-medium text-primary">{item.subjectCode}</td><td className="px-5 py-3 text-sm text-gray-800">{item.name}</td><td className="px-5 py-3 text-sm text-gray-500">{item.credits}</td><td className="px-5 py-3 text-right"><button onClick={function () { openEdit(item) }} className="text-primary hover:underline text-sm mr-3">Sửa</button><button onClick={function () { setConfirmId(item._id) }} className="text-red-500 hover:underline text-sm">Xóa</button></td></tr>) })}
        {data.length === 0 && <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400 text-sm">Không có dữ liệu</td></tr>}
      </tbody></table></div>
      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title={editItem ? 'Sửa Môn học' : 'Thêm Môn học'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Mã môn</label><input type="text" value={form.subjectCode} onChange={function (e) { setForm({ ...form, subjectCode: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Tên môn</label><input type="text" value={form.name} onChange={function (e) { setForm({ ...form, name: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1.5">Số tín chỉ</label><input type="number" value={form.credits} onChange={function (e) { setForm({ ...form, credits: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" min="1" required /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button><button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">{editItem ? 'Cập nhật' : 'Tạo mới'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!confirmId} onClose={function () { setConfirmId(null) }} onConfirm={handleDelete} />
    </div>
  )
}
export default SubjectsPage
