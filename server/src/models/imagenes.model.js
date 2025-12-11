/**
 * @fileoverview Modelo de Imágenes
 * @description Operaciones CRUD para la tabla imagenes
 * @module models/imagenes
 */

import { pool } from '../config/db.js';

/**
 * Obtiene imágenes por contenido
 * @param {number} contenidoId - ID del contenido
 * @returns {Promise<Array>} Lista de imágenes
 */
export const getByContenido = async (contenidoId) => {
    const [rows] = await pool.query(
        'SELECT * FROM imagenes WHERE contenido_id = ? ORDER BY created_at DESC',
        [contenidoId]
    );
    return rows;
};

/**
 * Obtiene una imagen por ID
 * @param {number} id - ID de la imagen
 * @returns {Promise<Object|null>} Imagen o null
 */
export const getById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM imagenes WHERE id = ?', [id]);
    return rows[0] || null;
};

/**
 * Crea una nueva imagen
 * @param {Object} data - Datos de la imagen
 * @returns {Promise<Object>} Imagen creada
 */
export const create = async ({
    contenido_id,
    url_imagen,
    prompt_imagen = null,
    modelo_ia = null
}) => {
    const [result] = await pool.query(
        `INSERT INTO imagenes (contenido_id, url_imagen, prompt_imagen, modelo_ia) 
     VALUES (?, ?, ?, ?)`,
        [contenido_id, url_imagen, prompt_imagen, modelo_ia]
    );

    return {
        id: result.insertId,
        contenido_id,
        url_imagen,
        prompt_imagen,
        modelo_ia
    };
};

/**
 * Elimina una imagen
 * @param {number} id - ID de la imagen
 * @returns {Promise<boolean>} True si se eliminó
 */
export const remove = async (id) => {
    const [result] = await pool.query('DELETE FROM imagenes WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

/**
 * Elimina todas las imágenes de un contenido
 * @param {number} contenidoId - ID del contenido
 * @returns {Promise<number>} Número de imágenes eliminadas
 */
export const removeByContenido = async (contenidoId) => {
    const [result] = await pool.query(
        'DELETE FROM imagenes WHERE contenido_id = ?',
        [contenidoId]
    );
    return result.affectedRows;
};

/**
 * Cuenta imágenes por contenido
 * @param {number} contenidoId - ID del contenido
 * @returns {Promise<number>} Número de imágenes
 */
export const countByContenido = async (contenidoId) => {
    const [rows] = await pool.query(
        'SELECT COUNT(*) as total FROM imagenes WHERE contenido_id = ?',
        [contenidoId]
    );
    return rows[0].total;
};
