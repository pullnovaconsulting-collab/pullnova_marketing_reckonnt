/**
 * @fileoverview Rutas de IA
 * @description Endpoints para generación de contenido con IA
 * @module routes/ia
 */

import { Router } from 'express';
import * as IAController from '../controllers/ia.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isEditor } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación y rol editor
router.use(verifyToken);
router.use(isEditor);

/**
 * @route GET /api/ia/status
 * @description Verificar estado de servicios IA
 * @access Editor+
 */
router.get('/status', IAController.getStatus);

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
 */
router.post('/generar-ideas', IAController.generarIdeas);

/**
 * @route POST /api/ia/mejorar-texto
 * @description Mejorar o reescribir un texto
 * @access Editor+
 * @body {string} texto - Texto original (requerido)
 * @body {string} instruccion - Tipo de mejora
 */
router.post('/mejorar-texto', IAController.mejorarTexto);

/**
 * @route POST /api/ia/generar-prompt-imagen
 * @description Generar prompt para creación de imagen
 * @access Editor+
 * @body {string} descripcion - Descripción de la imagen (requerido)
 * @body {string} estilo - Estilo visual
 * @body {string} colores - Paleta de colores
 * @body {string} tipo - ilustración|foto|minimalista
 */
router.post('/generar-prompt-imagen', IAController.generarPromptImagen);

export default router;
