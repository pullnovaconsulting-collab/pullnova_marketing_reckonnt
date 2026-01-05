import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Configurar interceptor para incluir el token
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getStatus = async () => {
    const response = await axios.get(`${API_URL}/social/status`);
    return response.data;
};

export const getAuthUrl = async (platform) => {
    const response = await axios.get(`${API_URL}/social/${platform}/auth`);
    return response.data;
};

export const disconnectAccount = async (id) => {
    const response = await axios.delete(`${API_URL}/social/cuentas/${id}`);
    return response.data;
};
