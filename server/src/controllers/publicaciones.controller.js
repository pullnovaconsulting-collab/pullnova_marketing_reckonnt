/**
 * @fileoverview Controlador de Publicaciones Programadas
 * @description Gestión de publicaciones programadas para redes sociales
 * @module controllers/publicaciones
 */

import * as PublicacionesModel from '../models/publicaciones.model.js';
import * as ContenidoModel from '../models/contenido.model.js';
import * as CuentasSocialesModel from '../models/cuentasSociales.model.js';
import { sendSuccess, sendError, paginate, paginatedResponse, validateRequired } from '../utils/helpers.js';

/**
 * Lista todas las publicaciones programadas
 * @route GET /api/publicaciones
 */
export const list = async (req, res) => {
    try {
        const { page, limit, estado } = req.query;
        const pagination = paginate(page, limit);

        const [publicaciones, total] = await Promise.all([
            PublicacionesModel.getAll({ ...pagination, estado }),
            PublicacionesModel.count(estado)
        ]);

        return sendSuccess(res, paginatedResponse(publicaciones, total, pagination.page, pagination.limit));
    } catch (error) {
        console.error('Error listando publicaciones:', error);
        return sendError(res, 'Error al obtener publicaciones', 500);
    }
};

/**
 * Obtiene una publicación por ID
 * @route GET /api/publicaciones/:id
 */
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const publicacion = await PublicacionesModel.getById(parseInt(id));

        if (!publicacion) {
            return sendError(res, 'Publicación no encontrada', 404);
        }

        return sendSuccess(res, { publicacion });
    } catch (error) {
        console.error('Error obteniendo publicación:', error);
        return sendError(res, 'Error al obtener publicación', 500);
    }
};

/**
 * Programa una nueva publicación
 * @route POST /api/publicaciones
 */
export const create = async (req, res) => {
    try {
        const { contenido_id, cuenta_social_id, fecha_programada } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, ['contenido_id', 'cuenta_social_id', 'fecha_programada']);
        if (!validation.valid) {
            return sendError(res, `Campos requeridos: ${validation.missing.join(', ')}`, 400);
        }

        // Verificar que el contenido existe y está aprobado
        const contenido = await ContenidoModel.getById(parseInt(contenido_id));
        if (!contenido) {
            return sendError(res, 'Contenido no encontrado', 404);
        }
        if (contenido.estado !== 'aprobado' && contenido.estado !== 'programado') {
            return sendError(res, 'El contenido debe estar aprobado para programar publicación', 400);
        }

        // Verificar que la cuenta social existe y está conectada
        const cuenta = await CuentasSocialesModel.getById(parseInt(cuenta_social_id));
        if (!cuenta) {
            return sendError(res, 'Cuenta social no encontrada', 404);
        }
        if (cuenta.estado !== 'conectada') {
            return sendError(res, 'La cuenta social no está conectada', 400);
        }

        // Validar fecha programada
        const fechaProg = new Date(fecha_programada);
        if (isNaN(fechaProg.getTime())) {
            return sendError(res, 'Fecha programada inválida', 400);
        }
        if (fechaProg < new Date()) {
            return sendError(res, 'La fecha programada debe ser en el futuro', 400);
        }

        // Crear la publicación programada
        const publicacion = await PublicacionesModel.create({
            contenido_id: parseInt(contenido_id),
            cuenta_social_id: parseInt(cuenta_social_id),
            fecha_programada: fechaProg
        });

        // Actualizar estado del contenido a 'programado'
        await ContenidoModel.updateEstado(parseInt(contenido_id), 'programado');

        return sendSuccess(res, { publicacion }, 'Publicación programada exitosamente', 201);
    } catch (error) {
        console.error('Error programando publicación:', error);
        return sendError(res, 'Error al programar publicación', 500);
    }
};

/**
 * Programa múltiples publicaciones para un contenido
 * @route POST /api/publicaciones/multiple
 */
