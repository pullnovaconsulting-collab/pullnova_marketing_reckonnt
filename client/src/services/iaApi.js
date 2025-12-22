/**
 * @fileoverview Servicio API para IA
 * @description Funciones para generación de contenido con IA (Gemini, OpenAI, DALL-E)
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

// ==================== ESTADO ====================

/**
 * Verifica el estado de los servicios de IA
 */
export async function getIAStatus() {
    return apiRequest('/ia/status');
}

// ==================== GENERACIÓN DE TEXTO ====================

/**
 * Genera copy de marketing
 * @param {Object} params - Parámetros de generación
 * @param {string} params.tema - Tema del post (requerido)
 * @param {string} params.plataforma - instagram|facebook|linkedin|twitter
 * @param {string} params.objetivo - educar|promocionar|convertir
 * @param {string} params.tono - Tono de voz
 * @param {number} params.variaciones - Número de versiones
 * @param {boolean} params.guardar - Si guardar como borrador
 * @param {number} params.campana_id - ID de campaña asociada
 * @param {string} params.modelo - gemini|openai|gpt-4
 */
export async function generarCopy(params) {
    return apiRequest('/ia/generar-copy', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/**
 * Genera ideas para calendario editorial
 * @param {Object} params - Parámetros
 * @param {string} params.tema - Tema general (requerido)
 * @param {number} params.cantidad - Número de ideas
 * @param {string[]} params.plataformas - Plataformas objetivo
 * @param {string} params.periodo - semana|mes
 * @param {string} params.modelo - gemini|openai|gpt-4
 */
export async function generarIdeas(params) {
    return apiRequest('/ia/generar-ideas', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/**
 * Mejora un texto existente
 * @param {Object} params - Parámetros
 * @param {string} params.texto - Texto original (requerido)
 * @param {string} params.instruccion - Tipo de mejora
 * @param {string} params.modelo - gemini|openai|gpt-4
 */
export async function mejorarTexto(params) {
    return apiRequest('/ia/mejorar-texto', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

// ==================== GENERACIÓN DE IMÁGENES ====================

/**
 * Genera un prompt optimizado para creación de imagen
 * @param {Object} params - Parámetros
 * @param {string} params.descripcion - Descripción de la imagen (requerido)
 * @param {string} params.estilo - Estilo visual
 * @param {string} params.colores - Paleta de colores
 * @param {string} params.tipo - ilustración|foto|minimalista
 */
export async function generarPromptImagen(params) {
    return apiRequest('/ia/generar-prompt-imagen', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/**
 * Genera una imagen con DALL-E 3
 * @param {Object} params - Parámetros
 * @param {string} params.prompt - Prompt para la imagen (requerido)
 * @param {number} params.contenido_id - ID del contenido a asociar
 * @param {string} params.size - 1024x1024|1792x1024|1024x1792
 * @param {string} params.quality - standard|hd
 * @param {string} params.style - vivid|natural
 */
export async function generarImagen(params) {
    return apiRequest('/ia/generar-imagen', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/**
 * Genera múltiples variaciones de imagen
 * @param {Object} params - Parámetros
 * @param {string} params.prompt - Prompt base (requerido)
 * @param {number} params.variaciones - Número de variaciones (max 4)
 * @param {string} params.size - Tamaño de las imágenes
 */
export async function generarVariacionesImagen(params) {
    return apiRequest('/ia/generar-variaciones-imagen', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/**
 * Obtiene imágenes asociadas a un contenido
 * @param {number} contenidoId - ID del contenido
 */
export async function getImagenesPorContenido(contenidoId) {
    return apiRequest(`/ia/imagenes/${contenidoId}`);
}

/**
 * Elimina una imagen
 * @param {number} id - ID de la imagen
 */
export async function eliminarImagen(id) {
    return apiRequest(`/ia/imagenes/${id}`, {
        method: 'DELETE',
    });
}

export default {
    getIAStatus,
    generarCopy,
    generarIdeas,
    mejorarTexto,
    generarPromptImagen,
    generarImagen,
    generarVariacionesImagen,
    getImagenesPorContenido,
    eliminarImagen,
};
