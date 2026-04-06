import { get, post, postFormData } from './api.js'
export let getConversations = () => get('/messages')
export let getContacts = () => get('/messages/contacts')
export let getHistory = (userId) => get('/messages/' + userId)
export let sendMessage = (data) => post('/messages', data)
export let sendFileMessage = (formData) => postFormData('/messages', formData)
