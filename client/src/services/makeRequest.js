import axios from 'axios';

const api = axios.create({
  // eslint-disable-next-line no-undef
  baseURL: process.env.REACT_APP_SERVER_URL,
  withCredentials: true,
});

export async function makeRequest(url, options) {
  return api(url,options).then(res=> res.data).catch(error=> Promise.reject(error?.response?.data?.message ?? 'Error'))
  
  // try {
  //   const res = await axios(url, options);
  //   return res.data;
  // } catch (error) {
  //   console.log(error?.response?.data?.message ?? 'Error');
  // }
}
