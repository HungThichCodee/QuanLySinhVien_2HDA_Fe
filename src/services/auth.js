import { get, post } from './api.js'

export async function login(username, password) {
  return await post('/auth/login', { username, password })
}

export async function logout() {
  return await post('/auth/logout', {})
}

export async function getMe() {
  return await get('/auth/me')
}

export async function changePassword(oldpassword, newpassword) {
  return await post('/auth/changepassword', { oldpassword, newpassword })
}

export async function forgotPassword(email) {
  return await post('/auth/forgotpassword', { email })
}

export async function resetPassword(token, password) {
  return await post('/auth/resetpassword/' + token, { password })
}