export const createMultiple = async (req, res) => {
    try {
        const { contenido_id, programaciones } = req.body;

        // Validar
        if (!contenido_id || !Array.isArray(programaciones) || programaciones.length === 0) {
            return sendError(res, 'Se requiere contenido_id y array de programaciones', 400);
        }

        // Verificar contenido
        const contenido = await ContenidoModel.getById(parseInt(contenido_id));
        if (!contenido) {
            return sendError(res, 'Contenido no encontrado', 404);
        }

        const resultados = [];
        const errores = [];

        for (const prog of programaciones) {
            try {
                const publicacion = await PublicacionesModel.create({
                    contenido_id: parseInt(contenido_id),
                    cuenta_social_id: parseInt(prog.cuenta_social_id),
                    fecha_programada: new Date(prog.fecha_programada)
                });
                resultados.push(publicacion);
            } catch (err) {
                errores.push({
                    cuenta_social_id: prog.cuenta_social_id,
                    error: err.message
                });
            }
        }

        // Actualizar estado del contenido
        if (resultados.length > 0) {
            await ContenidoModel.updateEstado(parseInt(contenido_id), 'programado');
        }

        return sendSuccess(res, {
            publicaciones_creadas: resultados,
            errores: errores,
            total_creadas: resultados.length,
            total_errores: errores.length
        }, 'Programación múltiple completada', 201);
    } catch (error) {
        console.error('Error en programación múltiple:', error);
        return sendError(res, 'Error al programar publicaciones', 500);
    }
};

/**
 * Cancela una publicación programada
 * @route DELETE /api/publicaciones/:id
 */
export const cancel = async (req, res) => {
    try {
        const { id } = req.params;

        const publicacion = await PublicacionesModel.getById(parseInt(id));
        if (!publicacion) {
            return sendError(res, 'Publicación no encontrada', 404);
        }

        if (publicacion.estado !== 'pendiente') {
            return sendError(res, 'Solo se pueden cancelar publicaciones pendientes', 400);
        }

        await PublicacionesModel.remove(parseInt(id));

        return sendSuccess(res, null, 'Publicación cancelada');
    } catch (error) {
        console.error('Error cancelando publicación:', error);
        return sendError(res, 'Error al cancelar publicación', 500);
    }
};

/**
 * Obtiene publicaciones de un contenido específico
 * @route GET /api/publicaciones/contenido/:contenidoId
 */
export const getByContenido = async (req, res) => {
    try {
        const { contenidoId } = req.params;
        const publicaciones = await PublicacionesModel.getByContenido(parseInt(contenidoId));

        return sendSuccess(res, { publicaciones, total: publicaciones.length });
    } catch (error) {
        console.error('Error obteniendo publicaciones por contenido:', error);
        return sendError(res, 'Error al obtener publicaciones', 500);
    }
};

/**
 * Obtiene publicaciones pendientes para el calendario
 * @route GET /api/publicaciones/calendario
 */
