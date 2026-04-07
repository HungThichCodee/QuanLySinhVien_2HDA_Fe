import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import * as departmentService from '../services/departments.js'
import * as studentService from '../services/students.js'
import * as teacherService from '../services/teachers.js'
import * as courseClassService from '../services/courseclasses.js'
import * as notificationService from '../services/notifications.js'

function DashboardPage() {
  let { user, isAdmin, isTeacher, isStudent } = useAuth()
  let [stats, setStats] = useState({ departments: 0, students: 0, teachers: 0, courseClasses: 0 })
  let [notifications, setNotifications] = useState([])
  let [loading, setLoading] = useState(true)

  useEffect(function () {
    async function load() {
      try {
        let promises = []
        if (isAdmin) {
          promises = [
            departmentService.getAll(),
            studentService.getAll(),
            teacherService.getAll(),
            courseClassService.getAll()
          ]
          let [depts, studs, teachers, ccs] = await Promise.all(promises)
          setStats({
            departments: depts.length,
            students: studs.length,
            teachers: teachers.length,
            courseClasses: ccs.length
          })
        }
        let notifs = await notificationService.getAll()
        setNotifications(notifs.slice(0, 5))
      } catch (err) {
        console.log(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  let statCards = [
    { label: 'Khoa', value: stats.departments, color: 'bg-blue-50 text-blue-700' },
    { label: 'Sinh viên', value: stats.students, color: 'bg-green-50 text-green-700' },
    { label: 'Giáo viên', value: stats.teachers, color: 'bg-purple-50 text-purple-700' },
    { label: 'Lớp học phần', value: stats.courseClasses, color: 'bg-orange-50 text-orange-700' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 font-display mb-6">Dashboard</h1>
      <p className="text-gray-500 mb-8">Xin chào, <strong>{user?.fullName || user?.username}</strong> ({user?.role})</p>

      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(function (card) {
            return (
              <div key={card.label} className="bg-white rounded-xl shadow-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${card.color}`}>
                    {card.value}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="text-lg font-semibold text-gray-800 font-display mb-4">Thông báo gần nhất</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-400 text-sm">Không có thông báo</p>
        ) : (
          <div className="space-y-3">
            {notifications.map(function (n) {
              return (
                <div key={n._id} className={`p-3 rounded-lg border ${n.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                  <p className="text-sm font-medium text-gray-700">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{n.content}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
