import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../hooks/useAuth'
import Toast from '../components/ui/Toast.jsx'

let SocketContext = createContext(null)

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }) {
  let { user, token } = useAuth()
  let [socket, setSocket] = useState(null)
  let [toast, setToast] = useState(null)
  let toastTimer = useRef(null)

  function showToast(message, type) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(function () { setToast(null) }, 5000)
  }

  useEffect(function () {
    if (!token || !user) return

    let newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', function () {
      console.log('[Socket] Connected:', newSocket.id)
      newSocket.emit('register', user._id)
    })

    newSocket.on('grade_updated', function (data) {
      showToast(data.message || 'Giáo viên vừa cập nhật điểm của bạn', 'info')
    })

    newSocket.on('new_notification', function (data) {
      showToast(data.title + ': ' + data.content, 'info')
    })

    newSocket.on('new_message', function (data) {
      showToast('Bạn có tin nhắn mới', 'info')
    })

    newSocket.on('disconnect', function () {
      console.log('[Socket] Disconnected')
    })

    setSocket(newSocket)

    return function () {
      newSocket.off('connect')
      newSocket.off('grade_updated')
      newSocket.off('new_notification')
      newSocket.off('new_message')
      newSocket.off('disconnect')
      newSocket.disconnect()
      setSocket(null)
    }
  }, [token, user])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={function () { setToast(null) }} />}
    </SocketContext.Provider>
  )
}
