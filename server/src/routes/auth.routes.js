/**
 * @fileoverview Rutas de Autenticación
 * @description Endpoints para login, registro y perfil
 * @module routes/auth
 */

import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route POST /api/auth/register
 * @description Registrar nuevo usuario
 * @access Public
 */
router.post('/register', AuthController.register);

/**
 * @route POST /api/auth/login
 * @description Iniciar sesión
 * @access Public
 */
router.post('/login', AuthController.login);

/**
 * @route GET /api/auth/me
 * @description Obtener perfil del usuario autenticado
 * @access Private
 */
router.get('/me', verifyToken, AuthController.me);

/**
 * @route PUT /api/auth/password
 * @description Cambiar contraseña del usuario autenticado
 * @access Private
 */
router.put('/password', verifyToken, AuthController.changePassword);

export default router;
