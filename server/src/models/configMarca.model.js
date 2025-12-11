/**
 * @fileoverview Modelo de Configuración de Marca
 * @description Operaciones para la tabla config_marca
 * @module models/configMarca
 */

import { pool } from '../config/db.js';

/**
 * Obtiene la configuración de marca (solo debe haber una)
 * @returns {Promise<Object|null>} Configuración de marca
 */
export const get = async () => {
    const [rows] = await pool.query('SELECT * FROM config_marca LIMIT 1');
    return rows[0] || null;
};

/**
 * Crea o actualiza la configuración de marca
 * Si ya existe una configuración, la actualiza
 * @param {Object} data - Datos de configuración
 * @returns {Promise<Object>} Configuración actualizada
 */
export const upsert = async ({
    nombre_marca = 'RECKONNT',
    descripcion = null,
    tono_voz = null,
    pilares_comunicacion = null,
    frecuencia_semanal = 3,
    segmento_principal = null
}) => {
    // Verificar si ya existe una configuración
    const existing = await get();

    if (existing) {
        // Actualizar existente
        await pool.query(
            `UPDATE config_marca SET 
       nombre_marca = ?, descripcion = ?, tono_voz = ?, 
       pilares_comunicacion = ?, frecuencia_semanal = ?, segmento_principal = ?
       WHERE id = ?`,
            [nombre_marca, descripcion, tono_voz, pilares_comunicacion, frecuencia_semanal, segmento_principal, existing.id]
        );
        return { ...existing, nombre_marca, descripcion, tono_voz, pilares_comunicacion, frecuencia_semanal, segmento_principal };
    } else {
        // Crear nuevo
        const [result] = await pool.query(
            `INSERT INTO config_marca 
       (nombre_marca, descripcion, tono_voz, pilares_comunicacion, frecuencia_semanal, segmento_principal) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre_marca, descripcion, tono_voz, pilares_comunicacion, frecuencia_semanal, segmento_principal]
        );
        return {
            id: result.insertId,
            nombre_marca,
            descripcion,
            tono_voz,
            pilares_comunicacion,
            frecuencia_semanal,
            segmento_principal
        };
    }
};

/**
 * Actualiza campos específicos de la configuración
 * @param {Object} data - Campos a actualizar
 * @returns {Promise<boolean>} True si se actualizó
 */
export const update = async (data) => {
    const existing = await get();
    if (!existing) return false;

    const allowedFields = [
        'nombre_marca', 'descripcion', 'tono_voz',
        'pilares_comunicacion', 'frecuencia_semanal', 'segmento_principal'
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

    values.push(existing.id);
    const [result] = await pool.query(
        `UPDATE config_marca SET ${fields.join(', ')} WHERE id = ?`,
        values
    );

    return result.affectedRows > 0;
};
