/**
 * @fileoverview Rutas de Contenido
 * @description Endpoints CRUD para contenido de marketing
 * @module routes/contenido
 */

import { Router } from 'express';
import * as ContenidoController from '../controllers/contenido.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isEditor, isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

/**
 * @route GET /api/contenido/stats
 * @description Obtener estadísticas de contenido
 * @access Editor+
 */
router.get('/stats', isEditor, ContenidoController.getStats);

/**
 * @route GET /api/contenido/pendientes
 * @description Obtener contenido pendiente de aprobación
 * @access Editor+
 */
router.get('/pendientes', isEditor, ContenidoController.getPendientes);

/**
 * @route GET /api/contenido
 * @description Listar contenido con paginación y filtros
 * @access Viewer+ (todos los usuarios autenticados)
 */
router.get('/', ContenidoController.list);

/**
 * @route GET /api/contenido/:id
 * @description Obtener contenido por ID
 * @access Viewer+
 */
router.get('/:id', ContenidoController.getById);

/**
 * @route POST /api/contenido
 * @description Crear nuevo contenido
 * @access Editor+
 */
router.post('/', isEditor, ContenidoController.create);

/**
 * @route PUT /api/contenido/:id
 * @description Actualizar contenido
 * @access Editor+
 */
router.put('/:id', isEditor, ContenidoController.update);

/**
 * @route PATCH /api/contenido/:id/estado
 * @description Cambiar estado del contenido
 * @access Editor+
 */
router.patch('/:id/estado', isEditor, ContenidoController.updateEstado);

/**
 * @route DELETE /api/contenido/:id
 * @description Eliminar contenido
 * @access Admin
 */
router.delete('/:id', isAdmin, ContenidoController.remove);

export default router;
