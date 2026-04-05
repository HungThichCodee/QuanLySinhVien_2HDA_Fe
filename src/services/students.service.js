import { get, post, put, del } from './api.js'
export let getAll = () => get('/students')
export let getById = (id) => get('/students/' + id)
export let create = (data) => post('/students', data)
export let update = (id, data) => put('/students/' + id, data)
export let remove = (id) => del('/students/' + id)
