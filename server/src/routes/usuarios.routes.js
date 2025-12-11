/**
 * @fileoverview Rutas de Usuarios
 * @description Endpoints CRUD para usuarios (solo admin)
 * @module routes/usuarios
 */

import { Router } from 'express';
import * as UsuariosController from '../controllers/usuarios.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación y rol admin
router.use(verifyToken);
router.use(isAdmin);

/**
 * @route GET /api/usuarios
 * @description Listar usuarios con paginación
 * @access Admin
 */
router.get('/', UsuariosController.list);

/**
 * @route GET /api/usuarios/:id
 * @description Obtener usuario por ID
 * @access Admin
 */
router.get('/:id', UsuariosController.getById);

/**
 * @route POST /api/usuarios
 * @description Crear nuevo usuario
 * @access Admin
 */
router.post('/', UsuariosController.create);

/**
 * @route PUT /api/usuarios/:id
 * @description Actualizar usuario
 * @access Admin
 */
router.put('/:id', UsuariosController.update);

/**
 * @route DELETE /api/usuarios/:id
 * @description Eliminar (desactivar) usuario
 * @access Admin
 */
router.delete('/:id', UsuariosController.remove);

export default router;
