/**
 * @fileoverview Rutas de IA
 * @description Endpoints para generación de contenido con IA (Gemini, OpenAI, DALL-E)
 * @module routes/ia
 */

import { Router } from 'express';
import * as IAController from '../controllers/ia.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isEditor, isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación y rol editor
router.use(verifyToken);
router.use(isEditor);

/**
 * @route GET /api/ia/status
 * @description Verificar estado de servicios IA (Gemini, OpenAI, DALL-E)
 * @access Editor+
 */
router.get('/status', IAController.getStatus);

// ==================== GENERACIÓN DE TEXTO ====================

/**
 * @route POST /api/ia/generar-copy
 * @description Generar copy de marketing con IA
 * @access Editor+
 * @body {string} tema - Tema del post (requerido)
 * @body {string} plataforma - instagram|facebook|linkedin
 * @body {string} objetivo - educar|promocionar|convertir
 * @body {string} tono - Tono de voz
 * @body {number} variaciones - Número de versiones
 * @body {boolean} guardar - Si guardar como borrador
 * @body {number} campana_id - ID de campaña asociada
 * @body {string} modelo - gemini|openai|gpt-4
 */
router.post('/generar-copy', IAController.generarCopy);

/**
 * @route POST /api/ia/generar-ideas
 * @description Generar ideas para calendario editorial
 * @access Editor+
 * @body {string} tema - Tema general
 * @body {number} cantidad - Número de ideas
 * @body {array} plataformas - Plataformas objetivo
 * @body {string} periodo - semana|mes
 * @body {string} modelo - gemini|openai|gpt-4
 */
router.post('/generar-ideas', IAController.generarIdeas);

/**
 * @route POST /api/ia/mejorar-texto
 * @description Mejorar o reescribir un texto
 * @access Editor+
 * @body {string} texto - Texto original (requerido)
 * @body {string} instruccion - Tipo de mejora
 * @body {string} modelo - gemini|openai|gpt-4
 */
router.post('/mejorar-texto', IAController.mejorarTexto);

// ==================== GENERACIÓN DE IMÁGENES (DALL-E) ====================

/**
 * @route POST /api/ia/generar-prompt-imagen
 * @description Generar prompt optimizado para creación de imagen
 * @access Editor+
 * @body {string} descripcion - Descripción de la imagen (requerido)
 * @body {string} estilo - Estilo visual
 * @body {string} colores - Paleta de colores
 * @body {string} tipo - ilustración|foto|minimalista
 */
router.post('/generar-prompt-imagen', IAController.generarPromptImagen);

/**
 * @route POST /api/ia/generar-imagen
 * @description Generar imagen real con DALL-E 3
 * @access Editor+
 * @body {string} prompt - Prompt para la imagen (requerido)
 * @body {number} contenido_id - ID del contenido a asociar (opcional)
 * @body {string} size - 1024x1024|1792x1024|1024x1792
 * @body {string} quality - standard|hd
 * @body {string} style - vivid|natural
 */
router.post('/generar-imagen', IAController.generarImagen);

/**
 * @route POST /api/ia/generar-variaciones-imagen
 * @description Generar múltiples variaciones de imagen
 * @access Editor+
 * @body {string} prompt - Prompt base (requerido)
 * @body {number} variaciones - Número de variaciones (max 4)
 * @body {string} size - Tamaño de las imágenes
 */
router.post('/generar-variaciones-imagen', IAController.generarVariacionesImagen);

/**
 * @route GET /api/ia/imagenes/:contenidoId
 * @description Obtener imágenes asociadas a un contenido
 * @access Editor+
 */
router.get('/imagenes/:contenidoId', IAController.getImagenesPorContenido);

/**
 * @route DELETE /api/ia/imagenes/:id
 * @description Eliminar una imagen
 * @access Admin
 */
router.delete('/imagenes/:id', isAdmin, IAController.eliminarImagen);

export default router;
