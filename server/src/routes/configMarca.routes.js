/**
 * @fileoverview Rutas de Configuración de Marca
 * @description Endpoints para gestión de la configuración de marca
 * @module routes/configMarca
 */

import { Router } from 'express';
import * as ConfigMarcaController from '../controllers/configMarca.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isEditor, isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

/**
 * @route GET /api/config-marca
 * @description Obtener configuración de marca actual
 * @access Viewer+
 */
router.get('/', ConfigMarcaController.get);

/**
 * @route GET /api/config-marca/pilares
 * @description Obtener pilares de comunicación como array
 * @access Viewer+
 */
router.get('/pilares', ConfigMarcaController.getPilares);

/**
 * @route GET /api/config-marca/contexto-ia
 * @description Obtener contexto formateado para generación IA
 * @access Editor+
 */
router.get('/contexto-ia', isEditor, ConfigMarcaController.getContextoIA);

/**
 * @route PUT /api/config-marca
 * @description Actualizar configuración de marca
 * @access Admin
 * @body {string} nombre_marca - Nombre de la marca
 * @body {string} descripcion - Descripción de la marca
 * @body {string} tono_voz - Tono de voz para comunicaciones
 * @body {string} pilares_comunicacion - Pilares separados por coma
 * @body {number} frecuencia_semanal - Publicaciones por semana (1-14)
 * @body {string} segmento_principal - Segmento de audiencia principal
 */
router.put('/', isAdmin, ConfigMarcaController.update);

/**
 * @route POST /api/config-marca/reset
 * @description Resetear configuración a valores por defecto
 * @access Admin
 */
router.post('/reset', isAdmin, ConfigMarcaController.reset);

export default router;
