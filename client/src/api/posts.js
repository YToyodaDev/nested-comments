import { makeRequest } from './apiClient'
export function getPosts() {
    return makeRequest('/posts')
}
export function getPost(id) {
    const data = makeRequest(`/posts/${id}`)
    return data
}
