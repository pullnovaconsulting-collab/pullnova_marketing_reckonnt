/**
 * @fileoverview Controlador de Configuración de Marca
 * @description Gestión de la configuración de marca para generación de contenido
 * @module controllers/configMarca
 */

import * as ConfigMarcaModel from '../models/configMarca.model.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

/**
 * Obtiene la configuración de marca actual
 * @route GET /api/config-marca
 */
export const get = async (req, res) => {
    try {
        const config = await ConfigMarcaModel.get();

        if (!config) {
            // Si no existe, devolver configuración por defecto
            return sendSuccess(res, {
                config: {
                    nombre_marca: 'RECKONNT',
                    descripcion: 'Soluciones empresariales y contables',
                    tono_voz: 'Profesional, cercano, experto en contabilidad y tecnología',
                    pilares_comunicacion: 'Educación tributaria, Consejos para PyMEs, Novedades del SRI, Tecnología para negocios',
                    frecuencia_semanal: 4,
                    segmento_principal: 'PyMEs ecuatorianas'
                },
                is_default: true
            }, 'Configuración por defecto');
        }

        return sendSuccess(res, { config, is_default: false });
    } catch (error) {
        console.error('Error obteniendo configuración de marca:', error);
        return sendError(res, 'Error al obtener configuración', 500);
    }
};

/**
 * Actualiza o crea la configuración de marca
 * @route PUT /api/config-marca
 */
export const update = async (req, res) => {
    try {
        const {
            nombre_marca,
            descripcion,
            tono_voz,
            pilares_comunicacion,
            frecuencia_semanal,
            segmento_principal
        } = req.body;

        // Validar frecuencia si se proporciona
        if (frecuencia_semanal !== undefined) {
            const freq = parseInt(frecuencia_semanal);
            if (isNaN(freq) || freq < 1 || freq > 14) {
                return sendError(res, 'Frecuencia semanal debe ser un número entre 1 y 14', 400);
            }
        }

        // Crear o actualizar la configuración
        const config = await ConfigMarcaModel.upsert({
            nombre_marca,
            descripcion,
            tono_voz,
            pilares_comunicacion,
            frecuencia_semanal: frecuencia_semanal ? parseInt(frecuencia_semanal) : undefined,
            segmento_principal
        });

        return sendSuccess(res, { config }, 'Configuración actualizada');
    } catch (error) {
        console.error('Error actualizando configuración de marca:', error);
        return sendError(res, 'Error al actualizar configuración', 500);
    }
};

/**
 * Obtiene solo los pilares de comunicación como array
 * @route GET /api/config-marca/pilares
 */
export const getPilares = async (req, res) => {
    try {
        const config = await ConfigMarcaModel.get();

        let pilares = [];
        if (config?.pilares_comunicacion) {
            // Parsear pilares separados por coma o salto de línea
            pilares = config.pilares_comunicacion
                .split(/[,\n]/)
                .map(p => p.trim())
                .filter(p => p.length > 0);
        } else {
            // Pilares por defecto
            pilares = [
                'Educación tributaria',
                'Consejos para PyMEs',
                'Novedades del SRI',
                'Tecnología para negocios'
            ];
        }

        return sendSuccess(res, { pilares, total: pilares.length });
    } catch (error) {
        console.error('Error obteniendo pilares:', error);
        return sendError(res, 'Error al obtener pilares', 500);
    }
};

/**
 * Obtiene el contexto completo de marca para generación IA
 * @route GET /api/config-marca/contexto-ia
 * @description Devuelve la configuración formateada para usar en prompts de IA
 */
export const getContextoIA = async (req, res) => {
    try {
        const config = await ConfigMarcaModel.get();

        // Construir contexto para IA
        const contexto = {
            marca: config?.nombre_marca || 'RECKONNT',
            descripcion: config?.descripcion || 'Soluciones empresariales y contables',
            tono: config?.tono_voz || 'Profesional, cercano, experto en contabilidad y tecnología',
            audiencia: config?.segmento_principal || 'PyMEs ecuatorianas',
            pilares: config?.pilares_comunicacion || 'Educación tributaria, Consejos para PyMEs',
            frecuencia: config?.frecuencia_semanal || 4,

            // Prompt formateado para insertar en generación IA
            prompt_contexto: `
MARCA: ${config?.nombre_marca || 'RECKONNT'}
DESCRIPCIÓN: ${config?.descripcion || 'Soluciones empresariales y contables'}
TONO DE VOZ: ${config?.tono_voz || 'Profesional, cercano, experto'}
AUDIENCIA OBJETIVO: ${config?.segmento_principal || 'PyMEs ecuatorianas'}
PILARES DE CONTENIDO: ${config?.pilares_comunicacion || 'Educación tributaria, Consejos para PyMEs'}
            `.trim()
        };

        return sendSuccess(res, { contexto });
    } catch (error) {
        console.error('Error obteniendo contexto IA:', error);
        return sendError(res, 'Error al obtener contexto', 500);
    }
};

/**
 * Resetea la configuración a valores por defecto
 * @route POST /api/config-marca/reset
 */
export const reset = async (req, res) => {
    try {
        const defaultConfig = {
            nombre_marca: 'RECKONNT',
            descripcion: 'Soluciones empresariales y contables',
            tono_voz: 'Profesional, cercano, experto en contabilidad y tecnología',
            pilares_comunicacion: 'Educación tributaria, Consejos para PyMEs, Novedades del SRI, Tecnología para negocios',
            frecuencia_semanal: 4,
            segmento_principal: 'PyMEs ecuatorianas'
        };

        const config = await ConfigMarcaModel.upsert(defaultConfig);

        return sendSuccess(res, { config }, 'Configuración reseteada a valores por defecto');
    } catch (error) {
        console.error('Error reseteando configuración:', error);
        return sendError(res, 'Error al resetear configuración', 500);
    }
};
