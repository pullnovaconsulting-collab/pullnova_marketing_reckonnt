/**
 * @fileoverview Controlador de Métricas
 * @description Endpoints para analytics y dashboard de métricas
 * @module controllers/metricas
 */

import * as MetricasModel from '../models/metricas.model.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

/**
 * Obtiene estadísticas para el dashboard principal
 * @route GET /api/metricas/dashboard
 */
export const getDashboard = async (req, res) => {
    try {
        const stats = await MetricasModel.getDashboardStats();

        // Calcular métricas adicionales
        const totales = stats.totales || {};
        const operativas = stats.operativas || {}; // NUEVO
        const engagement = parseFloat(totales.engagement_promedio) || 0;

        // Estimar ahorro de tiempo (aproximación)
        // Asumiendo que manualmente cada post toma ~30 minutos
        const totalPosts = parseInt(totales.total_contenidos_con_metricas) || 0;
        const tiempoAhorradoMinutos = totalPosts * 25; // 25 min ahorrados por post automatizado
        const tiempoAhorradoHoras = (tiempoAhorradoMinutos / 60).toFixed(1);

        return sendSuccess(res, {
            stats: {
                // Mapear stats operativas para el dashboard (NUEVO)
                campanas_activas: operativas.campanas_activas || 0,
                contenido_generado: operativas.contenido_generado || 0,
                programadas: operativas.publicaciones_programadas || 0,
                pendientes: operativas.publicaciones_pendientes || 0,

                // Mantener compatibilidad con stats anteriores
                contenido: totalPosts
            },
            resumen: {
                total_publicaciones: totalPosts,
                total_likes: parseInt(totales.total_likes) || 0,
                total_comentarios: parseInt(totales.total_comentarios) || 0,
                total_compartidos: parseInt(totales.total_compartidos) || 0,
                total_impresiones: parseInt(totales.total_impresiones) || 0,
                total_alcance: parseInt(totales.total_alcance) || 0,
                engagement_promedio: engagement.toFixed(2) + '%'
            },
            ahorro_tiempo: {
                minutos: tiempoAhorradoMinutos,
                horas: parseFloat(tiempoAhorradoHoras),
                descripcion: `Aproximadamente ${tiempoAhorradoHoras} horas ahorradas`
            },
            tendencia_7_dias: stats.ultimos_7_dias,
            top_contenidos: stats.top_contenidos,
            por_plataforma: stats.por_plataforma
        });
    } catch (error) {
        console.error('Error obteniendo dashboard:', error);
        return sendError(res, 'Error al obtener dashboard', 500);
    }
};

/**
 * Obtiene métricas de un contenido específico
 * @route GET /api/metricas/contenido/:id
 */
export const getByContenido = async (req, res) => {
    try {
        const { id } = req.params;
        const metricas = await MetricasModel.getByContenido(parseInt(id));
        const ultima = metricas[0] || null;

        return sendSuccess(res, {
            contenido_id: parseInt(id),
            ultima_medicion: ultima,
            historial: metricas,
            total_mediciones: metricas.length
        });
    } catch (error) {
        console.error('Error obteniendo métricas de contenido:', error);
        return sendError(res, 'Error al obtener métricas', 500);
    }
};

/**
 * Obtiene métricas agregadas por plataforma
 * @route GET /api/metricas/plataforma/:plataforma
 */
export const getByPlataforma = async (req, res) => {
    try {
        const { plataforma } = req.params;
        const { desde, hasta } = req.query;

        const validPlataformas = ['instagram', 'facebook', 'linkedin', 'todas'];
        if (!validPlataformas.includes(plataforma)) {
            return sendError(res, `Plataforma inválida. Opciones: ${validPlataformas.join(', ')}`, 400);
        }

        const metricas = await MetricasModel.getAgregadasPorPlataforma(plataforma, desde, hasta);

        return sendSuccess(res, {
            plataforma,
            periodo: { desde, hasta },
            metricas
        });
    } catch (error) {
        console.error('Error obteniendo métricas por plataforma:', error);
        return sendError(res, 'Error al obtener métricas', 500);
    }
};

/**
 * Obtiene resumen diario de métricas
 * @route GET /api/metricas/resumen-diario
 */
export const getResumenDiario = async (req, res) => {
    try {
        const { desde, hasta, plataforma } = req.query;

        // Si no se especifica, usar últimos 30 días
        const fechaHasta = hasta || new Date().toISOString().split('T')[0];
        const fechaDesde = desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const resumen = await MetricasModel.getResumenDiario(fechaDesde, fechaHasta, plataforma);

        return sendSuccess(res, {
            periodo: { desde: fechaDesde, hasta: fechaHasta },
            plataforma: plataforma || 'todas',
            resumen,
            total_dias: resumen.length
        });
    } catch (error) {
        console.error('Error obteniendo resumen diario:', error);
        return sendError(res, 'Error al obtener resumen', 500);
    }
};

/**
 * Guarda métricas manualmente (para testing o importación)
 * @route POST /api/metricas
 */
