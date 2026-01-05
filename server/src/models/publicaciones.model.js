/**
 * @fileoverview Modelo de Publicaciones Programadas
 * @description Operaciones para la tabla publicaciones_programadas
 * @module models/publicaciones
 */

import { pool } from '../config/db.js';

/**
 * Obtiene todas las publicaciones programadas con paginación
 * @param {Object} options - Opciones de consulta
 * @returns {Promise<Array>} Lista de publicaciones
 */
export const getAll = async ({ limit = 10, offset = 0, estado = null } = {}) => {
    let query = `
        SELECT pp.*, 
               c.titulo as contenido_titulo,
               c.plataforma as contenido_plataforma,
               cs.nombre_cuenta,
               cs.plataforma as cuenta_plataforma
        FROM publicaciones_programadas pp
        LEFT JOIN contenido c ON pp.contenido_id = c.id
        LEFT JOIN cuentas_sociales cs ON pp.cuenta_social_id = cs.id
    `;
    const params = [];

    if (estado) {
        query += ' WHERE pp.estado = ?';
        params.push(estado);
    }

    query += ' ORDER BY pp.fecha_programada ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
};

/**
 * Cuenta el total de publicaciones programadas
 * @param {string} estado - Filtro por estado
 * @returns {Promise<number>} Total
 */
export const count = async (estado = null) => {
    let query = 'SELECT COUNT(*) as total FROM publicaciones_programadas';
    const params = [];

    if (estado) {
        query += ' WHERE estado = ?';
        params.push(estado);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
};

/**
 * Obtiene una publicación programada por ID
 * @param {number} id - ID de la publicación
 * @returns {Promise<Object|null>} Publicación o null
 */
export const getById = async (id) => {
    const [rows] = await pool.query(`
        SELECT pp.*, 
               c.titulo as contenido_titulo,
               c.copy_texto,
               c.plataforma as contenido_plataforma,
               cs.nombre_cuenta,
               cs.plataforma as cuenta_plataforma,
               cs.access_token
        FROM publicaciones_programadas pp
        LEFT JOIN contenido c ON pp.contenido_id = c.id
        LEFT JOIN cuentas_sociales cs ON pp.cuenta_social_id = cs.id
        WHERE pp.id = ?
    `, [id]);
    return rows[0] || null;
};

/**
 * Crea una nueva publicación programada
 * @param {Object} data - Datos de la publicación
 * @returns {Promise<Object>} Publicación creada
 */
export const create = async ({ contenido_id, cuenta_social_id, fecha_programada }) => {
    const [result] = await pool.query(
        `INSERT INTO publicaciones_programadas 
         (contenido_id, cuenta_social_id, fecha_programada, estado) 
         VALUES (?, ?, ?, 'pendiente')`,
        [contenido_id, cuenta_social_id, fecha_programada]
    );

    return {
        id: result.insertId,
        contenido_id,
        cuenta_social_id,
        fecha_programada,
        estado: 'pendiente'
    };
};

/**
 * Actualiza el estado de una publicación
 * @param {number} id - ID de la publicación
 * @param {string} estado - Nuevo estado
 * @param {Object} extras - Datos adicionales (response_api, external_post_id)
 * @returns {Promise<boolean>} True si se actualizó
 */
export const updateEstado = async (id, estado, extras = {}) => {
    const fields = ['estado = ?'];
    const values = [estado];

    if (extras.response_api !== undefined) {
        fields.push('response_api = ?');
        values.push(typeof extras.response_api === 'object'
            ? JSON.stringify(extras.response_api)
            : extras.response_api);
    }

    if (extras.external_post_id !== undefined) {
        fields.push('external_post_id = ?');
        values.push(extras.external_post_id);
    }

    values.push(id);

    const [result] = await pool.query(
        `UPDATE publicaciones_programadas SET ${fields.join(', ')} WHERE id = ?`,
        values
    );

    return result.affectedRows > 0;
};

/**
 * Obtiene publicaciones pendientes listas para publicar
 * @returns {Promise<Array>} Lista de publicaciones listas
 */
export const getPendientesParaPublicar = async () => {
    const [rows] = await pool.query(`
        SELECT pp.*, 
               c.titulo,
               c.copy_texto,
               c.contenido as contenido_texto,
               c.plataforma,
               c.tipo,
               cs.nombre_cuenta,
               cs.page_id,
               cs.access_token,
               cs.plataforma as cuenta_plataforma
        FROM publicaciones_programadas pp
        INNER JOIN contenido c ON pp.contenido_id = c.id
        INNER JOIN cuentas_sociales cs ON pp.cuenta_social_id = cs.id
        WHERE pp.estado = 'pendiente' 
          AND pp.fecha_programada <= NOW()
          AND cs.estado = 'conectada'
        ORDER BY pp.fecha_programada ASC
    `);
    return rows;
};

/**
 * Obtiene publicaciones por contenido
 * @param {number} contenidoId - ID del contenido
 * @returns {Promise<Array>} Lista de publicaciones
 */
export const getByContenido = async (contenidoId) => {
    const [rows] = await pool.query(`
        SELECT pp.*, cs.nombre_cuenta, cs.plataforma as cuenta_plataforma
        FROM publicaciones_programadas pp
        LEFT JOIN cuentas_sociales cs ON pp.cuenta_social_id = cs.id
        WHERE pp.contenido_id = ?
        ORDER BY pp.fecha_programada DESC
    `, [contenidoId]);
    return rows;
};

/**
 * Elimina una publicación programada
 * @param {number} id - ID de la publicación
 * @returns {Promise<boolean>} True si se eliminó
 */
export const remove = async (id) => {
    const [result] = await pool.query(
        'DELETE FROM publicaciones_programadas WHERE id = ?',
        [id]
    );
    return result.affectedRows > 0;
};

/**
 * Cancela publicaciones pendientes de un contenido
 * @param {number} contenidoId - ID del contenido
 * @returns {Promise<number>} Número de publicaciones canceladas
 */
export const cancelarPorContenido = async (contenidoId) => {
    const [result] = await pool.query(
        `UPDATE publicaciones_programadas 
         SET estado = 'cancelado' 
         WHERE contenido_id = ? AND estado = 'pendiente'`,
        [contenidoId]
    );
    return result.affectedRows;
};

/**
 * Obtiene estadísticas de publicaciones
 * @returns {Promise<Object>} Estadísticas
 */
export const getStats = async () => {
    const [rows] = await pool.query(`
        SELECT 
            estado,
            COUNT(*) as total
        FROM publicaciones_programadas
        GROUP BY estado
    `);

    const stats = {
        pendientes: 0,
        enviadas: 0,
        fallidas: 0,
        total: 0
    };

    rows.forEach(row => {
        if (row.estado === 'pendiente') stats.pendientes = row.total;
        else if (row.estado === 'enviado') stats.enviadas = row.total;
        else if (row.estado === 'fallido') stats.fallidas = row.total;
        stats.total += row.total;
    });

    return stats;
};
