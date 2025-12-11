/**
 * @fileoverview Modelo de Prompts
 * @description Operaciones CRUD para la tabla prompts
 * @module models/prompts
 */

import { pool } from '../config/db.js';

/**
 * Obtiene todos los prompts
 * @param {Object} options - Opciones de consulta
 * @returns {Promise<Array>} Lista de prompts
 */
export const getAll = async ({ tipo = null } = {}) => {
    let query = `
    SELECT p.*, u.nombre as creador_nombre
    FROM prompts p
    LEFT JOIN usuarios u ON p.created_by = u.id
  `;
    const params = [];

    if (tipo) {
        query += ' WHERE p.tipo = ?';
        params.push(tipo);
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
};

/**
 * Obtiene un prompt por ID
 * @param {number} id - ID del prompt
 * @returns {Promise<Object|null>} Prompt o null
 */
export const getById = async (id) => {
    const [rows] = await pool.query(
        `SELECT p.*, u.nombre as creador_nombre
     FROM prompts p
     LEFT JOIN usuarios u ON p.created_by = u.id
     WHERE p.id = ?`,
        [id]
    );
    return rows[0] || null;
};

/**
 * Crea un nuevo prompt
 * @param {Object} data - Datos del prompt
 * @returns {Promise<Object>} Prompt creado
 */
export const create = async ({
    nombre,
    tipo = 'copy_post',
    plantilla,
    created_by = null
}) => {
    const [result] = await pool.query(
        'INSERT INTO prompts (nombre, tipo, plantilla, created_by) VALUES (?, ?, ?, ?)',
        [nombre, tipo, plantilla, created_by]
    );

    return {
        id: result.insertId,
        nombre,
        tipo,
        plantilla,
        created_by
    };
};

/**
 * Actualiza un prompt
 * @param {number} id - ID del prompt
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<boolean>} True si se actualizó
 */
export const update = async (id, { nombre, tipo, plantilla }) => {
    const fields = [];
    const values = [];

    if (nombre !== undefined) {
        fields.push('nombre = ?');
        values.push(nombre);
    }
    if (tipo !== undefined) {
        fields.push('tipo = ?');
        values.push(tipo);
    }
    if (plantilla !== undefined) {
        fields.push('plantilla = ?');
        values.push(plantilla);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query(
        `UPDATE prompts SET ${fields.join(', ')} WHERE id = ?`,
        values
    );

    return result.affectedRows > 0;
};

/**
 * Elimina un prompt
 * @param {number} id - ID del prompt
 * @returns {Promise<boolean>} True si se eliminó
 */
export const remove = async (id) => {
    const [result] = await pool.query('DELETE FROM prompts WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

/**
 * Obtiene prompts por tipo
 * @param {string} tipo - Tipo de prompt
 * @returns {Promise<Array>} Lista de prompts
 */
export const getByTipo = async (tipo) => {
    const [rows] = await pool.query(
        'SELECT * FROM prompts WHERE tipo = ? ORDER BY nombre',
        [tipo]
    );
    return rows;
};
