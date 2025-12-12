/**
 * @fileoverview Worker de Recolección de Métricas
 * @description Cron job que recolecta métricas de redes sociales
 * @module workers/metricsCollector
 */

import { pool } from '../config/db.js';
import * as MetricasModel from '../models/metricas.model.js';
import * as CuentasSocialesModel from '../models/cuentasSociales.model.js';

// Intervalo de recolección (por defecto cada 6 horas)
const INTERVALO_RECOLECCION = parseInt(process.env.METRICS_INTERVAL) || 6 * 60 * 60 * 1000;

// Estado del worker
let isRunning = false;
let intervalId = null;

/**
 * Ejecuta el ciclo de recolección de métricas
 */
export const ejecutarCiclo = async () => {
    if (isRunning) {
        console.log('[MetricsCollector] Ya hay un ciclo en ejecución, saltando...');
        return;
    }

    isRunning = true;
    const inicio = Date.now();
    let itemsProcesados = 0;

    try {
        console.log('[MetricsCollector] Iniciando recolección de métricas...');

        // Registrar inicio
        await MetricasModel.logWorker({
            worker_name: 'metrics_collector',
            tipo: 'metrics',
            estado: 'iniciado',
            mensaje: 'Iniciando recolección de métricas de redes sociales'
        });

        // Obtener publicaciones que tienen external_post_id (ya publicadas)
        const [publicaciones] = await pool.query(`
            SELECT pp.*, 
                   c.plataforma,
                   cs.access_token,
                   cs.page_id,
                   cs.plataforma as cuenta_plataforma
            FROM publicaciones_programadas pp
            INNER JOIN contenido c ON pp.contenido_id = c.id
            INNER JOIN cuentas_sociales cs ON pp.cuenta_social_id = cs.id
            WHERE pp.estado = 'enviado' 
              AND pp.external_post_id IS NOT NULL
              AND cs.estado = 'conectada'
        `);

        console.log(`[MetricsCollector] ${publicaciones.length} publicación(es) para recolectar métricas`);

        for (const pub of publicaciones) {
            try {
                const metricas = await obtenerMetricasPlataforma(pub);

                if (metricas.success) {
                    await MetricasModel.guardarMetricas({
                        contenido_id: pub.contenido_id,
                        cuenta_social_id: pub.cuenta_social_id,
                        external_post_id: pub.external_post_id,
                        plataforma: pub.cuenta_plataforma,
                        ...metricas.datos
                    });

                    console.log(`[MetricsCollector] ✅ Métricas guardadas para contenido ${pub.contenido_id}`);
                    itemsProcesados++;
                }
            } catch (error) {
                console.error(`[MetricsCollector] Error con publicación ${pub.id}:`, error.message);
            }
        }

        // Actualizar resumen diario
        await actualizarResumenDiario();

        const tiempoEjecucion = Date.now() - inicio;

        // Registrar finalización
        await MetricasModel.logWorker({
            worker_name: 'metrics_collector',
            tipo: 'metrics',
            estado: 'completado',
            mensaje: `Recolectadas métricas de ${itemsProcesados} publicaciones`,
            items_procesados: itemsProcesados,
            tiempo_ejecucion_ms: tiempoEjecucion
        });

        console.log(`[MetricsCollector] Ciclo completado en ${tiempoEjecucion}ms. Procesadas: ${itemsProcesados}`);

    } catch (error) {
        console.error('[MetricsCollector] Error en ciclo de recolección:', error);

        await MetricasModel.logWorker({
            worker_name: 'metrics_collector',
            tipo: 'metrics',
            estado: 'error',
            mensaje: error.message
        });
    } finally {
        isRunning = false;
    }
};

/**
 * Obtiene métricas de una publicación según su plataforma
 * @param {Object} publicacion - Datos de la publicación
 * @returns {Promise<Object>} Métricas obtenidas
 */
