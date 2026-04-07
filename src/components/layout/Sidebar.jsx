import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import ChangePasswordModal from '../auth/ChangePasswordModal.jsx'

let adminMenus = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/departments', label: 'Khoa' },
  { path: '/classes', label: 'Lớp' },
  { path: '/semesters', label: 'Học kỳ' },
  { path: '/subjects', label: 'Môn học' },
  { path: '/users', label: 'Tài khoản' },
  { path: '/teachers', label: 'Giáo viên' },
  { path: '/students', label: 'Sinh viên' },
  { path: '/courseclasses', label: 'Lớp học phần' },
  { path: '/enrollments', label: 'Đăng ký HP' },
  { path: '/notifications', label: 'Thông báo' },
  { path: '/messages', label: 'Tin nhắn' },
]

let teacherMenus = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/courseclasses', label: 'Lớp học phần' },
  { path: '/grades', label: 'Bảng điểm' },
  { path: '/attendances', label: 'Điểm danh' },
  { path: '/notifications', label: 'Thông báo' },
  { path: '/messages', label: 'Tin nhắn' },
]

let studentMenus = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/courseclasses', label: 'Lớp học phần' },
  { path: '/enrollments', label: 'Đăng ký HP' },
  { path: '/grades', label: 'Bảng điểm' },
  { path: '/notifications', label: 'Thông báo' },
  { path: '/messages', label: 'Tin nhắn' },
]

function Sidebar() {
  let { user, isAdmin, isTeacher, logout } = useAuth()
  let [collapsed, setCollapsed] = useState(false)
  let [changePasswordOpen, setChangePasswordOpen] = useState(false)

  let menus = isAdmin ? adminMenus : isTeacher ? teacherMenus : studentMenus

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-200`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && <h1 className="text-lg font-bold text-primary font-display">QLSV</h1>}
        <button onClick={function () { setCollapsed(!collapsed) }} className="text-gray-400 hover:text-primary p-1">
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {menus.map(function (item) {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={function ({ isActive }) {
                return `flex items-center px-4 py-2.5 mx-2 my-0.5 rounded-lg text-sm transition-colors ${isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`
              }}
            >
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        {!collapsed && (
          <div className="mb-2">
            <p className="text-sm font-medium text-gray-700 truncate">{user?.fullName || user?.username}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        )}
        <button onClick={function() { setChangePasswordOpen(true) }} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors w-full mb-3">
          {!collapsed && <span>Đổi mật khẩu</span>}
        </button>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors w-full">
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
      <ChangePasswordModal isOpen={changePasswordOpen} onClose={function() { setChangePasswordOpen(false) }} />
    </aside>
  )
}

export default Sidebar
