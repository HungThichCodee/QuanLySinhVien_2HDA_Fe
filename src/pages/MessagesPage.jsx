import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as messageService from '../services/messages.js'
import * as userService from '../services/users.js'
import Modal from '../components/ui/Modal.jsx'

function MessagesPage() {
  let { user } = useAuth()
  let [conversations, setConversations] = useState([])
  let [selectedUser, setSelectedUser] = useState(null)
  let [messages, setMessages] = useState([])
  let [text, setText] = useState('')
  let [loading, setLoading] = useState(true)
  let [newChatModal, setNewChatModal] = useState(false)
  let [usersList, setUsersList] = useState([])
  let [searchQuery, setSearchQuery] = useState('')
  let chatEnd = useRef(null)
  let fileInput = useRef(null)

  useEffect(function () {
    messageService.getConversations().then(function (r) { setConversations(Array.isArray(r) ? r : []); setLoading(false) }).catch(function () { setLoading(false) })
  }, [])

  async function selectConversation(conv) {
    setSelectedUser(conv)
    try {
      let userId = typeof conv.user === 'string' ? conv.user : (conv._id || conv.user?._id)
      let msgs = await messageService.getHistory(userId)
      setMessages(Array.isArray(msgs) ? msgs : [])
      setTimeout(function () { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, 100)
    } catch (err) { console.log(err) }
  }

  async function openNewChat() {
    try {
      setSearchQuery('')
      let u = await messageService.getContacts()
      setUsersList(Array.isArray(u) ? u.filter(function(i) { return i._id !== user?._id }) : [])
      setNewChatModal(true)
    } catch (err) { console.log(err) }
  }

  function startChatWithUser(u) {
    setNewChatModal(false)
    let conv = { _id: u._id, fullName: u.fullname || u.username, user: u }
    // Add to top of list if not exists
    if (!conversations.find(function(c) { return c._id === u._id || c.user?._id === u._id || c.user === u._id })) {
      setConversations([conv, ...conversations])
    }
    selectConversation(conv)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || !selectedUser) return
    try {
      let userId = typeof selectedUser.user === 'string' ? selectedUser.user : (selectedUser._id || selectedUser.user?._id)
      await messageService.sendMessage({ to: userId, content: text })
      setText('')
      let msgs = await messageService.getHistory(userId)
      setMessages(Array.isArray(msgs) ? msgs : [])
      setTimeout(function () { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, 100)
    } catch (err) { console.log(err) }
  }

  async function handleFileSend(e) {
    let file = e.target.files[0]
    if (!file || !selectedUser) return
    try {
      let userId = typeof selectedUser.user === 'string' ? selectedUser.user : (selectedUser._id || selectedUser.user?._id)
      let formData = new FormData()
      formData.append('file', file)
      formData.append('to', userId)
      await messageService.sendFileMessage(formData)
      let msgs = await messageService.getHistory(userId)
      setMessages(Array.isArray(msgs) ? msgs : [])
      setTimeout(function () { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, 100)
    } catch (err) { console.log(err) }
    e.target.value = ''
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-card overflow-hidden">
      {/* Conversations list */}
      <div className="w-72 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Hội thoại</h2>
          <button onClick={openNewChat} className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm shadow hover:bg-primary-dark">+</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(function (conv, idx) {
            let convKey = conv._id || (typeof conv.user === 'string' ? conv.user : conv.user?._id) || idx
            let isActive = selectedUser && ((selectedUser._id && selectedUser._id === convKey) || (selectedUser.user === convKey))
            return (
              <div key={convKey} onClick={function () { selectConversation(conv) }}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <p className="text-sm font-medium text-gray-800 truncate">{conv.fullName || conv.username || conv.user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{conv.lastMessage || conv.message?.messageContent?.text || ''}</p>
              </div>
            )
          })}
          {conversations.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Chưa có hội thoại</p>}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">{selectedUser.fullName || selectedUser.username || selectedUser.user?.fullName}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(function (msg) {
                let isMe = msg.from === user?._id || msg.from?._id === user?._id
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                      {msg.messageContent?.type === 'file' ? (
                        function () {
                          let filePath = msg.messageContent?.text || ''
                          let fileUrl = filePath.startsWith('http') ? filePath : 'http://localhost:3000/' + filePath.replace(/\\/g, '/')
                          let isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filePath)
                          if (isImage) {
                            return <img src={fileUrl} alt="Ảnh" className="max-w-full rounded-lg cursor-pointer" onClick={function () { window.open(fileUrl, '_blank') }} />
                          }
                          return <a href={fileUrl} target="_blank" rel="noreferrer" className={`underline ${isMe ? 'text-white' : 'text-primary'}`}>📎 Tệp đính kèm</a>
                        }()
                      ) : (
                        msg.messageContent?.text || msg.messageContent?.content || msg.content || ''
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={chatEnd}></div>
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 flex gap-2">
              <input type="text" value={text} onChange={function (e) { setText(e.target.value) }} placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              <input type="file" ref={fileInput} onChange={handleFileSend} className="hidden" />
              <button type="button" onClick={function () { fileInput.current?.click() }} className="bg-gray-100 text-gray-600 px-3 py-2.5 rounded-full text-sm hover:bg-gray-200 transition-colors" title="Đính kèm file">+</button>
              <button type="submit" className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors">Gửi</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Chọn hội thoại để bắt đầu</div>
        )}
      </div>

      <Modal isOpen={newChatModal} onClose={function () { setNewChatModal(false) }} title="Tin nhắn mới">
        <div className="mb-4">
          <input type="text" value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value) }} placeholder="Tìm kiếm tên, tài khoản..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {usersList.filter(function(u) {
            let q = searchQuery.toLowerCase()
            return (u.fullname || '').toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
          }).map(function(u) {
            return (
              <div key={u._id} onClick={function() { startChatWithUser(u) }} className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.fullname || u.username}</p>
                  <p className="text-xs text-gray-500">{u.role}</p>
                </div>
                <span className="text-primary text-xs font-semibold">Nhắn tin</span>
              </div>
            )
          })}
          {usersList.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Không tìm thấy đối tượng nhắn tin</p>}
          {usersList.length > 0 && usersList.filter(function(u) {
            let q = searchQuery.toLowerCase()
            return (u.fullname || '').toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
          }).length === 0 && <p className="text-sm text-gray-500 text-center py-4">Không có kết quả tìm kiếm</p>}
        </div>
      </Modal>
    </div>
  )
}
export default MessagesPage
