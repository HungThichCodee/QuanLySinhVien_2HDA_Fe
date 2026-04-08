import { get, post, put, del } from './api.js'
export let getAll = () => get('/teachers')
export let search = (keyword) => get('/teachers?keyword=' + encodeURIComponent(keyword))
export let getById = (id) => get('/teachers/' + id)
export let create = (data) => post('/teachers', data)
export let update = (id, data) => put('/teachers/' + id, data)
export let remove = (id) => del('/teachers/' + id)
export let getTrash = () => get('/teachers/trash')
export let restore = (id) => put('/teachers/' + id + '/restore', {})
