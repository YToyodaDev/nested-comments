import axios from 'axios'

const api = axios.create({
    // eslint-disable-next-line no-undef
    baseURL: process.env.REACT_APP_SERVER_URL,
    withCredentials: true,
})

export function makeRequest(url, options) {
    return api(url, options)
        .then((res) => res.data)
        .catch((error) =>
            Promise.reject(error?.response?.data?.message ?? 'Error')
        )
}
