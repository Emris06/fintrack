import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const url = config.url || '';
  // Don't attach tokens to public auth endpoints
  if (url.startsWith('/api/auth/login') || url.startsWith('/api/auth/register')) {
    return config;
  }
  const stored = localStorage.getItem('fintrack-auth');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const reqUrl = originalRequest?.url || '';
    const isAuthEndpoint = reqUrl.startsWith('/api/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const stored = localStorage.getItem('fintrack-auth');
        if (!stored) throw new Error('No auth state');

        const { state } = JSON.parse(stored);
        if (!state?.refreshToken) throw new Error('No refresh token');

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || ''}/api/auth/refresh`,
          null,
          { headers: { Authorization: `Bearer ${state.refreshToken}` } },
        );

        const { accessToken, refreshToken } = response.data.data;

        const newState = {
          state: { ...state, accessToken, refreshToken },
          version: 0,
        };
        localStorage.setItem('fintrack-auth', JSON.stringify(newState));

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('fintrack-auth');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
