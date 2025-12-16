/**
 * @fileoverview Rutas de Publicaciones Programadas
 * @description Endpoints para gestión de publicaciones programadas
 * @module routes/publicaciones
 */

import { Router } from 'express';
import * as PublicacionesController from '../controllers/publicaciones.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isEditor } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

/**
 * @route GET /api/publicaciones
 * @description Listar todas las publicaciones programadas
 * @access Viewer+
 * @query {number} page - Página
 * @query {number} limit - Límite por página
 * @query {string} estado - Filtrar por estado (pendiente, enviado, fallido)
 */
router.get('/', PublicacionesController.list);

/**
 * @route GET /api/publicaciones/stats
 * @description Obtener estadísticas de publicaciones
 * @access Viewer+
 */
router.get('/stats', PublicacionesController.getStats);

/**
 * @route GET /api/publicaciones/calendario
 * @description Obtener publicaciones para vista calendario
 * @access Viewer+
 * @query {string} desde - Fecha inicio (YYYY-MM-DD)
 * @query {string} hasta - Fecha fin (YYYY-MM-DD)
 */
router.get('/calendario', PublicacionesController.getCalendario);

/**
 * @route GET /api/publicaciones/contenido/:contenidoId
 * @description Obtener publicaciones de un contenido específico
 * @access Viewer+
 */
router.get('/contenido/:contenidoId', PublicacionesController.getByContenido);

/**
 * @route GET /api/publicaciones/:id
 * @description Obtener una publicación por ID
 * @access Viewer+
 */
router.get('/:id', PublicacionesController.getById);

/**
 * @route POST /api/publicaciones
 * @description Programar una nueva publicación
 * @access Editor+
 * @body {number} contenido_id - ID del contenido a publicar
 * @body {number} cuenta_social_id - ID de la cuenta social
 * @body {string} fecha_programada - Fecha y hora (ISO 8601)
 */
router.post('/', isEditor, PublicacionesController.create);

/**
 * @route POST /api/publicaciones/multiple
 * @description Programar múltiples publicaciones para un contenido
 * @access Editor+
 * @body {number} contenido_id - ID del contenido
 * @body {Array} programaciones - Array de { cuenta_social_id, fecha_programada }
 */
router.post('/multiple', isEditor, PublicacionesController.createMultiple);

/**
 * @route PATCH /api/publicaciones/:id/reprogramar
 * @description Reprogramar una publicación existente
 * @access Editor+
 * @body {string} fecha_programada - Nueva fecha y hora
 */
router.patch('/:id/reprogramar', isEditor, PublicacionesController.reprogramar);

/**
 * @route DELETE /api/publicaciones/:id
 * @description Cancelar una publicación programada
 * @access Editor+
 */
router.delete('/:id', isEditor, PublicacionesController.cancel);

export default router;
