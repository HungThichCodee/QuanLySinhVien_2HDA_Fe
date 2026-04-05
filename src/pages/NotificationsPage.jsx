import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as service from '../services/notifications.service.js'
import Modal from '../components/ui/Modal.jsx'
import Toast from '../components/ui/Toast.jsx'

function NotificationsPage() {
  let { isAdmin, isTeacher } = useAuth()
  let [data, setData] = useState([])
  let [loading, setLoading] = useState(true)
  let [modalOpen, setModalOpen] = useState(false)
  let [form, setForm] = useState({ title: '', content: '' })
  let [toast, setToast] = useState(null)

  useEffect(function () {
    service.getAll().then(function (r) { setData(Array.isArray(r) ? r : []); setLoading(false) }).catch(function () { setLoading(false) })
  }, [])

  async function markRead(id) {
    try { await service.markAsRead(id); setData(data.map(function (n) { return n._id === id ? { ...n, isRead: true } : n })) }
    catch (err) { console.log(err) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try { let result = await service.create(form); setData([result, ...data]); setModalOpen(false); setToast({ message: 'Gui thong bao thanh cong', type: 'success' }) }
    catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  async function handleDelete(id) {
    try { await service.remove(id); setData(data.filter(function (n) { return n._id !== id })); setToast({ message: 'Xoa thanh cong', type: 'success' }) }
    catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  let unreadCount = data.filter(function (n) { return !n.isRead }).length

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800 font-display">Thong bao</h1>
          {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{unreadCount}</span>}
        </div>
        {(isAdmin || isTeacher) && <button onClick={function () { setModalOpen(true) }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Gui thong bao</button>}
      </div>

      <div className="space-y-3">
        {data.map(function (n) {
          return (
            <div key={n._id} className={`p-4 rounded-xl border transition-colors ${n.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1" onClick={function () { if (!n.isRead) markRead(n._id) }}>
                  <h3 className="text-sm font-semibold text-gray-800">{n.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}</p>
                </div>
                <button onClick={function () { handleDelete(n._id) }} className="text-red-400 hover:text-red-600 text-sm ml-3">✕</button>
              </div>
            </div>
          )
        })}
        {data.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Khong co thong bao</p>}
      </div>

      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title="Gui thong bao">
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Tieu de</label><input type="text" value={form.title} onChange={function (e) { setForm({ ...form, title: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1.5">Noi dung</label><textarea value={form.content} onChange={function (e) { setForm({ ...form, content: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" rows="4" required></textarea></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Huy</button><button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">Gui</button></div>
        </form>
      </Modal>
    </div>
  )
}
export default NotificationsPage
