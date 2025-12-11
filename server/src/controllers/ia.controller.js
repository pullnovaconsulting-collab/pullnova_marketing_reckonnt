/**
 * @fileoverview Controlador de IA
 * @description Endpoints para generación de contenido con IA
 * @module controllers/ia
 */

import * as GeminiService from '../services/gemini.service.js';
import * as ContenidoModel from '../models/contenido.model.js';
import * as ConfigMarcaModel from '../models/configMarca.model.js';
import { sendSuccess, sendError, validateRequired } from '../utils/helpers.js';

/**
 * Genera copy para publicaciones
 * @route POST /api/ia/generar-copy
 */
export const generarCopy = async (req, res) => {
    try {
        const { tema, plataforma, objetivo, tono, segmento, variaciones, guardar, campana_id } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, ['tema']);
        if (!validation.valid) {
            return sendError(res, `Campo requerido: ${validation.missing.join(', ')}`, 400);
        }

        // Verificar configuración
        const config = GeminiService.verificarConfiguracion();
        if (!config.configurado) {
            return sendError(res, 'API de Gemini no configurada. Verifica GEMINI_API_KEY en .env', 500);
        }

        // Obtener contexto de marca si existe
        let contextoMarca = null;
        try {
            contextoMarca = await ConfigMarcaModel.get();
        } catch (e) {
            // Si no hay config de marca, continuar sin ella
        }

        // Generar contenido
        const resultado = await GeminiService.generarCopy({
            tema,
            plataforma: plataforma || 'instagram',
            objetivo: objetivo || 'educar',
            tono: tono || contextoMarca?.tono_voz || 'profesional',
            segmento: segmento || contextoMarca?.segmento_principal || 'PyMEs',
            variaciones: parseInt(variaciones) || 1,
            contextoMarca
        });

        if (!resultado.success) {
            return sendError(res, `Error generando contenido: ${resultado.error}`, 500);
        }

        // Si se debe guardar como borrador
        let contenidoGuardado = null;
        if (guardar) {
            contenidoGuardado = await ContenidoModel.create({
                campana_id: campana_id || null,
                titulo: `IA: ${tema.substring(0, 50)}`,
                contenido: resultado.contenido,
                copy_texto: resultado.contenido,
                tipo: 'post',
                plataforma: plataforma || 'instagram',
                estado: 'pendiente',
                prompt_usado: resultado.prompt_usado,
                modelo_ia: resultado.modelo,
                created_by: req.user.id
            });
        }

        return sendSuccess(res, {
            generacion: resultado,
            contenido_guardado: contenidoGuardado
        }, 'Contenido generado exitosamente');
    } catch (error) {
        console.error('Error en generarCopy:', error);
        return sendError(res, 'Error generando copy', 500);
    }
};

/**
 * Genera ideas para calendario editorial
 * @route POST /api/ia/generar-ideas
 */
export const generarIdeas = async (req, res) => {
    try {
        const { tema, cantidad, plataformas, periodo } = req.body;

        const validation = validateRequired(req.body, ['tema']);
        if (!validation.valid) {
            return sendError(res, `Campo requerido: tema`, 400);
        }

        const config = GeminiService.verificarConfiguracion();
        if (!config.configurado) {
            return sendError(res, 'API de Gemini no configurada', 500);
        }

        const resultado = await GeminiService.generarIdeas({
            tema,
            cantidad: parseInt(cantidad) || 5,
            plataformas: plataformas || ['instagram', 'facebook', 'linkedin'],
            periodo: periodo || 'semana'
        });

        if (!resultado.success) {
            return sendError(res, `Error generando ideas: ${resultado.error}`, 500);
        }

        return sendSuccess(res, resultado, 'Ideas generadas exitosamente');
    } catch (error) {
        console.error('Error en generarIdeas:', error);
        return sendError(res, 'Error generando ideas', 500);
    }
};

/**
 * Mejora un texto existente
 * @route POST /api/ia/mejorar-texto
 */
export const mejorarTexto = async (req, res) => {
    try {
        const { texto, instruccion } = req.body;

        const validation = validateRequired(req.body, ['texto']);
        if (!validation.valid) {
            return sendError(res, 'Campo requerido: texto', 400);
        }

        const config = GeminiService.verificarConfiguracion();
        if (!config.configurado) {
            return sendError(res, 'API de Gemini no configurada', 500);
        }

        const resultado = await GeminiService.mejorarTexto(
            texto,
            instruccion || 'mejorar para redes sociales'
        );

        if (!resultado.success) {
            return sendError(res, `Error mejorando texto: ${resultado.error}`, 500);
        }

        return sendSuccess(res, resultado, 'Texto mejorado exitosamente');
    } catch (error) {
        console.error('Error en mejorarTexto:', error);
        return sendError(res, 'Error mejorando texto', 500);
    }
};

/**
 * Genera prompt para imagen
 * @route POST /api/ia/generar-prompt-imagen
 */
export const generarPromptImagen = async (req, res) => {
    try {
        const { descripcion, estilo, colores, tipo } = req.body;

        const validation = validateRequired(req.body, ['descripcion']);
        if (!validation.valid) {
            return sendError(res, 'Campo requerido: descripcion', 400);
        }

        const config = GeminiService.verificarConfiguracion();
        if (!config.configurado) {
            return sendError(res, 'API de Gemini no configurada', 500);
        }

        const resultado = await GeminiService.generarPromptImagen({
            descripcion,
            estilo: estilo || 'moderno y profesional',
            colores: colores || 'azules y blancos corporativos',
            tipo: tipo || 'ilustración'
        });

        if (!resultado.success) {
            return sendError(res, `Error generando prompt: ${resultado.error}`, 500);
        }

        return sendSuccess(res, resultado, 'Prompt de imagen generado');
    } catch (error) {
        console.error('Error en generarPromptImagen:', error);
        return sendError(res, 'Error generando prompt de imagen', 500);
    }
};

/**
 * Verifica estado de la configuración de IA
 * @route GET /api/ia/status
 */
export const getStatus = async (req, res) => {
    try {
        const gemini = GeminiService.verificarConfiguracion();

        return sendSuccess(res, {
            gemini,
            servicios_disponibles: [
                'generar-copy',
                'generar-ideas',
                'mejorar-texto',
                'generar-prompt-imagen'
            ]
        }, 'Estado de servicios IA');
    } catch (error) {
        return sendError(res, 'Error verificando estado', 500);
    }
};
