import { useState, useEffect } from 'react'
import { useCRUD } from '../hooks/useCRUD'
import * as service from '../services/users.js'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Toast from '../components/ui/Toast.jsx'

function UsersPage() {
  let { data, loading, updateItem, removeItem } = useCRUD(service)
  let [modalOpen, setModalOpen] = useState(false)
  let [form, setForm] = useState({ username: '', password: '', email: '', role: 'STUDENT', fullname: '' })
  let [confirmId, setConfirmId] = useState(null)
  let [editId, setEditId] = useState(null)
  let [toast, setToast] = useState(null)
  let [trashMode, setTrashMode] = useState(false)
  let [trashData, setTrashData] = useState([])
  let [trashLoading, setTrashLoading] = useState(false)
  let [searchKeyword, setSearchKeyword] = useState('')
  let [displayData, setDisplayData] = useState(null)
  let [detailItem, setDetailItem] = useState(null)
  let [detailModalOpen, setDetailModalOpen] = useState(false)

  useEffect(function () {
    if (!searchKeyword.trim()) { setDisplayData(null); return }
    let timer = setTimeout(async function () {
      try {
        let result = await service.search(searchKeyword)
        setDisplayData(Array.isArray(result) ? result : [])
      } catch (err) { setToast({ message: err.message, type: 'error' }) }
    }, 400)
    return function () { clearTimeout(timer) }
  }, [searchKeyword])

  async function openDetail(item) {
    try {
      let result = await service.getById(item._id)
      setDetailItem(Array.isArray(result) ? result[0] : result)
      setDetailModalOpen(true)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }


  async function handleSubmit(e) {
    e.preventDefault()
    try {
      let updateData = { ...form }
      if (!updateData.password) delete updateData.password
      await updateItem(editId, updateData)
      setToast({ message: 'Cập nhật thành công', type: 'success' })
      setModalOpen(false)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  function handleEdit(item) {
    setEditId(item._id)
    setForm({ username: item.username, password: '', email: item.email, role: item.role, fullname: item.fullname || '' })
    setModalOpen(true)
  }

  async function handleDelete() {
    try {
      await removeItem(confirmId)
      setConfirmId(null)
      setToast({ message: 'Xóa thành công', type: 'success' })
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  async function toggleTrash() {
    if (!trashMode) {
      setTrashLoading(true)
      try {
        let result = await service.getTrash()
        setTrashData(Array.isArray(result) ? result : [])
      } catch (err) { setToast({ message: err.message, type: 'error' }) }
      setTrashLoading(false)
    }
    setTrashMode(!trashMode)
  }

  async function handleRestore(id) {
    try {
      await service.restore(id)
      setTrashData(trashData.filter(function (d) { return d._id !== id }))
      setToast({ message: 'Khôi phục thành công', type: 'success' })
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 font-display">{trashMode ? 'Danh sách đã xóa Tài khoản' : 'Quản lý Tài khoản'}</h1>
        <div className="flex gap-2">
          {!trashMode && (
            <input type="text" value={searchKeyword} onChange={function (e) { setSearchKeyword(e.target.value) }} placeholder="Tìm theo username, email..." className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-56" />
          )}
          <button onClick={toggleTrash} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${trashMode ? 'bg-gray-800 text-white hover:bg-gray-900' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{trashMode ? 'Quay lại' : 'Danh sách đã xóa'}</button>
        </div>
      </div>
      {trashLoading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div> : (
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tên đăng nhập</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vai trò</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
            </tr>
            {searchKeyword && !trashMode && <tr><td colSpan="5" className="px-5 py-1.5 text-xs text-gray-400 bg-gray-50">Kết quả tìm kiếm cho "{searchKeyword}"</td></tr>}
          </thead>
          <tbody>
            {(trashMode ? trashData : (displayData !== null ? displayData : data)).map(function (item, i) {
              let roleColor = item.role === 'ADMIN' ? 'bg-red-100 text-red-700' : item.role === 'TEACHER' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
              return (
                <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{item.username}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{item.email}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColor}`}>{item.role}</span></td>
                  <td className="px-5 py-3 text-right">
                    {trashMode ? (
                      <button onClick={function () { handleRestore(item._id) }} className="text-green-600 hover:underline text-sm">Khôi phục</button>
                    ) : (
                      <>
                        <button onClick={function () { openDetail(item) }} className="text-gray-500 hover:underline text-sm mr-3">Xem</button>
                        <button onClick={function () { handleEdit(item) }} className="text-blue-500 hover:underline text-sm mr-3">Sửa</button>
                        <button onClick={function () { setConfirmId(item._id) }} className="text-red-500 hover:underline text-sm">Xóa</button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
            {(trashMode ? trashData : (displayData !== null ? displayData : data)).length === 0 && <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400 text-sm">{trashMode ? 'Danh sách xóa trống' : (searchKeyword ? 'Không tìm thấy kết quả' : 'Không có dữ liệu')}</td></tr>}
          </tbody>
        </table>
      </div>
      )}
      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title={editId ? "Sửa Tài khoản" : "Thêm Tài khoản"}>
        <form onSubmit={handleSubmit}>
          {!editId && <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label><input type="text" value={form.username} onChange={function (e) { setForm({ ...form, username: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>}
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><input type="email" value={form.email} onChange={function (e) { setForm({ ...form, email: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">{editId ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}</label><input type="password" value={form.password} onChange={function (e) { setForm({ ...form, password: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required={!editId} /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Họ tên</label><input type="text" value={form.fullname} onChange={function (e) { setForm({ ...form, fullname: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1.5">Vai trò</label><select value={form.role} onChange={function (e) { setForm({ ...form, role: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"><option value="ADMIN">ADMIN</option><option value="TEACHER">TEACHER</option><option value="STUDENT">STUDENT</option></select></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button><button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">{editId ? "Cập nhật" : "Tạo mới"}</button></div>
        </form>
      </Modal>
      <Modal isOpen={detailModalOpen} onClose={function () { setDetailModalOpen(false) }} title="Chi tiết Tài khoản">
        {detailItem && (
          <div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Tên đăng nhập</span><p className="mt-1 text-sm text-gray-800 font-medium font-mono">{detailItem.username}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Email</span><p className="mt-1 text-sm text-gray-600">{detailItem.email}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Vai trò</span><p className="mt-1"><span className={`px-2 py-1 rounded-full text-xs font-medium ${detailItem.role === 'ADMIN' ? 'bg-red-100 text-red-700' : detailItem.role === 'TEACHER' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{detailItem.role}</span></p></div>
            {detailItem.profileInfo ? (
              <>
                <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Họ tên</span><p className="mt-1 text-sm text-gray-800 font-medium">{detailItem.profileInfo.fullName || '—'}</p></div>
                <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">{detailItem.profileInfo.unitLabel}</span><p className="mt-1 text-sm text-gray-600">{detailItem.profileInfo.unitName || '—'}</p></div>
              </>
            ) : (
              <div className="mb-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200"><p className="text-xs text-gray-400 italic">Chưa liên kết với {detailItem.role === 'STUDENT' ? 'Sinh viên' : detailItem.role === 'TEACHER' ? 'Giáo viên' : 'hồ sơ'} nào</p></div>
            )}
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">ID</span><p className="mt-1 text-xs text-gray-400 font-mono">{detailItem._id}</p></div>
            <div className="flex justify-end mt-4"><button onClick={function () { setDetailModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Đóng</button></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!confirmId} onClose={function () { setConfirmId(null) }} onConfirm={handleDelete} />
    </div>
  )
}
export default UsersPage