export const guardar = async (req, res) => {
    try {
        const {
            contenido_id,
            cuenta_social_id,
            external_post_id,
            plataforma,
            likes,
            comentarios,
            compartidos,
            guardados,
            impresiones,
            alcance,
            clics
        } = req.body;

        if (!contenido_id || !plataforma) {
            return sendError(res, 'Se requiere contenido_id y plataforma', 400);
        }

        const metrica = await MetricasModel.guardarMetricas({
            contenido_id,
            cuenta_social_id,
            external_post_id,
            plataforma,
            likes: parseInt(likes) || 0,
            comentarios: parseInt(comentarios) || 0,
            compartidos: parseInt(compartidos) || 0,
            guardados: parseInt(guardados) || 0,
            impresiones: parseInt(impresiones) || 0,
            alcance: parseInt(alcance) || 0,
            clics: parseInt(clics) || 0
        });

        return sendSuccess(res, { metrica }, 'Métricas guardadas', 201);
    } catch (error) {
        console.error('Error guardando métricas:', error);
        return sendError(res, 'Error al guardar métricas', 500);
    }
};

/**
 * Obtiene comparativa entre plataformas
 * @route GET /api/metricas/comparativa
 */
export const getComparativa = async (req, res) => {
    try {
        const { desde, hasta } = req.query;

        const [instagram, facebook, linkedin] = await Promise.all([
            MetricasModel.getAgregadasPorPlataforma('instagram', desde, hasta),
            MetricasModel.getAgregadasPorPlataforma('facebook', desde, hasta),
            MetricasModel.getAgregadasPorPlataforma('linkedin', desde, hasta)
        ]);

        return sendSuccess(res, {
            periodo: { desde, hasta },
            comparativa: {
                instagram: instagram[0] || { total_posts: 0 },
                facebook: facebook[0] || { total_posts: 0 },
                linkedin: linkedin[0] || { total_posts: 0 }
            }
        });
    } catch (error) {
        console.error('Error obteniendo comparativa:', error);
        return sendError(res, 'Error al obtener comparativa', 500);
    }
};

/**
 * Obtiene logs de workers
 * @route GET /api/metricas/logs-workers
 */
export const getLogsWorkers = async (req, res) => {
    try {
        const { worker, limit } = req.query;
        const logs = await MetricasModel.getLogsWorker(worker, parseInt(limit) || 50);

        return sendSuccess(res, { logs, total: logs.length });
    } catch (error) {
        console.error('Error obteniendo logs:', error);
        return sendError(res, 'Error al obtener logs', 500);
    }
};

/**
 * Obtiene KPIs principales para reporte
 * @route GET /api/metricas/kpis
 */
export const getKPIs = async (req, res) => {
    try {
        const { periodo } = req.query; // semana, mes, trimestre

        // Calcular fechas según período
        let diasAtras = 7;
        if (periodo === 'mes') diasAtras = 30;
        if (periodo === 'trimestre') diasAtras = 90;

        const desde = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const hasta = new Date().toISOString().split('T')[0];

        const stats = await MetricasModel.getDashboardStats();
        const totales = stats.totales || {};

        // Calcular KPIs
        const totalPosts = parseInt(totales.total_contenidos_con_metricas) || 0;
        const totalEngagement = parseInt(totales.total_likes || 0) +
            parseInt(totales.total_comentarios || 0) +
            parseInt(totales.total_compartidos || 0);
        const alcanceTotal = parseInt(totales.total_alcance) || 0;

        return sendSuccess(res, {
            periodo: { desde, hasta, descripcion: periodo || 'semana' },
            kpis: {
                // KPI 1: Frecuencia de publicación
                publicaciones_totales: totalPosts,
                publicaciones_por_semana: (totalPosts / (diasAtras / 7)).toFixed(1),
                meta_semanal: 4, // Según requisitos
                cumplimiento_frecuencia: ((totalPosts / (diasAtras / 7)) / 4 * 100).toFixed(0) + '%',

                // KPI 2: Engagement total
                engagement_total: totalEngagement,
                engagement_promedio_por_post: totalPosts > 0 ? (totalEngagement / totalPosts).toFixed(0) : 0,
                tasa_engagement: totales.engagement_promedio ? parseFloat(totales.engagement_promedio).toFixed(2) + '%' : '0%',

                // KPI 3: Alcance
                alcance_total: alcanceTotal,
                alcance_promedio_por_post: totalPosts > 0 ? Math.round(alcanceTotal / totalPosts) : 0,

                // KPI 4: Eficiencia (tiempo ahorrado)
                tiempo_ahorrado_horas: (totalPosts * 25 / 60).toFixed(1),
                costo_ahorrado_estimado: '$' + (totalPosts * 25 / 60 * 15).toFixed(0) // Asumiendo $15/hora
            }
        });
    } catch (error) {
        console.error('Error obteniendo KPIs:', error);
        return sendError(res, 'Error al obtener KPIs', 500);
    }
};
