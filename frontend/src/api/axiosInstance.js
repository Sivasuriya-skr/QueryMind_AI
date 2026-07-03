import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let toastCallback = null;

export function setToastCallback(cb) {
  toastCallback = cb;
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && toastCallback) {
      const status = error.response.status;
      const data = error.response.data;
      const msg = data?.message || data?.error || 'Request failed';

      if (status === 401 && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (status === 429) {
        toastCallback('Rate limit exceeded. Please wait before trying again.', 'error');
      } else if (status >= 500) {
        toastCallback(msg, 'error');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
