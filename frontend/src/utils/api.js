import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

const getPortalToken = () => {
  const pathname = window.location.pathname;
  const roleTokenKey = pathname.startsWith('/admin')
    ? 'adminToken'
    : pathname.startsWith('/counselor')
      ? 'counselorToken'
      : pathname.startsWith('/victim')
        ? 'victimToken'
        : null;

  return (roleTokenKey && localStorage.getItem(roleTokenKey)) || localStorage.getItem('token');
};

api.interceptors.request.use(
  (config) => {
    const token = getPortalToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/registration-status');
      const isAuthPage = ['/login', '/admin/login', '/counselor/login', '/track-application', '/register/victim'].includes(window.location.pathname);

      if (!isAuthEndpoint && !isAuthPage) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
