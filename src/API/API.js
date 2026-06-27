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

export default api;