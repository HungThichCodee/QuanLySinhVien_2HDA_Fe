import { useState, useEffect } from 'react'
import { useCRUD } from '../hooks/useCRUD'
import * as service from '../services/classes.js'
import * as departmentService from '../services/departments.js'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Toast from '../components/ui/Toast.jsx'

function ClassesPage() {
  let { data, loading, createItem, updateItem, removeItem, fetchData } = useCRUD(service)
  let [departments, setDepartments] = useState([])
  let [modalOpen, setModalOpen] = useState(false)
  let [editItem, setEditItem] = useState(null)
  let [form, setForm] = useState({ name: '', department: '' })
  let [confirmId, setConfirmId] = useState(null)
  let [toast, setToast] = useState(null)
  let [trashMode, setTrashMode] = useState(false)
  let [trashData, setTrashData] = useState([])
  let [trashLoading, setTrashLoading] = useState(false)
  let [restoreConfirmId, setRestoreConfirmId] = useState(null)
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
      setDetailItem(result)
      setDetailModalOpen(true)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  useEffect(function () { departmentService.getAll().then(setDepartments).catch(function () { }) }, [])

  function openCreate() { setEditItem(null); setForm({ name: '', department: '' }); setModalOpen(true) }
  function openEdit(item) { setEditItem(item); setForm({ name: item.name, department: item.department?._id || item.department }); setModalOpen(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editItem) { await updateItem(editItem._id, form); setToast({ message: 'Cập nhật thành công', type: 'success' }) }
      else { await createItem(form); setToast({ message: 'Tạo mới thành công', type: 'success' }) }
      setModalOpen(false)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  async function handleDelete() {
    try { await removeItem(confirmId); setConfirmId(null); setToast({ message: 'Xóa thành công', type: 'success' }) }
    catch (err) { setToast({ message: err.message, type: 'error' }) }
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

  async function handleRestore() {
    try {
      await service.restore(restoreConfirmId)
      setTrashData(trashData.filter(function (d) { return d._id !== restoreConfirmId }))
      setRestoreConfirmId(null)
      setToast({ message: 'Khôi phục Lớp thành công', type: 'success' })
      fetchData()
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 font-display">{trashMode ? 'Danh sách đã xóa Lớp' : 'Quản lý Lớp'}</h1>
        <div className="flex gap-2">
          {!trashMode && (
            <input
              type="text"
              value={searchKeyword}
              onChange={function (e) { setSearchKeyword(e.target.value) }}
              placeholder="Tìm kiếm lớp..."
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-52"
            />
          )}
          <button onClick={toggleTrash} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${trashMode ? 'bg-gray-800 text-white hover:bg-gray-900' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {trashMode ? 'Quay lại' : 'Danh sách đã xóa'}
          </button>
          {!trashMode && <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Thêm Lớp</button>}
        </div>
      </div>

      {trashLoading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div> : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tên Lớp</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Khoa</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
            </tr>
            {searchKeyword && !trashMode && <tr><td colSpan="4" className="px-5 py-1.5 text-xs text-gray-400 bg-gray-50">Kết quả tìm kiếm cho "{searchKeyword}"</td></tr>}
            </thead>
            <tbody>
              {(trashMode ? trashData : (displayData !== null ? displayData : data)).map(function (item, i) {
                return (<tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{item.department?.name || ''}</td>
                  <td className="px-5 py-3 text-right">
                    {trashMode ? (
                      <button onClick={function () { setRestoreConfirmId(item._id) }} className="text-green-600 hover:underline text-sm">Khôi phục</button>
                    ) : (
                      <>
                        <button onClick={function () { openDetail(item) }} className="text-gray-500 hover:underline text-sm mr-3">Xem</button>
                        <button onClick={function () { openEdit(item) }} className="text-primary hover:underline text-sm mr-3">Sửa</button>
                        <button onClick={function () { setConfirmId(item._id) }} className="text-red-500 hover:underline text-sm">Xóa</button>
                      </>
                    )}
                  </td>
                </tr>)
              })}
              {(trashMode ? trashData : (displayData !== null ? displayData : data)).length === 0 && (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 text-sm">{trashMode ? 'Danh sách xóa trống' : (searchKeyword ? 'Không tìm thấy kết quả' : 'Không có dữ liệu')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title={editItem ? 'Sửa Lớp' : 'Thêm Lớp'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên Lớp</label>
            <input type="text" value={form.name} onChange={function (e) { setForm({ ...form, name: e.target.value }) }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Khoa</label>
            <select value={form.department} onChange={function (e) { setForm({ ...form, department: e.target.value }) }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required>
              <option value="">-- Chọn Khoa --</option>
              {departments.map(function (d) { return <option key={d._id} value={d._id}>{d.name}</option> })}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">{editItem ? 'Cập nhật' : 'Tạo mới'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModalOpen} onClose={function () { setDetailModalOpen(false) }} title="Chi tiết Lớp">
        {detailItem && (
          <div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Tên Lớp</span><p className="mt-1 text-sm text-gray-800 font-medium">{detailItem.name}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Khoa</span><p className="mt-1 text-sm text-gray-600">{detailItem.department?.name || '—'}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">ID</span><p className="mt-1 text-xs text-gray-400 font-mono">{detailItem._id}</p></div>
            <div className="flex justify-end mt-4"><button onClick={function () { setDetailModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Đóng</button></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!confirmId} onClose={function () { setConfirmId(null) }} onConfirm={handleDelete} />
      <ConfirmDialog
        isOpen={!!restoreConfirmId}
        onClose={function () { setRestoreConfirmId(null) }}
        onConfirm={handleRestore}
        message="Xác nhận khôi phục Lớp này?"
        confirmText="Khôi phục"
        confirmColor="success"
      />
    </div>
  )
}

export default ClassesPage
