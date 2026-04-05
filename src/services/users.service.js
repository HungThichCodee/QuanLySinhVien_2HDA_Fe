import { get, post, put, del } from './api.js'
export let getAll = () => get('/users')
export let getById = (id) => get('/users/' + id)
export let create = (data) => post('/users', data)
export let update = (id, data) => put('/users/' + id, data)
export let remove = (id) => del('/users/' + id)
