/**
 * @fileoverview Rutas de Redes Sociales
 * @description Endpoints para OAuth y publicación en redes
 * @module routes/social
 */

import { Router } from 'express';
import * as SocialController from '../controllers/social.controller.js';
import { verifyToken, optionalAuth } from '../middlewares/auth.middleware.js';
import { isEditor, isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

/**
 * @route GET /api/social/status
 * @description Estado de configuración de redes sociales
 * @access Editor+
 */
router.get('/status', verifyToken, isEditor, SocialController.getStatus);

/**
 * @route GET /api/social/cuentas
 * @description Listar cuentas sociales conectadas
 * @access Editor+
 */
router.get('/cuentas', verifyToken, isEditor, SocialController.getCuentas);

/**
 * @route DELETE /api/social/cuentas/:id
 * @description Desconectar una cuenta social
 * @access Admin
 */
router.delete('/cuentas/:id', verifyToken, isAdmin, SocialController.desconectarCuenta);

// ==================== META OAuth ====================

/**
 * @route GET /api/social/meta/auth
 * @description Iniciar flujo OAuth con Meta (Facebook/Instagram)
 * @access Editor+
 */
router.get('/meta/auth', verifyToken, isEditor, SocialController.iniciarAuthMeta);

/**
 * @route GET /api/social/meta/callback
 * @description Callback OAuth de Meta
 * @access Public (viene de Meta)
 */
router.get('/meta/callback', optionalAuth, SocialController.callbackMeta);

// ==================== LinkedIn OAuth ====================

/**
 * @route GET /api/social/linkedin/auth
 * @description Iniciar flujo OAuth con LinkedIn
 * @access Editor+
 */
router.get('/linkedin/auth', verifyToken, isEditor, SocialController.iniciarAuthLinkedIn);

/**
 * @route GET /api/social/linkedin/callback
 * @description Callback OAuth de LinkedIn
 * @access Public (viene de LinkedIn)
 */
router.get('/linkedin/callback', optionalAuth, SocialController.callbackLinkedIn);

// ==================== Publicación ====================

/**
 * @route POST /api/social/publicar/:contenidoId
 * @description Publicar contenido en una red social
 * @access Editor+
 * @body {number} cuenta_id - ID de la cuenta social a usar
 */
router.post('/publicar/:contenidoId', verifyToken, isEditor, SocialController.publicarContenido);

export default router;
