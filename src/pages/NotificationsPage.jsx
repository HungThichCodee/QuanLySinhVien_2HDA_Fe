import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../contexts/SocketContext.jsx'
import * as service from '../services/notifications.service.js'
import Modal from '../components/ui/Modal.jsx'
import Toast from '../components/ui/Toast.jsx'
import * as userService from '../services/users.service.js'
import * as classService from '../services/classes.service.js'
import * as ccService from '../services/courseclasses.service.js'

function NotificationsPage() {
  let { isAdmin, isTeacher } = useAuth()
  let { socket } = useSocket()
  let [data, setData] = useState([])
  let [loading, setLoading] = useState(true)

  useEffect(function() {
    if (!socket) return;
    function handleNewNotif(newNotif) {
      setData(function(prev) { return [newNotif, ...prev] })
    }
    socket.on('new_notification', handleNewNotif)
    return function() {
      socket.off('new_notification', handleNewNotif)
    }
  }, [socket])
  let [modalOpen, setModalOpen] = useState(false)
  let [form, setForm] = useState({ title: '', content: '', targetType: 'all', targetId: '' })
  let [toast, setToast] = useState(null)

  let [users, setUsers] = useState([])
  let [classes, setClasses] = useState([])
  let [courseClasses, setCourseClasses] = useState([])

  useEffect(function () {
    service.getAll().then(function (r) { setData(Array.isArray(r) ? r : []); setLoading(false) }).catch(function () { setLoading(false) })
    
    if (isAdmin) {
      classService.getAll().then(function(c) { setClasses(Array.isArray(c) ? c : []) })
      userService.getAll().then(function(u) { setUsers(Array.isArray(u) ? u : []) })
      ccService.getAll().then(function(cc) { setCourseClasses(Array.isArray(cc) ? cc : []) })
    } else if (isTeacher) {
      ccService.getMyTeaching().then(function(cc) { setCourseClasses(Array.isArray(cc) ? cc : []) })
    }
  }, [isAdmin, isTeacher])

  async function markRead(id) {
    try { await service.markAsRead(id); setData(data.map(function (n) { return n._id === id ? { ...n, isRead: true } : n })) }
    catch (err) { console.log(err) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.targetType !== 'all' && !form.targetId) {
      setToast({ message: 'Vui lòng chọn đối tượng nhận', type: 'error' })
      return
    }
    try { let result = await service.create(form); setData([...(Array.isArray(result) ? result : [result]), ...data]); setModalOpen(false); setToast({ message: 'Gửi thông báo thành công', type: 'success' }) }
    catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  async function handleDelete(id) {
    try { await service.remove(id); setData(data.filter(function (n) { return n._id !== id })); setToast({ message: 'Xóa thành công', type: 'success' }) }
    catch (err) { setToast({ message: err.message, type: 'error' }) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  let unreadCount = data.filter(function (n) { return !n.isRead }).length

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800 font-display">Thông báo</h1>
          {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{unreadCount}</span>}
        </div>
        {(isAdmin || isTeacher) && <button onClick={function () { setForm({ title: '', content: '', targetType: 'all', targetId: '' }); setModalOpen(true) }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">+ Gửi thông báo</button>}
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
        {data.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Không có thông báo</p>}
      </div>

      <Modal isOpen={modalOpen} onClose={function () { setModalOpen(false) }} title="Gửi thông báo">
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề</label><input type="text" value={form.title} onChange={function (e) { setForm({ ...form, title: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gửi đến</label>
            <select value={form.targetType} onChange={function(e) { setForm({ ...form, targetType: e.target.value, targetId: '' }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="all">Tất cả mọi người</option>
              {isAdmin && <option value="class">Một Lớp hành chính</option>}
              <option value="courseclass">Một Lớp học phần</option>
              {isAdmin && <option value="user">Một Người dùng cụ thể</option>}
            </select>
          </div>

          {form.targetType === 'class' && (
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Chọn Lớp</label><select value={form.targetId} onChange={function(e){ setForm({...form, targetId: e.target.value}) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"><option value="">-- Chọn --</option>{classes.map(function(c){ return <option key={c._id} value={c._id}>{c.name}</option> })}</select></div>
          )}

          {form.targetType === 'courseclass' && (
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Chọn Lớp HP</label><select value={form.targetId} onChange={function(e){ setForm({...form, targetId: e.target.value}) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"><option value="">-- Chọn --</option>{courseClasses.map(function(cc){ return <option key={cc._id} value={cc._id}>{cc.subject?.name} - {cc.semester?.name}</option> })}</select></div>
          )}

          {form.targetType === 'user' && (
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1.5">Chọn người dùng</label><select value={form.targetId} onChange={function(e){ setForm({...form, targetId: e.target.value}) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"><option value="">-- Chọn --</option>{users.map(function(u){ return <option key={u._id} value={u._id}>{u.fullname || u.username} ({u.role})</option> })}</select></div>
          )}

          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1.5">Nội dung</label><textarea value={form.content} onChange={function (e) { setForm({ ...form, content: e.target.value }) }} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" rows="4" required></textarea></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={function () { setModalOpen(false) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">Hủy</button><button type="submit" className="px-4 py-2 rounded-lg text-sm bg-primary text-white font-semibold hover:bg-primary-dark">Gửi</button></div>
        </form>
      </Modal>
    </div>
  )
}
export default NotificationsPage
