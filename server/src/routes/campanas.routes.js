/**
 * @fileoverview Rutas de Campañas
 * @description Endpoints CRUD para campañas de marketing
 * @module routes/campanas
 */

import { Router } from 'express';
import * as CampanasController from '../controllers/campanas.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isEditor, isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

/**
 * @route GET /api/campanas/stats
 * @description Obtener estadísticas de campañas
 * @access Editor+
 */
router.get('/stats', isEditor, CampanasController.getStats);

/**
 * @route GET /api/campanas
 * @description Listar campañas con paginación y filtros
 * @access Viewer+ (todos los usuarios autenticados)
 */
router.get('/', CampanasController.list);

/**
 * @route GET /api/campanas/:id
 * @description Obtener campaña por ID
 * @access Viewer+
 */
router.get('/:id', CampanasController.getById);

/**
 * @route POST /api/campanas
 * @description Crear nueva campaña
 * @access Editor+
 */
router.post('/', isEditor, CampanasController.create);

/**
 * @route PUT /api/campanas/:id
 * @description Actualizar campaña
 * @access Editor+
 */
router.put('/:id', isEditor, CampanasController.update);

/**
 * @route PATCH /api/campanas/:id/estado
 * @description Cambiar estado de campaña
 * @access Editor+
 */
router.patch('/:id/estado', isEditor, CampanasController.updateEstado);

/**
 * @route DELETE /api/campanas/:id
 * @description Eliminar campaña
 * @access Admin
 */
router.delete('/:id', isAdmin, CampanasController.remove);

export default router;
