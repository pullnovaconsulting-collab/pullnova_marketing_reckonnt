/**
 * @fileoverview Modelo de Usuarios
 * @description Operaciones CRUD para la tabla usuarios
 * @module models/usuarios
 */

import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Obtiene todos los usuarios (sin password_hash)
 * @param {Object} options - Opciones de paginación
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAll = async ({ limit = 10, offset = 0 } = {}) => {
    const [rows] = await pool.query(
        `SELECT id, nombre, email, rol, estado, created_at, updated_at 
     FROM usuarios 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    return rows;
};

/**
 * Cuenta el total de usuarios
 * @returns {Promise<number>} Total de usuarios
 */
export const count = async () => {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    return rows[0].total;
};

/**
 * Obtiene un usuario por ID
 * @param {number} id - ID del usuario
 * @returns {Promise<Object|null>} Usuario o null
 */
export const getById = async (id) => {
    const [rows] = await pool.query(
        `SELECT id, nombre, email, rol, estado, created_at, updated_at 
     FROM usuarios WHERE id = ?`,
        [id]
    );
    return rows[0] || null;
};

/**
 * Obtiene un usuario por email (incluye password_hash para auth)
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|null>} Usuario con password o null
 */
export const getByEmail = async (email) => {
    const [rows] = await pool.query(
        `SELECT id, nombre, email, password_hash, rol, estado, created_at 
     FROM usuarios WHERE email = ?`,
        [email]
    );
    return rows[0] || null;
};

/**
 * Crea un nuevo usuario
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.nombre - Nombre del usuario
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.password - Password en texto plano (se hashea)
 * @param {string} userData.rol - Rol del usuario
 * @returns {Promise<Object>} Usuario creado (sin password)
 */
export const create = async ({ nombre, email, password, rol = 'viewer' }) => {
    // Hashear password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol) 
     VALUES (?, ?, ?, ?)`,
        [nombre, email, password_hash, rol]
    );

    return {
        id: result.insertId,
        nombre,
        email,
        rol,
        estado: 'activo'
    };
};

/**
 * Actualiza un usuario existente
 * @param {number} id - ID del usuario
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise<boolean>} True si se actualizó
 */
export const update = async (id, { nombre, email, rol, estado }) => {
    const fields = [];
    const values = [];

    if (nombre !== undefined) {
        fields.push('nombre = ?');
        values.push(nombre);
    }
    if (email !== undefined) {
        fields.push('email = ?');
        values.push(email);
    }
    if (rol !== undefined) {
        fields.push('rol = ?');
        values.push(rol);
    }
    if (estado !== undefined) {
        fields.push('estado = ?');
        values.push(estado);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query(
        `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`,
        values
    );

    return result.affectedRows > 0;
};

/**
 * Actualiza la contraseña de un usuario
 * @param {number} id - ID del usuario
 * @param {string} newPassword - Nueva contraseña en texto plano
 * @returns {Promise<boolean>} True si se actualizó
 */
export const updatePassword = async (id, newPassword) => {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const [result] = await pool.query(
        'UPDATE usuarios SET password_hash = ? WHERE id = ?',
        [password_hash, id]
    );

    return result.affectedRows > 0;
};

/**
 * Elimina un usuario (soft delete - cambia estado a inactivo)
 * @param {number} id - ID del usuario
 * @returns {Promise<boolean>} True si se desactivó
 */
export const softDelete = async (id) => {
    const [result] = await pool.query(
        "UPDATE usuarios SET estado = 'inactivo' WHERE id = ?",
        [id]
    );
    return result.affectedRows > 0;
};

/**
 * Elimina un usuario permanentemente
 * @param {number} id - ID del usuario
 * @returns {Promise<boolean>} True si se eliminó
 */
export const hardDelete = async (id) => {
    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

/**
 * Verifica si un email ya existe
 * @param {string} email - Email a verificar
 * @param {number} excludeId - ID a excluir (para updates)
 * @returns {Promise<boolean>} True si existe
 */
export const emailExists = async (email, excludeId = null) => {
    let query = 'SELECT id FROM usuarios WHERE email = ?';
    const params = [email];

    if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows.length > 0;
};

/**
 * Verifica la contraseña de un usuario
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado
 * @returns {Promise<boolean>} True si coincide
 */
export const verifyPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};
