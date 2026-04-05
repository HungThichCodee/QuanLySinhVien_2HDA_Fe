let BASE_URL = '/api/v1'

function getHeaders() {
  let headers = { 'Content-Type': 'application/json' }
  let token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = 'Bearer ' + token
  }
  return headers
}

async function handleResponse(res) {
  let text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  if (!res.ok || res.status === 401 || res.status === 404) {
    if (Array.isArray(data)) {
      let msgs = data.map(function(d) { return Object.values(d)[0] }).join(', ')
      throw new Error(msgs)
    }
    throw new Error(typeof data === 'string' ? data : (data && data.message ? data.message : 'Request failed'))
  }
  return data
}

export async function get(endpoint) {
  let res = await fetch(BASE_URL + endpoint, { headers: getHeaders() })
  return handleResponse(res)
}

export async function post(endpoint, data) {
  let res = await fetch(BASE_URL + endpoint, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function put(endpoint, data) {
  let res = await fetch(BASE_URL + endpoint, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

export async function del(endpoint) {
  let res = await fetch(BASE_URL + endpoint, {
    method: 'DELETE',
    headers: getHeaders()
  })
  return handleResponse(res)
}

export async function postFormData(endpoint, formData) {
  let headers = {}
  let token = localStorage.getItem('token')
  if (token) { headers['Authorization'] = 'Bearer ' + token }
  let res = await fetch(BASE_URL + endpoint, {
    method: 'POST',
    headers: headers,
    body: formData
  })
  return handleResponse(res)
}
