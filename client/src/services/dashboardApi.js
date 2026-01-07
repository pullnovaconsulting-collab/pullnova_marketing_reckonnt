/**
 * @fileoverview API Service for Dashboard Analytics
 * @description Functions to fetch metrics and analytics data
 */

const API_BASE = '/api';

/**
 * Generic API request with auth
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
 * Get dashboard statistics
 * @returns {Promise<Object>} Dashboard stats including totals, trends, top content
 */
export async function getDashboardStats() {
    return apiRequest('/metricas/dashboard');
}

/**
 * Get KPIs for a specific period
 * @param {string} periodo - 'semana' | 'mes' | 'trimestre'
 * @returns {Promise<Object>} KPIs data
 */
export async function getKPIs(periodo = 'semana') {
    return apiRequest(`/metricas/kpis?periodo=${periodo}`);
}

/**
 * Get platform comparison
 * @param {string} desde - Start date (YYYY-MM-DD)
 * @param {string} hasta - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Comparison data
 */
export async function getComparativa(desde, hasta) {
    let url = '/metricas/comparativa';
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    if (params.toString()) url += `?${params.toString()}`;
    return apiRequest(url);
}

/**
 * Get daily summary
 * @param {string} desde - Start date
 * @param {string} hasta - End date
 * @param {string} plataforma - Platform filter
 * @returns {Promise<Object>} Daily summary data
 */
export async function getResumenDiario(desde, hasta, plataforma) {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    if (plataforma) params.append('plataforma', plataforma);
    return apiRequest(`/metricas/resumen-diario?${params.toString()}`);
}

export default {
    getDashboardStats,
    getKPIs,
    getComparativa,
    getResumenDiario,
};
