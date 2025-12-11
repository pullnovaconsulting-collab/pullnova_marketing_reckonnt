/**
 * @fileoverview Utilidades generales del sistema
 * @description Funciones helper reutilizables
 * @module utils/helpers
 */

/**
 * Envuelve funciones async para manejar errores automáticamente
 * Evita tener try-catch en cada controlador
 * @param {Function} fn - Función async del controlador
 * @returns {Function} Middleware que captura errores
 * 
 * @example
 * // En lugar de:
 * export const getUsers = async (req, res) => {
 *   try { ... } catch (error) { res.status(500).json({ error }) }
 * };
 * 
 * // Usar:
 * export const getUsers = asyncHandler(async (req, res) => {
 *   // No necesita try-catch
 * });
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Formatea respuestas exitosas de manera consistente
 * @param {Response} res - Express response object
 * @param {Object} data - Datos a enviar
 * @param {string} message - Mensaje de éxito
 * @param {number} statusCode - Código HTTP (default 200)
 */
export const sendSuccess = (res, data = null, message = 'Operación exitosa', statusCode = 200) => {
    const response = {
        status: 'ok',
        message
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Formatea respuestas de error de manera consistente
 * @param {Response} res - Express response object
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código HTTP (default 400)
 * @param {Object} details - Detalles adicionales del error
 */
export const sendError = (res, message = 'Error en la operación', statusCode = 400, details = null) => {
    const response = {
        status: 'error',
        message
    };

    if (details !== null) {
        response.details = details;
    }

    return res.status(statusCode).json(response);
};

/**
 * Pagina resultados de consultas
 * @param {number} page - Número de página (1-indexed)
 * @param {number} limit - Cantidad por página
 * @returns {Object} { offset, limit, page }
 */
export const paginate = (page = 1, limit = 10) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    return { offset, limit: limitNum, page: pageNum };
};

/**
 * Construye objeto de respuesta paginada
 * @param {Array} data - Resultados
 * @param {number} total - Total de registros
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 */
export const paginatedResponse = (data, total, page, limit) => {
    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
};

/**
 * Sanitiza un objeto removiendo campos undefined/null
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto limpio
 */
export const sanitizeObject = (obj) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
    );
};

/**
 * Valida que los campos requeridos estén presentes
 * @param {Object} body - Request body
 * @param {Array<string>} requiredFields - Campos requeridos
 * @returns {Object} { valid: boolean, missing: Array }
 */
export const validateRequired = (body, requiredFields) => {
    const missing = requiredFields.filter(field => {
        const value = body[field];
        return value === undefined || value === null || value === '';
    });

    return {
        valid: missing.length === 0,
        missing
    };
};
