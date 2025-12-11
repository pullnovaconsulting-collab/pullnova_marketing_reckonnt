/**
 * @fileoverview Modelo de Campañas
 * @description Operaciones CRUD para la tabla campanas
 * @module models/campanas
 */

import { pool } from '../config/db.js';

/**
 * Obtiene todas las campañas con paginación
 * @param {Object} options - Opciones de consulta
 * @returns {Promise<Array>} Lista de campañas
 */
export const getAll = async ({ limit = 10, offset = 0, estado = null } = {}) => {
    let query = `
    SELECT c.*, 
           (SELECT COUNT(*) FROM contenido WHERE campana_id = c.id) as total_contenido
    FROM campanas c
  `;
    const params = [];

    if (estado) {
        query += ' WHERE c.estado = ?';
        params.push(estado);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
};

/**
 * Cuenta el total de campañas
 * @param {string} estado - Filtrar por estado (opcional)
 * @returns {Promise<number>} Total de campañas
 */
export const count = async (estado = null) => {
    let query = 'SELECT COUNT(*) as total FROM campanas';
    const params = [];

    if (estado) {
        query += ' WHERE estado = ?';
        params.push(estado);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
};

/**
 * Obtiene una campaña por ID con estadísticas
 * @param {number} id - ID de la campaña
 * @returns {Promise<Object|null>} Campaña o null
 */
export const getById = async (id) => {
    const [rows] = await pool.query(
        `SELECT c.*,
            (SELECT COUNT(*) FROM contenido WHERE campana_id = c.id) as total_contenido,
            (SELECT COUNT(*) FROM contenido WHERE campana_id = c.id AND estado = 'publicado') as contenido_publicado,
            (SELECT COUNT(*) FROM contenido WHERE campana_id = c.id AND estado = 'pendiente') as contenido_pendiente
     FROM campanas c 
     WHERE c.id = ?`,
        [id]
    );
    return rows[0] || null;
};

/**
 * Crea una nueva campaña
 * @param {Object} data - Datos de la campaña
 * @returns {Promise<Object>} Campaña creada
 */
export const create = async ({
    nombre,
    descripcion = null,
    estado = 'borrador',
    fecha_inicio = null,
    fecha_fin = null,
    presupuesto = 0
}) => {
    const [result] = await pool.query(
        `INSERT INTO campanas 
     (nombre, descripcion, estado, fecha_inicio, fecha_fin, presupuesto) 
     VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre, descripcion, estado, fecha_inicio, fecha_fin, presupuesto]
    );

    return {
        id: result.insertId,
        nombre,
        descripcion,
        estado,
        fecha_inicio,
        fecha_fin,
        presupuesto
    };
};


/**
 * Actualiza una campaña
 * @param {number} id - ID de la campaña
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<boolean>} True si se actualizó
 */
export const update = async (id, data) => {
    const allowedFields = [
        'nombre', 'descripcion', 'objetivo', 'estado',
        'fecha_inicio', 'fecha_fin', 'presupuesto',
        'plataformas', 'kpi_principal'
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
        `UPDATE campanas SET ${fields.join(', ')} WHERE id = ?`,
        values
    );

    return result.affectedRows > 0;
};

/**
 * Cambia el estado de una campaña
 * @param {number} id - ID de la campaña
 * @param {string} estado - Nuevo estado
 * @returns {Promise<boolean>} True si se actualizó
 */
export const updateEstado = async (id, estado) => {
    const [result] = await pool.query(
        'UPDATE campanas SET estado = ? WHERE id = ?',
        [estado, id]
    );
    return result.affectedRows > 0;
};

/**
 * Elimina una campaña
 * @param {number} id - ID de la campaña
 * @returns {Promise<boolean>} True si se eliminó
 */
export const remove = async (id) => {
    const [result] = await pool.query('DELETE FROM campanas WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

/**
 * Obtiene campañas activas dentro de un rango de fechas
 * @param {Date} startDate - Fecha inicio
 * @param {Date} endDate - Fecha fin
 * @returns {Promise<Array>} Campañas activas
 */
export const getActiveInDateRange = async (startDate, endDate) => {
    const [rows] = await pool.query(
        `SELECT * FROM campanas 
     WHERE estado = 'activa' 
     AND fecha_inicio <= ? 
     AND fecha_fin >= ?`,
        [endDate, startDate]
    );
    return rows;
};

/**
 * Obtiene estadísticas generales de campañas
 * @returns {Promise<Object>} Estadísticas
 */
export const getStats = async () => {
    const [rows] = await pool.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) as activas,
      SUM(CASE WHEN estado = 'borrador' THEN 1 ELSE 0 END) as borradores,
      SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
      SUM(presupuesto) as presupuesto_total
    FROM campanas
  `);
    return rows[0];
};
