/**
 * @fileoverview Modelo de Métricas
 * @description Operaciones para las tablas de métricas y analytics
 * @module models/metricas
 */

import { pool } from '../config/db.js';

// ==================== MÉTRICAS DE CONTENIDO ====================

/**
 * Guarda métricas de una publicación
 * @param {Object} data - Datos de métricas
 * @returns {Promise<Object>} Métrica guardada
 */
export const guardarMetricas = async ({
    contenido_id,
    cuenta_social_id,
    external_post_id,
    plataforma,
    likes = 0,
    comentarios = 0,
    compartidos = 0,
    guardados = 0,
    impresiones = 0,
    alcance = 0,
    clics = 0,
    reproducciones = 0,
    tiempo_reproduccion = 0
}) => {
    // Calcular tasa de engagement
    const totalInteracciones = likes + comentarios + compartidos + guardados;
    const tasaEngagement = alcance > 0 ? (totalInteracciones / alcance) * 100 : 0;

    const [result] = await pool.query(
        `INSERT INTO metricas_contenido 
         (contenido_id, cuenta_social_id, external_post_id, plataforma,
          likes, comentarios, compartidos, guardados,
          impresiones, alcance, clics, reproducciones, tiempo_reproduccion,
          tasa_engagement)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            contenido_id, cuenta_social_id, external_post_id, plataforma,
            likes, comentarios, compartidos, guardados,
            impresiones, alcance, clics, reproducciones, tiempo_reproduccion,
            tasaEngagement.toFixed(2)
        ]
    );

    return {
        id: result.insertId,
        contenido_id,
        tasa_engagement: tasaEngagement.toFixed(2)
    };
};

/**
 * Obtiene métricas de un contenido
 * @param {number} contenidoId - ID del contenido
 * @returns {Promise<Array>} Lista de métricas
 */
export const getByContenido = async (contenidoId) => {
    const [rows] = await pool.query(
        `SELECT * FROM metricas_contenido 
         WHERE contenido_id = ? 
         ORDER BY fecha_medicion DESC`,
        [contenidoId]
    );
    return rows;
};

/**
 * Obtiene las últimas métricas de un contenido
 * @param {number} contenidoId - ID del contenido
 * @returns {Promise<Object|null>} Última métrica
 */
export const getUltimaMetrica = async (contenidoId) => {
    const [rows] = await pool.query(
        `SELECT * FROM metricas_contenido 
         WHERE contenido_id = ? 
         ORDER BY fecha_medicion DESC 
         LIMIT 1`,
        [contenidoId]
    );
    return rows[0] || null;
};

/**
 * Obtiene métricas agregadas por plataforma
 * @param {string} plataforma - Plataforma a consultar
 * @param {string} desde - Fecha inicio
 * @param {string} hasta - Fecha fin
 * @returns {Promise<Object>} Métricas agregadas
 */
export const getAgregadasPorPlataforma = async (plataforma, desde, hasta) => {
    let query = `
        SELECT 
            plataforma,
            COUNT(*) as total_posts,
            SUM(likes) as total_likes,
            SUM(comentarios) as total_comentarios,
            SUM(compartidos) as total_compartidos,
            SUM(impresiones) as total_impresiones,
            SUM(alcance) as total_alcance,
            SUM(clics) as total_clics,
            AVG(tasa_engagement) as engagement_promedio
        FROM metricas_contenido
        WHERE 1=1
    `;
    const params = [];

    if (plataforma && plataforma !== 'todas') {
        query += ' AND plataforma = ?';
        params.push(plataforma);
    }
    if (desde) {
        query += ' AND fecha_medicion >= ?';
        params.push(desde);
    }
    if (hasta) {
        query += ' AND fecha_medicion <= ?';
        params.push(hasta);
    }

    query += ' GROUP BY plataforma';

    const [rows] = await pool.query(query, params);
    return rows;
};

// ==================== RESUMEN DIARIO ====================

/**
 * Actualiza o crea el resumen diario de métricas
 * @param {string} fecha - Fecha del resumen (YYYY-MM-DD)
 * @param {string} plataforma - Plataforma
 * @param {Object} datos - Datos del resumen
 */
export const actualizarResumenDiario = async (fecha, plataforma, datos) => {
    const {
        total_publicaciones = 0,
        publicaciones_exitosas = 0,
        publicaciones_fallidas = 0,
        total_likes = 0,
        total_comentarios = 0,
        total_compartidos = 0,
        total_impresiones = 0,
        total_alcance = 0,
        total_clics = 0,
        engagement_promedio = 0
    } = datos;

    await pool.query(`
        INSERT INTO metricas_resumen_diario 
        (fecha, plataforma, total_publicaciones, publicaciones_exitosas, publicaciones_fallidas,
         total_likes, total_comentarios, total_compartidos, total_impresiones, total_alcance,
         total_clics, engagement_promedio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            total_publicaciones = VALUES(total_publicaciones),
            publicaciones_exitosas = VALUES(publicaciones_exitosas),
            publicaciones_fallidas = VALUES(publicaciones_fallidas),
            total_likes = VALUES(total_likes),
            total_comentarios = VALUES(total_comentarios),
            total_compartidos = VALUES(total_compartidos),
            total_impresiones = VALUES(total_impresiones),
            total_alcance = VALUES(total_alcance),
            total_clics = VALUES(total_clics),
            engagement_promedio = VALUES(engagement_promedio)
    `, [
        fecha, plataforma, total_publicaciones, publicaciones_exitosas, publicaciones_fallidas,
        total_likes, total_comentarios, total_compartidos, total_impresiones, total_alcance,
        total_clics, engagement_promedio
    ]);
};

/**
 * Obtiene resumen diario para un rango de fechas
 * @param {string} desde - Fecha inicio
 * @param {string} hasta - Fecha fin
 * @param {string} plataforma - Filtro de plataforma
 * @returns {Promise<Array>} Resúmenes diarios
 */
export const getResumenDiario = async (desde, hasta, plataforma = 'todas') => {
    let query = 'SELECT * FROM metricas_resumen_diario WHERE 1=1';
    const params = [];

    if (desde) {
        query += ' AND fecha >= ?';
        params.push(desde);
    }
    if (hasta) {
        query += ' AND fecha <= ?';
        params.push(hasta);
    }
    if (plataforma && plataforma !== 'todas') {
        query += ' AND plataforma = ?';
        params.push(plataforma);
    }

    query += ' ORDER BY fecha DESC';

    const [rows] = await pool.query(query, params);
    return rows;
};

// ==================== DASHBOARD ====================

/**
 * Obtiene estadísticas para el dashboard
 * @returns {Promise<Object>} Estadísticas del dashboard
 */
export const getDashboardStats = async () => {
    // Estadísticas generales
    const [totales] = await pool.query(`
        SELECT 
            COUNT(DISTINCT contenido_id) as total_contenidos_con_metricas,
            SUM(likes) as total_likes,
            SUM(comentarios) as total_comentarios,
            SUM(compartidos) as total_compartidos,
            SUM(impresiones) as total_impresiones,
            SUM(alcance) as total_alcance,
            AVG(tasa_engagement) as engagement_promedio
        FROM metricas_contenido
    `);

    // Métricas de los últimos 7 días
    const [ultimos7Dias] = await pool.query(`
        SELECT 
            DATE(fecha_medicion) as fecha,
            SUM(likes) as likes,
            SUM(comentarios) as comentarios,
            SUM(impresiones) as impresiones,
            COUNT(*) as posts
        FROM metricas_contenido
        WHERE fecha_medicion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(fecha_medicion)
        ORDER BY fecha ASC
    `);

    // Top 5 contenidos por engagement
    const [topContenidos] = await pool.query(`
        SELECT 
            mc.contenido_id,
            c.titulo,
            mc.plataforma,
            mc.likes,
            mc.comentarios,
            mc.tasa_engagement
        FROM metricas_contenido mc
        LEFT JOIN contenido c ON mc.contenido_id = c.id
        ORDER BY mc.tasa_engagement DESC
        LIMIT 5
    `);

    // Estadísticas por plataforma
    const [porPlataforma] = await pool.query(`
        SELECT 
            plataforma,
            COUNT(*) as total_posts,
            SUM(likes) as likes,
            SUM(comentarios) as comentarios,
            AVG(tasa_engagement) as engagement_promedio
        FROM metricas_contenido
        GROUP BY plataforma
    `);

    return {
        totales: totales[0],
        ultimos_7_dias: ultimos7Dias,
        top_contenidos: topContenidos,
        por_plataforma: porPlataforma
    };
};

// ==================== LOGS DE WORKERS ====================

/**
 * Registra la ejecución de un worker
 * @param {Object} data - Datos del log
 * @returns {Promise<number>} ID del log
 */
export const logWorker = async ({
    worker_name,
    tipo,
    estado,
    mensaje = null,
    items_procesados = 0,
    tiempo_ejecucion_ms = 0
}) => {
    const [result] = await pool.query(
        `INSERT INTO logs_workers 
         (worker_name, tipo, estado, mensaje, items_procesados, tiempo_ejecucion_ms)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [worker_name, tipo, estado, mensaje, items_procesados, tiempo_ejecucion_ms]
    );
    return result.insertId;
};

/**
 * Obtiene logs de workers recientes
 * @param {string} workerName - Nombre del worker (opcional)
 * @param {number} limit - Límite de registros
 * @returns {Promise<Array>} Logs
 */
export const getLogsWorker = async (workerName = null, limit = 50) => {
    let query = 'SELECT * FROM logs_workers';
    const params = [];

    if (workerName) {
        query += ' WHERE worker_name = ?';
        params.push(workerName);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(query, params);
    return rows;
};
