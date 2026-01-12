/**
 * @fileoverview Servicio API para autenticación
 * @description Funciones para comunicarse con el backend de autenticación
 */

const API_BASE = '/api';

/**
 * Realiza una petición al API con manejo de errores
 */
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
    }

    return data;
}

/**
 * Registra un nuevo usuario
 * @param {Object} userData - Datos del usuario (nombre, email, password)
 */
export async function register(userData) {
    return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

/**
 * Inicia sesión de usuario
 * @param {Object} credentials - Credenciales (email, password)
 */
export async function login(credentials) {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}

/**
 * Obtiene el perfil del usuario autenticado
 */
export async function getProfile() {
    return apiRequest('/auth/me');
}

/**
 * Cambia la contraseña del usuario
 * @param {Object} passwords - { currentPassword, newPassword }
 */
export async function changePassword(passwords) {
    return apiRequest('/auth/password', {
        method: 'PUT',
        body: JSON.stringify(passwords),
    });
}

/**
 * Obtiene estadísticas del sistema
 */
export async function getStats() {
    return apiRequest('/metricas/dashboard');
}

/**
 * Obtiene el estado de salud del servidor
 */
export async function getHealth() {
    return apiRequest('/health');
}

export default {
    register,
    login,
    getProfile,
    changePassword,
    getStats,
    getHealth,
};