export const getCalendario = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        const { pool } = await import('../config/db.js');

        // 1. Obtener Publicaciones Programadas (Ya existente)
        let queryProgramadas = `
            SELECT pp.id, pp.fecha_programada, pp.estado,
                   pp.contenido_id, pp.cuenta_social_id,
                   c.titulo, c.plataforma as contenido_plataforma,
                   cs.nombre_cuenta,
                   'programado' as source_type
            FROM publicaciones_programadas pp
            LEFT JOIN contenido c ON pp.contenido_id = c.id
            LEFT JOIN cuentas_sociales cs ON pp.cuenta_social_id = cs.id
            WHERE 1=1
        `;
        const paramsProgramadas = [];

        if (desde) {
            queryProgramadas += ' AND pp.fecha_programada >= ?';
            paramsProgramadas.push(desde);
        }
        if (hasta) {
            queryProgramadas += ' AND pp.fecha_programada <= ?';
            paramsProgramadas.push(hasta);
        }

        // 2. Obtener Contenido con Fecha pero NO programado (Pendientes/Aprobados)
        // Esto soluciona los "items fantasma" y asegura sincronización instantánea
        let queryContenido = `
            SELECT c.id as contenido_id, c.fecha_publicacion as fecha_programada, c.estado,
                   c.titulo, c.plataforma as contenido_plataforma,
                   NULL as id, NULL as cuenta_social_id, NULL as nombre_cuenta,
                   'contenido' as source_type
            FROM contenido c
            WHERE c.fecha_publicacion IS NOT NULL
            AND c.estado != 'programado'
        `;
        const paramsContenido = [];

        if (desde) {
            queryContenido += ' AND c.fecha_publicacion >= ?';
            paramsContenido.push(desde);
        }
        if (hasta) {
            queryContenido += ' AND c.fecha_publicacion <= ?';
            paramsContenido.push(hasta);
        }

        // Ejecutar ambas consultas en paralelo
        const [rowsProgramadas, rowsContenido] = await Promise.all([
            pool.query(queryProgramadas, paramsProgramadas).then(([rows]) => rows),
            pool.query(queryContenido, paramsContenido).then(([rows]) => rows)
        ]);

        // Combinar resultados
        // Mapeamos el contenido para que tenga la estructura que espera el frontend
        const contenidoMapeado = rowsContenido.map(c => ({
            ...c,
            id: `temp-${c.contenido_id}`, // ID temporal para keys de React
            es_proyeccion: true // Flag para indicar que no es una publicación real todavía
        }));

        const allEvents = [...rowsProgramadas, ...contenidoMapeado];

        // Ordenar por fecha
        allEvents.sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));

        // Agrupar por fecha para el calendario
        const calendario = {};
        allEvents.forEach(pub => {
            const fecha = new Date(pub.fecha_programada).toISOString().split('T')[0];
            if (!calendario[fecha]) {
                calendario[fecha] = [];
            }
            calendario[fecha].push(pub);
        });

        return sendSuccess(res, {
            publicaciones: allEvents,
            calendario,
            total: allEvents.length
        });
    } catch (error) {
        console.error('Error obteniendo calendario:', error);
        return sendError(res, 'Error al obtener calendario', 500);
    }
};

/**
 * Obtiene estadísticas de publicaciones
 * @route GET /api/publicaciones/stats
 */
export const getStats = async (req, res) => {
    try {
        const stats = await PublicacionesModel.getStats();
        return sendSuccess(res, { stats });
    } catch (error) {
        console.error('Error obteniendo stats:', error);
        return sendError(res, 'Error al obtener estadísticas', 500);
    }
};

/**
 * Reprograma una publicación
 * @route PATCH /api/publicaciones/:id/reprogramar
 */
export const reprogramar = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_programada } = req.body;

        if (!fecha_programada) {
            return sendError(res, 'Se requiere nueva fecha_programada', 400);
        }

        const publicacion = await PublicacionesModel.getById(parseInt(id));
        if (!publicacion) {
            return sendError(res, 'Publicación no encontrada', 404);
        }

        if (publicacion.estado !== 'pendiente' && publicacion.estado !== 'fallido') {
            return sendError(res, 'Solo se pueden reprogramar publicaciones pendientes o fallidas', 400);
        }

        const nuevaFecha = new Date(fecha_programada);
        if (nuevaFecha < new Date()) {
            return sendError(res, 'La nueva fecha debe ser en el futuro', 400);
        }

        const { pool } = await import('../config/db.js');
        await pool.query(
            `UPDATE publicaciones_programadas SET fecha_programada = ?, estado = 'pendiente' WHERE id = ?`,
            [nuevaFecha, parseInt(id)]
        );

        const updated = await PublicacionesModel.getById(parseInt(id));
        return sendSuccess(res, { publicacion: updated }, 'Publicación reprogramada');
    } catch (error) {
        console.error('Error reprogramando:', error);
        return sendError(res, 'Error al reprogramar', 500);
    }
};
