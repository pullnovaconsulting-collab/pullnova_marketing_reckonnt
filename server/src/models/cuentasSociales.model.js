/**
 * @fileoverview Modelo de Cuentas Sociales
 * @description Operaciones CRUD para la tabla cuentas_sociales
 * @module models/cuentasSociales
 */

import { pool } from '../config/db.js';

/**
 * Obtiene todas las cuentas sociales
 * @returns {Promise<Array>} Lista de cuentas
 */
export const getAll = async () => {
    const [rows] = await pool.query(
        `SELECT id, plataforma, nombre_cuenta, page_id, estado, token_expires_at, created_at 
     FROM cuentas_sociales 
     ORDER BY plataforma, created_at DESC`
    );
    return rows;
};

/**
 * Obtiene una cuenta por ID
 * @param {number} id - ID de la cuenta
 * @returns {Promise<Object|null>} Cuenta o null
 */
export const getById = async (id) => {
    const [rows] = await pool.query(
        'SELECT * FROM cuentas_sociales WHERE id = ?',
        [id]
    );
    return rows[0] || null;
};

/**
 * Obtiene cuentas por plataforma
 * @param {string} plataforma - 'facebook', 'instagram', 'linkedin'
 * @returns {Promise<Array>} Cuentas de esa plataforma
 */
export const getByPlataforma = async (plataforma) => {
    const [rows] = await pool.query(
        'SELECT * FROM cuentas_sociales WHERE plataforma = ? AND estado = "conectada"',
        [plataforma]
    );
    return rows;
};

/**
 * Obtiene cuentas conectadas (con token válido)
 * @returns {Promise<Array>} Cuentas conectadas
 */
export const getConectadas = async () => {
    const [rows] = await pool.query(
        `SELECT id, plataforma, nombre_cuenta, page_id, token_expires_at 
     FROM cuentas_sociales 
     WHERE estado = 'conectada' 
     AND (token_expires_at IS NULL OR token_expires_at > NOW())`
    );
    return rows;
};

/**
 * Crea una nueva cuenta social
 * @param {Object} data - Datos de la cuenta
 * @returns {Promise<Object>} Cuenta creada (sin tokens para seguridad)
 */
export const create = async ({
    plataforma,
    nombre_cuenta,
    page_id = null,
    access_token = null,
    refresh_token = null,
    token_expires_at = null,
    estado = 'desconectada'
}) => {
    const [result] = await pool.query(
        `INSERT INTO cuentas_sociales 
     (plataforma, nombre_cuenta, page_id, access_token, refresh_token, token_expires_at, estado) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [plataforma, nombre_cuenta, page_id, access_token, refresh_token, token_expires_at, estado]
    );

    return {
        id: result.insertId,
        plataforma,
        nombre_cuenta,
        page_id,
        estado
    };
};

/**
 * Actualiza los tokens de una cuenta
 * @param {number} id - ID de la cuenta
 * @param {Object} tokens - Tokens a actualizar
 * @returns {Promise<boolean>} True si se actualizó
 */
export const updateTokens = async (id, { access_token, refresh_token = null, token_expires_at = null }) => {
    const [result] = await pool.query(
        `UPDATE cuentas_sociales 
     SET access_token = ?, refresh_token = ?, token_expires_at = ?, estado = 'conectada' 
     WHERE id = ?`,
        [access_token, refresh_token, token_expires_at, id]
    );
    return result.affectedRows > 0;
};

/**
 * Actualiza el estado de una cuenta
 * @param {number} id - ID de la cuenta
 * @param {string} estado - Nuevo estado
 * @returns {Promise<boolean>} True si se actualizó
 */
export const updateEstado = async (id, estado) => {
    const [result] = await pool.query(
        'UPDATE cuentas_sociales SET estado = ? WHERE id = ?',
        [estado, id]
    );
    return result.affectedRows > 0;
};

/**
 * Obtiene el token de acceso de una cuenta
 * @param {number} id - ID de la cuenta
 * @returns {Promise<string|null>} Token o null
 */
export const getAccessToken = async (id) => {
    const [rows] = await pool.query(
        'SELECT access_token FROM cuentas_sociales WHERE id = ? AND estado = "conectada"',
        [id]
    );
    return rows[0]?.access_token || null;
};

/**
 * Elimina una cuenta social
 * @param {number} id - ID de la cuenta
 * @returns {Promise<boolean>} True si se eliminó
 */
export const remove = async (id) => {
    const [result] = await pool.query('DELETE FROM cuentas_sociales WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

/**
 * Marca cuentas con tokens expirados
 * @returns {Promise<number>} Número de cuentas marcadas
 */
export const markExpiredTokens = async () => {
    const [result] = await pool.query(
        `UPDATE cuentas_sociales 
     SET estado = 'expirada' 
     WHERE estado = 'conectada' 
     AND token_expires_at IS NOT NULL 
     AND token_expires_at < NOW()`
    );
    return result.affectedRows;
};
