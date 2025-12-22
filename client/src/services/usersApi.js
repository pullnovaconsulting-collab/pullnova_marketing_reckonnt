/**
 * @fileoverview Servicio API para Usuarios
 * @description Funciones para comunicarse con el backend de usuarios (CRUD)
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
 * Obtiene lista de usuarios con paginación
 * @param {number} page - Página actual (1-indexed)
 * @param {number} limit - Cantidad por página
 * @returns {Promise<Object>} Respuesta con usuarios y paginación
 */
export async function getUsers(page = 1, limit = 10) {
    return apiRequest(`/usuarios?page=${page}&limit=${limit}`);
}

/**
 * Obtiene un usuario por ID
 * @param {number} id - ID del usuario
 * @returns {Promise<Object>} Usuario
 */
export async function getUserById(id) {
    return apiRequest(`/usuarios/${id}`);
}

/**
 * Crea un nuevo usuario
 * @param {Object} userData - Datos del usuario (nombre, email, password, rol)
 * @returns {Promise<Object>} Usuario creado
 */
export async function createUser(userData) {
    return apiRequest('/usuarios', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

/**
 * Actualiza un usuario existente
 * @param {number} id - ID del usuario
 * @param {Object} userData - Datos a actualizar (nombre, email, rol, estado)
 * @returns {Promise<Object>} Usuario actualizado
 */
export async function updateUser(id, userData) {
    return apiRequest(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    });
}

/**
 * Elimina (desactiva) un usuario
 * @param {number} id - ID del usuario
 * @returns {Promise<Object>} Respuesta de confirmación
 */
export async function deleteUser(id) {
    return apiRequest(`/usuarios/${id}`, {
        method: 'DELETE',
    });
}

export default {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
