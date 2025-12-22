/**
 * @fileoverview Servicio API para Contenido
 * @description Funciones para comunicarse con el backend de contenido (CRUD)
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
 * Obtiene lista de contenido con paginación y filtros
 * @param {Object} filters - Filtros (page, limit, campana_id, estado, plataforma, tipo)
 */
export async function getContenidos(filters = {}) {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.campana_id) params.append('campana_id', filters.campana_id);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.plataforma) params.append('plataforma', filters.plataforma);
    if (filters.tipo) params.append('tipo', filters.tipo);

    const queryString = params.toString();
    return apiRequest(`/contenido${queryString ? `?${queryString}` : ''}`);
}

/**
 * Obtiene un contenido por ID
 * @param {number} id - ID del contenido
 */
export async function getContenidoById(id) {
    return apiRequest(`/contenido/${id}`);
}

/**
 * Crea nuevo contenido
 * @param {Object} contenidoData - Datos del contenido
 */
export async function createContenido(contenidoData) {
    return apiRequest('/contenido', {
        method: 'POST',
        body: JSON.stringify(contenidoData),
    });
}

/**
 * Actualiza contenido existente
 * @param {number} id - ID del contenido
 * @param {Object} contenidoData - Datos a actualizar
 */
export async function updateContenido(id, contenidoData) {
    return apiRequest(`/contenido/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contenidoData),
    });
}

/**
 * Cambia el estado del contenido
 * @param {number} id - ID del contenido
 * @param {string} estado - Nuevo estado
 */
export async function updateEstadoContenido(id, estado) {
    return apiRequest(`/contenido/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    });
}

/**
 * Elimina contenido
 * @param {number} id - ID del contenido
 */
export async function deleteContenido(id) {
    return apiRequest(`/contenido/${id}`, {
        method: 'DELETE',
    });
}

/**
 * Obtiene contenido pendiente de aprobación
 * @param {number} limit - Límite de resultados
 */
export async function getContenidosPendientes(limit = 10) {
    return apiRequest(`/contenido/pendientes?limit=${limit}`);
}

/**
 * Obtiene estadísticas de contenido
 */
export async function getContenidoStats() {
    return apiRequest('/contenido/stats');
}

export default {
    getContenidos,
    getContenidoById,
    createContenido,
    updateContenido,
    updateEstadoContenido,
    deleteContenido,
    getContenidosPendientes,
    getContenidoStats,
};
