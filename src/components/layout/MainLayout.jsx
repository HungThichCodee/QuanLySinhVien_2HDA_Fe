import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import { useAuth } from '../../hooks/useAuth'

function MainLayout() {
  let { user } = useAuth()

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 font-display">Quản Lý Sinh Viên</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Xin chào, <strong>{user?.fullName || user?.username}</strong></span>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
              {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
