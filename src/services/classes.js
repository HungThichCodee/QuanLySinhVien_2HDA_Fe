import { get, post, put, del } from './api.js'
export let getAll = () => get('/classes')
export let getById = (id) => get('/classes/' + id)
export let create = (data) => post('/classes', data)
export let update = (id, data) => put('/classes/' + id, data)
export let remove = (id) => del('/classes/' + id)
