import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URI,
  withCredentials: true,
});

// Track refresh state
let isRefreshing = false;

// Queue pending requests while refreshing
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}[] = [];

// Process queued requests after refresh
const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(true);
    }
  });

  failedQueue = [];
};

// Handle logout safely
const handleLogout = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
};
// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    // Only handle 401
    if (status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        // Queue requests while refresh happens
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(axiosInstance(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token request
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URI}/api/refresh`,
          {},
          { withCredentials: true },
        );

        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
