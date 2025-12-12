/**
 * @fileoverview Controlador de Prompts
 * @description CRUD completo para gestión de plantillas de prompts IA
 * @module controllers/prompts
 */

import * as PromptsModel from '../models/prompts.model.js';
import { sendSuccess, sendError, paginate, paginatedResponse, validateRequired } from '../utils/helpers.js';

/**
 * Lista todos los prompts con paginación y filtros
 * @route GET /api/prompts
 */
export const list = async (req, res) => {
    try {
        const { page, limit, tipo } = req.query;
        const pagination = paginate(page, limit);

        const [prompts, total] = await Promise.all([
            PromptsModel.getAll({ ...pagination, tipo }),
            PromptsModel.count(tipo)
        ]);

        return sendSuccess(res, paginatedResponse(prompts, total, pagination.page, pagination.limit));
    } catch (error) {
        console.error('Error listando prompts:', error);
        return sendError(res, 'Error al obtener prompts', 500);
    }
};

/**
 * Obtiene un prompt por ID
 * @route GET /api/prompts/:id
 */
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const prompt = await PromptsModel.getById(parseInt(id));

        if (!prompt) {
            return sendError(res, 'Prompt no encontrado', 404);
        }

        return sendSuccess(res, { prompt });
    } catch (error) {
        console.error('Error obteniendo prompt:', error);
        return sendError(res, 'Error al obtener prompt', 500);
    }
};

/**
 * Crea un nuevo prompt
 * @route POST /api/prompts
 */
export const create = async (req, res) => {
    try {
        const { nombre, tipo, plantilla } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, ['nombre', 'plantilla']);
        if (!validation.valid) {
            return sendError(res, `Campos requeridos: ${validation.missing.join(', ')}`, 400);
        }

        // Validar tipo
        const validTipos = ['copy_post', 'calendario', 'imagen', 'otros'];
        if (tipo && !validTipos.includes(tipo)) {
            return sendError(res, `Tipo inválido. Opciones: ${validTipos.join(', ')}`, 400);
        }

        const prompt = await PromptsModel.create({
            nombre,
            tipo: tipo || 'copy_post',
            plantilla,
            created_by: req.user.id
        });

        return sendSuccess(res, { prompt }, 'Prompt creado exitosamente', 201);
    } catch (error) {
        console.error('Error creando prompt:', error);
        return sendError(res, 'Error al crear prompt', 500);
    }
};

/**
 * Actualiza un prompt existente
 * @route PUT /api/prompts/:id
 */
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo, plantilla } = req.body;

        // Verificar que existe
        const existingPrompt = await PromptsModel.getById(parseInt(id));
        if (!existingPrompt) {
            return sendError(res, 'Prompt no encontrado', 404);
        }

        // Validar tipo si se proporciona
        const validTipos = ['copy_post', 'calendario', 'imagen', 'otros'];
        if (tipo && !validTipos.includes(tipo)) {
            return sendError(res, `Tipo inválido. Opciones: ${validTipos.join(', ')}`, 400);
        }

        const updated = await PromptsModel.update(parseInt(id), { nombre, tipo, plantilla });

        if (!updated) {
            return sendError(res, 'No se realizaron cambios', 400);
        }

        const prompt = await PromptsModel.getById(parseInt(id));
        return sendSuccess(res, { prompt }, 'Prompt actualizado');
    } catch (error) {
        console.error('Error actualizando prompt:', error);
        return sendError(res, 'Error al actualizar prompt', 500);
    }
};

/**
 * Elimina un prompt
 * @route DELETE /api/prompts/:id
 */
export const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const existingPrompt = await PromptsModel.getById(parseInt(id));
        if (!existingPrompt) {
            return sendError(res, 'Prompt no encontrado', 404);
        }

        await PromptsModel.remove(parseInt(id));

        return sendSuccess(res, null, 'Prompt eliminado');
    } catch (error) {
        console.error('Error eliminando prompt:', error);
        return sendError(res, 'Error al eliminar prompt', 500);
    }
};

/**
 * Procesa un prompt con variables
 * @route POST /api/prompts/:id/procesar
 * @description Reemplaza las variables {{variable}} con los valores proporcionados
 */
export const procesar = async (req, res) => {
    try {
        const { id } = req.params;
        const variables = req.body;

        const prompt = await PromptsModel.getById(parseInt(id));
        if (!prompt) {
            return sendError(res, 'Prompt no encontrado', 404);
        }

        // Procesar la plantilla reemplazando variables
        let plantillaProcesada = prompt.plantilla;

        // Encontrar todas las variables en la plantilla
        const variablesEnPlantilla = plantillaProcesada.match(/\{\{(\w+)\}\}/g) || [];
        const variablesRequeridas = variablesEnPlantilla.map(v => v.replace(/\{\{|\}\}/g, ''));

        // Reemplazar cada variable
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            plantillaProcesada = plantillaProcesada.replace(regex, value);
        }

        // Verificar si quedaron variables sin reemplazar
        const variablesSinReemplazar = plantillaProcesada.match(/\{\{(\w+)\}\}/g) || [];

        return sendSuccess(res, {
            prompt_original: prompt.plantilla,
            prompt_procesado: plantillaProcesada,
            variables_usadas: Object.keys(variables),
            variables_requeridas: variablesRequeridas,
            variables_faltantes: variablesSinReemplazar.map(v => v.replace(/\{\{|\}\}/g, ''))
        }, 'Prompt procesado');
    } catch (error) {
        console.error('Error procesando prompt:', error);
        return sendError(res, 'Error al procesar prompt', 500);
    }
};

/**
 * Obtiene prompts por tipo
 * @route GET /api/prompts/tipo/:tipo
 */
export const getByTipo = async (req, res) => {
    try {
        const { tipo } = req.params;

        const validTipos = ['copy_post', 'calendario', 'imagen', 'otros'];
        if (!validTipos.includes(tipo)) {
            return sendError(res, `Tipo inválido. Opciones: ${validTipos.join(', ')}`, 400);
        }

        const prompts = await PromptsModel.getByTipo(tipo);
        return sendSuccess(res, { prompts, total: prompts.length });
    } catch (error) {
        console.error('Error obteniendo prompts por tipo:', error);
        return sendError(res, 'Error al obtener prompts', 500);
    }
};
