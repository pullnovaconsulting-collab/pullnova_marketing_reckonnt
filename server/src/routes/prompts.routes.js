/**
 * @fileoverview Rutas de Prompts
 * @description Endpoints para gestión de plantillas de prompts IA
 * @module routes/prompts
 */

import { Router } from 'express';
import * as PromptsController from '../controllers/prompts.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isEditor, isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

/**
 * @route GET /api/prompts
 * @description Listar todos los prompts con paginación
 * @access Viewer+
 * @query {number} page - Página (default: 1)
 * @query {number} limit - Límite por página (default: 10)
 * @query {string} tipo - Filtrar por tipo
 */
router.get('/', PromptsController.list);

/**
 * @route GET /api/prompts/tipo/:tipo
 * @description Obtener prompts por tipo específico
 * @access Viewer+
 * @param {string} tipo - copy_post|calendario|imagen|otros
 */
router.get('/tipo/:tipo', PromptsController.getByTipo);

/**
 * @route GET /api/prompts/:id
 * @description Obtener un prompt por ID
 * @access Viewer+
 */
router.get('/:id', PromptsController.getById);

/**
 * @route POST /api/prompts
 * @description Crear un nuevo prompt
 * @access Editor+
 * @body {string} nombre - Nombre del prompt (requerido)
 * @body {string} tipo - Tipo de prompt
 * @body {string} plantilla - Plantilla con variables {{variable}} (requerido)
 */
router.post('/', isEditor, PromptsController.create);

/**
 * @route POST /api/prompts/:id/procesar
 * @description Procesar un prompt reemplazando variables
 * @access Editor+
 * @body {Object} - Objeto con variables a reemplazar
 */
router.post('/:id/procesar', isEditor, PromptsController.procesar);

/**
 * @route PUT /api/prompts/:id
 * @description Actualizar un prompt existente
 * @access Editor+
 * @body {string} nombre - Nuevo nombre
 * @body {string} tipo - Nuevo tipo
 * @body {string} plantilla - Nueva plantilla
 */
router.put('/:id', isEditor, PromptsController.update);

/**
 * @route DELETE /api/prompts/:id
 * @description Eliminar un prompt
 * @access Admin
 */
router.delete('/:id', isAdmin, PromptsController.remove);

export default router;
