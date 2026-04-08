import { useState, useEffect } from 'react'
import { useCRUD } from '../hooks/useCRUD'
import * as service from '../services/semesters.js'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Toast from '../components/ui/Toast.jsx'

function SemestersPage() {
  let { data, loading, createItem, updateItem, removeItem } = useCRUD(service)
  let [modalOpen, setModalOpen] = useState(false)
  let [editItem, setEditItem] = useState(null)
  let [form, setForm] = useState({ name: '', startDate: '', endDate: '' })
  let [confirmId, setConfirmId] = useState(null)
  let [toast, setToast] = useState(null)
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

  function openCreate() { setEditItem(null); setForm({ name: '', startDate: '', endDate: '' }); setModalOpen(true) }
  function openEdit(item) { setEditItem(item); setForm({ name: item.name, startDate: item.startDate?.slice(0, 10) || '', endDate: item.endDate?.slice(0, 10) || '' }); setModalOpen(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editItem) { await updateItem(editItem._id, form); setToast({ message: 'Cập nhật thành công', type: 'success' }) }
      else { await createItem(form); setToast({ message: 'Tạo thành công', type: 'success' }) }
      setModalOpen(false)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  async function handleDelete() { try { await removeItem(confirmId); setConfirmId(null); setToast({ message: 'Xóa thành công', type: 'success' }) } catch (err) { setToast({ message: err.message, type: 'error' }) } }
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  let listData = displayData !== null ? displayData : data

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 font-display">Quản lý Học kỳ</h1>
        <div className="flex gap-2">
          <input type="text" value={searchKeyword} onChange={function (e) { setSearchKeyword(e.target.value) }} placeholder="Tìm kiếm học kỳ..." className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-52" />
          <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Thêm Học kỳ</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full"><thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tên</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Bắt đầu</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kết thúc</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
          </tr>
          {searchKeyword && <tr><td colSpan="5" className="px-5 py-1.5 text-xs text-gray-400 bg-gray-50">Kết quả tìm kiếm cho "{searchKeyword}"</td></tr>}
        </thead><tbody>
          {listData.map(function (item, i) {
            return (<tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td>
              <td className="px-5 py-3 text-sm font-medium text-gray-800">{item.name}</td>
              <td className="px-5 py-3 text-sm text-gray-500">{item.startDate?.slice(0, 10)}</td>
              <td className="px-5 py-3 text-sm text-gray-500">{item.endDate?.slice(0, 10)}</td>
              <td className="px-5 py-3 text-right">
                <button onClick={function () { openDetail(item) }} className="text-gray-500 hover:underline text-sm mr-3">Xem</button>
                <button onClick={function () { openEdit(item) }} className="text-primary hover:underline text-sm mr-3">Sửa</button>
                <button onClick={function () { setConfirmId(item._id) }} className="text-red-500 hover:underline text-sm">Xóa</button>
              </td>
            </tr>)
          })}
          {listData.length === 0 && <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400 text-sm">{searchKeyword ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}</td></tr>}
        </tbody></table>
      </div>
      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title={editItem ? 'Sửa Học kỳ' : 'Thêm Học kỳ'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Tên</label><input type="text" value={form.name} onChange={function (e) { setForm({ ...form, name: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Bắt đầu</label><input type="date" value={form.startDate} onChange={function (e) { setForm({ ...form, startDate: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1.5">Kết thúc</label><input type="date" value={form.endDate} onChange={function (e) { setForm({ ...form, endDate: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button><button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">{editItem ? 'Cập nhật' : 'Tạo mới'}</button></div>
        </form>
      </Modal>
      <Modal isOpen={detailModalOpen} onClose={function () { setDetailModalOpen(false) }} title="Chi tiết Học kỳ">
        {detailItem && (
          <div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Tên Học kỳ</span><p className="mt-1 text-sm text-gray-800 font-medium">{detailItem.name}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Bắt đầu</span><p className="mt-1 text-sm text-gray-600">{detailItem.startDate?.slice(0, 10) || '—'}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Kết thúc</span><p className="mt-1 text-sm text-gray-600">{detailItem.endDate?.slice(0, 10) || '—'}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">ID</span><p className="mt-1 text-xs text-gray-400 font-mono">{detailItem._id}</p></div>
            <div className="flex justify-end mt-4"><button onClick={function () { setDetailModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Đóng</button></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!confirmId} onClose={function () { setConfirmId(null) }} onConfirm={handleDelete} />
    </div>
  )
}
export default SemestersPage
