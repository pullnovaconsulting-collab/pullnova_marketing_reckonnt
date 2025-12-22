/**
 * @fileoverview Servicio API para Campañas
 * @description Funciones para comunicarse con el backend de campañas (CRUD)
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
 * Obtiene lista de campañas con paginación y filtros
 * @param {number} page - Página actual
 * @param {number} limit - Cantidad por página
 * @param {string} estado - Filtro por estado
 */
export async function getCampanas(page = 1, limit = 10, estado = '') {
    let url = `/campanas?page=${page}&limit=${limit}`;
    if (estado) url += `&estado=${estado}`;
    return apiRequest(url);
}

/**
 * Obtiene una campaña por ID
 * @param {number} id - ID de la campaña
 */
export async function getCampanaById(id) {
    return apiRequest(`/campanas/${id}`);
}

/**
 * Crea una nueva campaña
 * @param {Object} campanaData - Datos de la campaña
 */
export async function createCampana(campanaData) {
    return apiRequest('/campanas', {
        method: 'POST',
        body: JSON.stringify(campanaData),
    });
}

/**
 * Actualiza una campaña existente
 * @param {number} id - ID de la campaña
 * @param {Object} campanaData - Datos a actualizar
 */
export async function updateCampana(id, campanaData) {
    return apiRequest(`/campanas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(campanaData),
    });
}

/**
 * Cambia el estado de una campaña
 * @param {number} id - ID de la campaña
 * @param {string} estado - Nuevo estado
 */
export async function updateEstadoCampana(id, estado) {
    return apiRequest(`/campanas/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    });
}

/**
 * Elimina una campaña
 * @param {number} id - ID de la campaña
 */
export async function deleteCampana(id) {
    return apiRequest(`/campanas/${id}`, {
        method: 'DELETE',
    });
}

/**
 * Obtiene estadísticas de campañas
 */
export async function getCampanasStats() {
    return apiRequest('/campanas/stats');
}

export default {
    getCampanas,
    getCampanaById,
    createCampana,
    updateCampana,
    updateEstadoCampana,
    deleteCampana,
    getCampanasStats,
};
