import { get, post, put, del } from './api.js'
export let getAll = () => get('/notifications')
export let getUnread = () => get('/notifications/unread')
export let markAsRead = (id) => put('/notifications/' + id + '/read', {})
export let create = (data) => post('/notifications', data)
export let remove = (id) => del('/notifications/' + id)
