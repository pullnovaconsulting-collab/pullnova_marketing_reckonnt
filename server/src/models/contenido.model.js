/**
 * @fileoverview Modelo de Contenido
 * @description Operaciones CRUD para la tabla contenido
 * @module models/contenido
 */

import { pool } from '../config/db.js';

/**
 * Obtiene todo el contenido con paginación y filtros
 * @param {Object} options - Opciones de consulta
 * @returns {Promise<Array>} Lista de contenido
 */
export const getAll = async ({
    limit = 10,
    offset = 0,
    campana_id = null,
    estado = null,
    plataforma = null,
    tipo = null
} = {}) => {
    let query = `
    SELECT c.*, 
           ca.nombre as campana_nombre,
           u.nombre as creador_nombre,
           (SELECT COUNT(*) FROM imagenes WHERE contenido_id = c.id) as total_imagenes
    FROM contenido c
    LEFT JOIN campanas ca ON c.campana_id = ca.id
    LEFT JOIN usuarios u ON c.created_by = u.id
    WHERE 1=1
  `;
    const params = [];

    if (campana_id) {
        query += ' AND c.campana_id = ?';
        params.push(campana_id);
    }
    if (estado) {
        query += ' AND c.estado = ?';
        params.push(estado);
    }
    if (plataforma) {
        query += ' AND c.plataforma = ?';
        params.push(plataforma);
    }
    if (tipo) {
        query += ' AND c.tipo = ?';
        params.push(tipo);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
};

/**
 * Cuenta el total de contenido con filtros
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<number>} Total de contenido
 */
export const count = async ({ campana_id = null, estado = null } = {}) => {
    let query = 'SELECT COUNT(*) as total FROM contenido WHERE 1=1';
    const params = [];

    if (campana_id) {
        query += ' AND campana_id = ?';
        params.push(campana_id);
    }
    if (estado) {
        query += ' AND estado = ?';
        params.push(estado);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
};

/**
 * Obtiene contenido por ID con datos relacionados
 * @param {number} id - ID del contenido
 * @returns {Promise<Object|null>} Contenido o null
 */
export const getById = async (id) => {
    const [rows] = await pool.query(
        `SELECT c.*, 
            ca.nombre as campana_nombre,
            u.nombre as creador_nombre
     FROM contenido c
     LEFT JOIN campanas ca ON c.campana_id = ca.id
     LEFT JOIN usuarios u ON c.created_by = u.id
     WHERE c.id = ?`,
        [id]
    );

    if (rows.length === 0) return null;

    // Obtener imágenes asociadas
    const [imagenes] = await pool.query(
        'SELECT * FROM imagenes WHERE contenido_id = ?',
        [id]
    );

    return {
        ...rows[0],
        imagenes
    };
};

/**
 * Crea nuevo contenido
 * @param {Object} data - Datos del contenido
 * @returns {Promise<Object>} Contenido creado
 */
export const create = async ({
    campana_id = null,
    titulo,
    contenido = null,
    copy_texto = null,
    tipo = 'post',
    plataforma = 'instagram',
    estado = 'pendiente',
    prompt_usado = null,
    modelo_ia = null,
    fecha_publicacion = null,
    created_by = null
}) => {
    const [result] = await pool.query(
        `INSERT INTO contenido 
     (campana_id, titulo, contenido, copy_texto, tipo, plataforma, estado, prompt_usado, modelo_ia, fecha_publicacion, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [campana_id, titulo, contenido, copy_texto, tipo, plataforma, estado, prompt_usado, modelo_ia, fecha_publicacion, created_by]
    );

    return {
        id: result.insertId,
        campana_id,
        titulo,
        contenido,
        copy_texto,
        tipo,
        plataforma,
        estado,
        prompt_usado,
        modelo_ia,
        fecha_publicacion,
        created_by
    };
};

/**
 * Actualiza contenido existente
 * @param {number} id - ID del contenido
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<boolean>} True si se actualizó
 */
export const update = async (id, data) => {
    const allowedFields = [
        'campana_id', 'titulo', 'contenido', 'copy_texto',
        'tipo', 'plataforma', 'estado', 'prompt_usado',
        'modelo_ia', 'fecha_publicacion'
    ];

    const fields = [];
    const values = [];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query(
        `UPDATE contenido SET ${fields.join(', ')} WHERE id = ?`,
        values
    );

    return result.affectedRows > 0;
};

/**
 * Cambia el estado del contenido
 * @param {number} id - ID del contenido
 * @param {string} estado - Nuevo estado
 * @returns {Promise<boolean>} True si se actualizó
 */
export const updateEstado = async (id, estado) => {
    const [result] = await pool.query(
        'UPDATE contenido SET estado = ? WHERE id = ?',
        [estado, id]
    );
    return result.affectedRows > 0;
};

/**
 * Elimina contenido
 * @param {number} id - ID del contenido
 * @returns {Promise<boolean>} True si se eliminó
 */
export const remove = async (id) => {
    // Las imágenes se eliminan automáticamente por CASCADE
    const [result] = await pool.query('DELETE FROM contenido WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

/**
 * Obtiene contenido por campaña
 * @param {number} campanaId - ID de la campaña
 * @returns {Promise<Array>} Lista de contenido
 */
export const getByCampana = async (campanaId) => {
    const [rows] = await pool.query(
        `SELECT c.*, 
            (SELECT COUNT(*) FROM imagenes WHERE contenido_id = c.id) as total_imagenes
     FROM contenido c
     WHERE c.campana_id = ?
     ORDER BY c.created_at DESC`,
        [campanaId]
    );
    return rows;
};

/**
 * Obtiene estadísticas de contenido
 * @returns {Promise<Object>} Estadísticas
 */
export const getStats = async () => {
    const [rows] = await pool.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
      SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
      SUM(CASE WHEN estado = 'programado' THEN 1 ELSE 0 END) as programados,
      SUM(CASE WHEN estado = 'publicado' THEN 1 ELSE 0 END) as publicados
    FROM contenido
  `);
    return rows[0];
};

/**
 * Obtiene contenido pendiente de aprobación
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Contenido pendiente
 */
export const getPendingApproval = async (limit = 10) => {
    const [rows] = await pool.query(
        `SELECT c.*, ca.nombre as campana_nombre
     FROM contenido c
     LEFT JOIN campanas ca ON c.campana_id = ca.id
     WHERE c.estado = 'pendiente'
     ORDER BY c.created_at ASC
     LIMIT ?`,
        [limit]
    );
    return rows;
};
