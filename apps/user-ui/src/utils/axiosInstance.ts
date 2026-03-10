import axios from 'axios';
import { runRedirectToLogin } from './redirect';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URI,
  withCredentials: true,
});

let isRefreshing = false;
type RefreshSubscriber = () => void;

let refreshSubscribers: RefreshSubscriber[] = [];

// Handle logout and prevent infinite loops
const handleLogout = () => {
  const publicPaths = ['/login', '/signup', '/forgot-password'];
  const currentPath = window.location.pathname;

  if (!publicPaths.includes(currentPath)) {
    runRedirectToLogin();
  }
};

// Handle adding a new access token to the queued requests
const subscribeTokenRefresh = (callback: () => void) => {
  refreshSubscribers.push(callback);
};

// Execute the queued requests after refresh
const onRefreshSuccess = () => {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

// Handle Api requests
axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// Handle expired token and refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const is401 = error?.response?.status === 401;
    const isRetry = originalRequest?._retry;
    const isAuthRequired = originalRequest?.requireAuth === true;

    if (is401 && isRetry && isAuthRequired) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => resolve(axiosInstance(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URI}/api/refresh`,
          {},
          { withCredentials: true },
        );

        isRefreshing = false;
        onRefreshSuccess();

        return axiosInstance(originalRequest);
      } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        handleLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
