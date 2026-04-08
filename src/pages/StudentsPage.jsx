import { useState, useEffect } from 'react'
import { useCRUD } from '../hooks/useCRUD'
import * as service from '../services/students.js'
import * as classService from '../services/classes.js'
import { postFormData } from '../services/api.js'
import Toast from '../components/ui/Toast.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Modal from '../components/ui/Modal.jsx'

function StudentsPage() {
  let { data, loading, createItem, updateItem, removeItem, fetchData } = useCRUD(service)
  let [classes, setClasses] = useState([])
  let [modalOpen, setModalOpen] = useState(false)
  let [form, setForm] = useState({ username: '', password: '', email: '', fullName: '', studentCode: '', phone: '', classId: '' })
  let [confirmId, setConfirmId] = useState(null)
  let [editId, setEditId] = useState(null)
  let [toast, setToast] = useState(null)
  let [excelModalOpen, setExcelModalOpen] = useState(false)
  let [excelFile, setExcelFile] = useState(null)
  let [importing, setImporting] = useState(false)
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
      setDetailItem(result)
      setDetailModalOpen(true)
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  useEffect(function () { classService.getAll().then(setClasses).catch(function () { }) }, [])

  async function handleSubmit(e) { 
    e.preventDefault(); 
    try { 
      if (editId) {
        let updateData = { ...form }
        if (!updateData.password) delete updateData.password
        if (updateData.classId !== undefined) {
          updateData.class = updateData.classId
          delete updateData.classId
        }
        await updateItem(editId, updateData); 
        setToast({ message: 'Cập nhật SV thành công', type: 'success' }); 
      } else {
        await createItem(form); 
        setToast({ message: 'Tạo SV thành công', type: 'success' }); 
      }
      setModalOpen(false); 
      setEditId(null);
      fetchData() 
    } catch (err) { setToast({ message: err.message, type: 'error' }) } 
  }
  
  function handleEdit(item) {
    setEditId(item._id)
    setForm({ username: item.user?.username || '', password: '', email: item.email, fullName: item.fullName, studentCode: item.studentCode, phone: item.phone, classId: item.class?._id || '' })
    setModalOpen(true)
  }

  async function handleDelete() { try { await removeItem(confirmId); setConfirmId(null); setToast({ message: 'Xóa thành công', type: 'success' }) } catch (err) { setToast({ message: err.message, type: 'error' }) } }
  async function handleExcelImport(e) {
    e.preventDefault()
    if (!excelFile) return
    setImporting(true)
    setToast({ message: 'Đang import, vui lòng chờ...', type: 'info' })
    try {
      let formData = new FormData()
      formData.append('file', excelFile)
      let result = await postFormData('/upload/excel', formData)
      let successCount = 0
      let failCount = 0
      if (Array.isArray(result)) {
        result.forEach(function (batch) {
          if (batch.success) { successCount += Array.isArray(batch.data) ? batch.data.length : 1 }
          else { failCount++ }
        })
      }
      setToast({ message: 'Import xong: ' + successCount + ' thành công, ' + failCount + ' lỗi', type: successCount > 0 ? 'success' : 'error' })
      setExcelModalOpen(false)
      setExcelFile(null)
      fetchData()
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setImporting(false)
    }
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
      fetchData()
    } catch (err) { setToast({ message: err.message, type: 'error' }) }
  }
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold text-gray-800 font-display">{trashMode ? 'Danh sách đã xóa Sinh viên' : 'Quản lý Sinh viên'}</h1><div className="flex gap-2">{!trashMode && <input type="text" value={searchKeyword} onChange={function (e) { setSearchKeyword(e.target.value) }} placeholder="Tìm MSSV, họ tên, email..." className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-52" />}<button onClick={toggleTrash} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${trashMode ? 'bg-gray-800 text-white hover:bg-gray-900' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{trashMode ? 'Quay lại' : 'Danh sách đã xóa'}</button>{!trashMode && <><button onClick={function () { setExcelModalOpen(true); setExcelFile(null) }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">Import Excel</button><button onClick={function () { setEditId(null); setModalOpen(true); setForm({ username: '', password: '', email: '', fullName: '', studentCode: '', phone: '', classId: '' }) }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Thêm SV</button></>}</div></div>
      {trashLoading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div> : (
      <div className="bg-white rounded-xl shadow-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">MSSV</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Họ tên</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Lớp</th><th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th></tr>
        {searchKeyword && !trashMode && <tr><td colSpan="6" className="px-5 py-1.5 text-xs text-gray-400 bg-gray-50">Kết quả tìm kiếm cho "{searchKeyword}"</td></tr>}
        </thead><tbody>
        {(trashMode ? trashData : (displayData !== null ? displayData : data)).map(function (item, i) { return (<tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-3 text-sm text-gray-500">{i + 1}</td><td className="px-5 py-3 text-sm font-medium text-primary">{item.studentCode}</td><td className="px-5 py-3 text-sm text-gray-800">{item.fullName}</td><td className="px-5 py-3 text-sm text-gray-500">{item.email}</td><td className="px-5 py-3 text-sm text-gray-500">{item.class?.name}</td><td className="px-5 py-3 text-right">{trashMode ? <button onClick={function () { handleRestore(item._id) }} className="text-green-600 hover:underline text-sm">Khôi phục</button> : <><button onClick={function () { openDetail(item) }} className="text-gray-500 hover:underline text-sm mr-3">Xem</button><button onClick={function () { handleEdit(item) }} className="text-blue-500 hover:underline text-sm mr-3">Sửa</button><button onClick={function () { setConfirmId(item._id) }} className="text-red-500 hover:underline text-sm">Xóa</button></>}</td></tr>) })}
        {(trashMode ? trashData : (displayData !== null ? displayData : data)).length === 0 && <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400 text-sm">{trashMode ? 'Danh sách xóa trống' : (searchKeyword ? 'Không tìm thấy kết quả' : 'Không có dữ liệu')}</td></tr>}
      </tbody></table></div>
      )}
      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title={editId ? "Sửa Sinh viên" : "Thêm Sinh viên"}>
        <form onSubmit={handleSubmit}>
          {!editId && <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label><input type="text" value={form.username} onChange={function (e) { setForm({ ...form, username: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>}
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">{editId ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}</label><input type="text" value={form.password} onChange={function (e) { setForm({ ...form, password: e.target.value }) }} placeholder="VD: SinhVien123@" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required={!editId} /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><input type="email" value={form.email} onChange={function (e) { setForm({ ...form, email: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Họ tên</label><input type="text" value={form.fullName} onChange={function (e) { setForm({ ...form, fullName: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">MSSV</label><input type="text" value={form.studentCode} onChange={function (e) { setForm({ ...form, studentCode: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">SĐT</label><input type="text" value={form.phone} onChange={function (e) { setForm({ ...form, phone: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1.5">Lớp</label><select value={form.classId} onChange={function (e) { setForm({ ...form, classId: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"><option value="">-- Chọn Lớp --</option>{classes.map(function (c) { return <option key={c._id} value={c._id}>{c.name}</option> })}</select></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button><button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">{editId ? "Cập nhật" : "Tạo mới"}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!confirmId} onClose={function () { setConfirmId(null) }} onConfirm={handleDelete} />
      <Modal isOpen={detailModalOpen} onClose={function () { setDetailModalOpen(false) }} title="Chi tiết Sinh viên">
        {detailItem && (
          <div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">MSSV</span><p className="mt-1 text-sm text-primary font-mono font-medium">{detailItem.studentCode}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Họ tên</span><p className="mt-1 text-sm text-gray-800 font-medium">{detailItem.fullName}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Email</span><p className="mt-1 text-sm text-gray-600">{detailItem.email}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">SĐT</span><p className="mt-1 text-sm text-gray-600">{detailItem.phone || '—'}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Lớp</span><p className="mt-1 text-sm text-gray-600">{detailItem.class?.name || '—'}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">Tài khoản</span><p className="mt-1 text-sm text-gray-500 font-mono">{detailItem.user?.username || '—'}</p></div>
            <div className="mb-3"><span className="text-xs font-semibold text-gray-500 uppercase">ID</span><p className="mt-1 text-xs text-gray-400 font-mono">{detailItem._id}</p></div>
            <div className="flex justify-end mt-4"><button onClick={function () { setDetailModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Đóng</button></div>
          </div>
        )}
      </Modal>
      <Modal isOpen={excelModalOpen} onClose={function () { setExcelModalOpen(false) }} title="Import danh sách sinh viên từ Excel">
        <form onSubmit={handleExcelImport}>
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-3">Chọn file Excel (.xlsx) với các cột theo thứ tự: <strong>MSSV, Họ tên, Email, SĐT, Tên Lớp, Mật khẩu</strong></p>
            <input type="file" accept=".xlsx,.xls" onChange={function (e) { setExcelFile(e.target.files[0] || null) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark" required />
          </div>
          {excelFile && <p className="text-xs text-gray-500 mb-4">File đã chọn: <strong>{excelFile.name}</strong> ({(excelFile.size / 1024).toFixed(1)} KB)</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={function () { setExcelModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={importing || !excelFile} className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">{importing ? 'Đang import...' : 'Import'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default StudentsPage
