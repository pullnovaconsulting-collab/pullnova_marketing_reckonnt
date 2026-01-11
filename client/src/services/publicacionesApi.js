/**
 * @fileoverview API Service for Scheduled Publications
 * @description Functions to manage scheduled publications
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Helper function to get auth headers
const getConfig = () => ({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    }
});

/**
 * Get all scheduled publications with filters
 */
export const getPublicaciones = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.desde) params.append('desde', filters.desde);
    if (filters.hasta) params.append('hasta', filters.hasta);

    const queryString = params.toString();
    const url = `${API_URL}/publicaciones${queryString ? `?${queryString}` : ''}`;
    const response = await axios.get(url, getConfig());
    return response.data;
};

/**
 * Get a single publication by ID
 */
export const getPublicacionById = async (id) => {
    const response = await axios.get(`${API_URL}/publicaciones/${id}`, getConfig());
    return response.data;
};

/**
 * Create a new scheduled publication
 */
export const createPublicacion = async (data) => {
    const response = await axios.post(`${API_URL}/publicaciones`, data, getConfig());
    return response.data;
};

/**
 * Create multiple scheduled publications at once
 */
export const createMultiplePublicaciones = async (data) => {
    const response = await axios.post(`${API_URL}/publicaciones/multiple`, data, getConfig());
    return response.data;
};

/**
 * Cancel a scheduled publication
 */
export const cancelPublicacion = async (id) => {
    const response = await axios.delete(`${API_URL}/publicaciones/${id}`, getConfig());
    return response.data;
};

/**
 * Get publications for a specific content
 */
export const getPublicacionesByContenido = async (contenidoId) => {
    const response = await axios.get(`${API_URL}/publicaciones/contenido/${contenidoId}`, getConfig());
    return response.data;
};

/**
 * Get scheduled publications for calendar view
 */
export const getCalendario = async (mes, anio) => {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes);
    if (anio) params.append('anio', anio);

    const queryString = params.toString();
    const url = `${API_URL}/publicaciones/calendario${queryString ? `?${queryString}` : ''}`;
    const response = await axios.get(url, getConfig());
    return response.data;
};

/**
 * Get publication statistics
 */
export const getStats = async () => {
    const response = await axios.get(`${API_URL}/publicaciones/stats`, getConfig());
    return response.data;
};

/**
 * Reschedule a publication
 */
export const reprogramarPublicacion = async (id, nuevaFecha) => {
    const response = await axios.patch(`${API_URL}/publicaciones/${id}/reprogramar`, {
        fecha_programada: nuevaFecha
    }, getConfig());
    return response.data;
};

export default {
    getPublicaciones,
    getPublicacionById,
    createPublicacion,
    createMultiplePublicaciones,
    cancelPublicacion,
    getPublicacionesByContenido,
    getCalendario,
    getStats,
    reprogramarPublicacion
};
