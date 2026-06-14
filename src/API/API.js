import axios from 'axios';

// A single axios instance for the whole app.
// Benefit: the server URL is defined in ONE place. If it changes
// (e.g. after deployment), you only edit it here instead of in every file.
const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// Request interceptor
// This runs automatically before EVERY request made with `api`.
// It reads the saved token and adds it to the Authorization header,
// so we don't have to attach it manually in each component.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;