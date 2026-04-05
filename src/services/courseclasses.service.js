import { get, post, put, del } from './api.js'
export let getAll = (query) => get('/courseclasses' + (query ? '?' + query : ''))
export let getById = (id) => get('/courseclasses/' + id)
export let getMyTeaching = () => get('/courseclasses/my/teaching')
export let create = (data) => post('/courseclasses', data)
export let update = (id, data) => put('/courseclasses/' + id, data)
export let remove = (id) => del('/courseclasses/' + id)
