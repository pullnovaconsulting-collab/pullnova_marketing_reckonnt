/**
 * @fileoverview Rutas de Métricas
 * @description Endpoints para analytics y dashboard
 * @module routes/metricas
 */

import { Router } from 'express';
import * as MetricasController from '../controllers/metricas.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isEditor, isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

/**
 * @route GET /api/metricas/dashboard
 * @description Obtener estadísticas para el dashboard principal
 * @access Viewer+
 */
router.get('/dashboard', MetricasController.getDashboard);

/**
 * @route GET /api/metricas/kpis
 * @description Obtener KPIs principales
 * @access Viewer+
 * @query {string} periodo - semana|mes|trimestre
 */
router.get('/kpis', MetricasController.getKPIs);

/**
 * @route GET /api/metricas/resumen-diario
 * @description Obtener resumen diario de métricas
 * @access Viewer+
 * @query {string} desde - Fecha inicio (YYYY-MM-DD)
 * @query {string} hasta - Fecha fin (YYYY-MM-DD)
 * @query {string} plataforma - Filtro por plataforma
 */
router.get('/resumen-diario', MetricasController.getResumenDiario);

/**
 * @route GET /api/metricas/comparativa
 * @description Comparativa entre plataformas
 * @access Viewer+
 * @query {string} desde - Fecha inicio
 * @query {string} hasta - Fecha fin
 */
router.get('/comparativa', MetricasController.getComparativa);

/**
 * @route GET /api/metricas/logs-workers
 * @description Obtener logs de ejecución de workers
 * @access Admin
 * @query {string} worker - Nombre del worker (opcional)
 * @query {number} limit - Límite de registros
 */
router.get('/logs-workers', isAdmin, MetricasController.getLogsWorkers);

/**
 * @route GET /api/metricas/contenido/:id
 * @description Obtener métricas de un contenido específico
 * @access Viewer+
 */
router.get('/contenido/:id', MetricasController.getByContenido);

/**
 * @route GET /api/metricas/plataforma/:plataforma
 * @description Obtener métricas agregadas por plataforma
 * @access Viewer+
 * @query {string} desde - Fecha inicio
 * @query {string} hasta - Fecha fin
 */
router.get('/plataforma/:plataforma', MetricasController.getByPlataforma);

/**
 * @route POST /api/metricas
 * @description Guardar métricas manualmente
 * @access Editor+
 * @body {number} contenido_id - ID del contenido
 * @body {string} plataforma - Plataforma
 * @body {number} likes, comentarios, compartidos, etc.
 */
router.post('/', isEditor, MetricasController.guardar);

export default router;