const obtenerMetricasPlataforma = async (publicacion) => {
    const { cuenta_plataforma, access_token, external_post_id, page_id } = publicacion;

    try {
        switch (cuenta_plataforma) {
            case 'facebook':
                return await obtenerMetricasFacebook(external_post_id, access_token);

            case 'instagram':
                return await obtenerMetricasInstagram(external_post_id, access_token);

            case 'linkedin':
                return await obtenerMetricasLinkedIn(external_post_id, access_token);

            default:
                return { success: false, error: 'Plataforma no soportada' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Obtiene métricas de Facebook
 */
const obtenerMetricasFacebook = async (postId, accessToken) => {
    try {
        const url = `https://graph.facebook.com/v18.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            success: true,
            datos: {
                likes: data.likes?.summary?.total_count || 0,
                comentarios: data.comments?.summary?.total_count || 0,
                compartidos: data.shares?.count || 0
            }
        };
    } catch (error) {
        console.error('[MetricsCollector] Error Facebook:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Obtiene métricas de Instagram
 */
const obtenerMetricasInstagram = async (mediaId, accessToken) => {
    try {
        const url = `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=impressions,reach,likes,comments,saved&access_token=${accessToken}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const metricas = {};
        data.data?.forEach(metric => {
            metricas[metric.name] = metric.values[0]?.value || 0;
        });

        return {
            success: true,
            datos: {
                likes: metricas.likes || 0,
                comentarios: metricas.comments || 0,
                guardados: metricas.saved || 0,
                impresiones: metricas.impressions || 0,
                alcance: metricas.reach || 0
            }
        };
    } catch (error) {
        console.error('[MetricsCollector] Error Instagram:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Obtiene métricas de LinkedIn
 */
const obtenerMetricasLinkedIn = async (postId, accessToken) => {
    try {
        // LinkedIn API para métricas de share
        const url = `https://api.linkedin.com/v2/socialActions/${postId}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        const data = await response.json();

        return {
            success: true,
            datos: {
                likes: data.likesSummary?.totalLikes || 0,
                comentarios: data.commentsSummary?.totalFirstLevelComments || 0,
                compartidos: 0 // LinkedIn API diferente
            }
        };
    } catch (error) {
        console.error('[MetricsCollector] Error LinkedIn:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Actualiza el resumen diario de métricas
 */
const actualizarResumenDiario = async () => {
    try {
        const hoy = new Date().toISOString().split('T')[0];

        // Obtener totales del día por plataforma
        const [totales] = await pool.query(`
            SELECT 
                plataforma,
                COUNT(*) as total_publicaciones,
                SUM(likes) as total_likes,
                SUM(comentarios) as total_comentarios,
                SUM(compartidos) as total_compartidos,
                SUM(impresiones) as total_impresiones,
                SUM(alcance) as total_alcance,
                SUM(clics) as total_clics,
                AVG(tasa_engagement) as engagement_promedio
            FROM metricas_contenido
            WHERE DATE(fecha_medicion) = ?
            GROUP BY plataforma
        `, [hoy]);

        // Actualizar resumen por plataforma
        for (const total of totales) {
            await MetricasModel.actualizarResumenDiario(hoy, total.plataforma, {
                total_publicaciones: total.total_publicaciones,
                total_likes: total.total_likes || 0,
                total_comentarios: total.total_comentarios || 0,
                total_compartidos: total.total_compartidos || 0,
                total_impresiones: total.total_impresiones || 0,
                total_alcance: total.total_alcance || 0,
                total_clics: total.total_clics || 0,
                engagement_promedio: total.engagement_promedio || 0
            });
        }

        // Actualizar resumen general
        const [general] = await pool.query(`
            SELECT 
                COUNT(*) as total_publicaciones,
                SUM(likes) as total_likes,
                SUM(comentarios) as total_comentarios,
                SUM(compartidos) as total_compartidos,
                AVG(tasa_engagement) as engagement_promedio
            FROM metricas_contenido
            WHERE DATE(fecha_medicion) = ?
        `, [hoy]);

        if (general[0]) {
            await MetricasModel.actualizarResumenDiario(hoy, 'todas', {
                total_publicaciones: general[0].total_publicaciones || 0,
                total_likes: general[0].total_likes || 0,
                total_comentarios: general[0].total_comentarios || 0,
                total_compartidos: general[0].total_compartidos || 0,
                engagement_promedio: general[0].engagement_promedio || 0
            });
        }

        console.log('[MetricsCollector] Resumen diario actualizado');
    } catch (error) {
        console.error('[MetricsCollector] Error actualizando resumen diario:', error);
    }
};

/**
 * Inicia el worker de recolección de métricas
 */
export const iniciar = () => {
    if (intervalId) {
        console.log('[MetricsCollector] Worker ya está corriendo');
        return;
    }

    console.log(`[MetricsCollector] Iniciando worker con intervalo de ${INTERVALO_RECOLECCION / 1000 / 60} minutos`);

    // Ejecutar después de un delay inicial (para no saturar al inicio)
    setTimeout(() => {
        ejecutarCiclo();
        intervalId = setInterval(ejecutarCiclo, INTERVALO_RECOLECCION);
    }, 60000); // Esperar 1 minuto antes de la primera ejecución

    console.log('[MetricsCollector] Worker programado');
};

/**
 * Detiene el worker de recolección de métricas
 */
export const detener = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[MetricsCollector] Worker detenido');
    }
};

/**
 * Obtiene el estado del worker
 */
export const getEstado = () => {
    return {
        ejecutando: isRunning,
        activo: intervalId !== null,
        intervalo_ms: INTERVALO_RECOLECCION,
        intervalo_horas: INTERVALO_RECOLECCION / 3600000
    };
};

/**
 * Ejecuta un ciclo manualmente
 */
export const ejecutarManual = async () => {
    console.log('[MetricsCollector] Ejecución manual iniciada');
    await ejecutarCiclo();
    return { success: true, mensaje: 'Ciclo de métricas ejecutado manualmente' };
};
