import axios from 'axios';

// Central axios instance used by every component in the app.
// baseURL is read from an environment variable so it works both locally and in production
// without changing any source code — just set REACT_APP_API_URL in the deployment environment.
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Request interceptor — runs automatically before EVERY request made with this instance.
// Attaches the stored JWT token to the Authorization header so routes don't need to do it manually.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handles 401 Unauthorized globally.
// When the JWT expires or is invalid, every request starts returning 401.
// Instead of each component handling that separately, we catch it once here:
// clear the dead token and send the user back to the login page.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestPath = error.config?.url || '';
        const isLoginRequest = requestPath.endsWith('/login') || requestPath.endsWith('/register');

        // Invalid credentials are handled by the login/register form itself.
        // Redirect only when an existing session fails on a protected request.
        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            window.location.href = '/login'; // hard redirect also resets React state
        }
        return Promise.reject(error);
    }
);

export default api;
