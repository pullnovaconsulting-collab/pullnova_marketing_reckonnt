/**
 * @fileoverview Controlador de Campañas
 * @description Maneja CRUD de campañas de marketing
 * @module controllers/campanas
 */

import * as CampanasModel from '../models/campanas.model.js';
import { sendSuccess, sendError, paginate, paginatedResponse, validateRequired } from '../utils/helpers.js';

/**
 * Lista todas las campañas con paginación y filtros
 * @route GET /api/campanas
 */
export const list = async (req, res) => {
    try {
        const { page, limit, estado } = req.query;
        const pagination = paginate(page, limit);

        const [campanas, total] = await Promise.all([
            CampanasModel.getAll({ ...pagination, estado }),
            CampanasModel.count(estado)
        ]);

        return sendSuccess(res, paginatedResponse(campanas, total, pagination.page, pagination.limit));
    } catch (error) {
        console.error('Error listando campañas:', error);
        return sendError(res, 'Error al obtener campañas', 500);
    }
};

/**
 * Obtiene una campaña por ID
 * @route GET /api/campanas/:id
 */
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const campana = await CampanasModel.getById(parseInt(id));

        if (!campana) {
            return sendError(res, 'Campaña no encontrada', 404);
        }

        return sendSuccess(res, { campana });
    } catch (error) {
        console.error('Error obteniendo campaña:', error);
        return sendError(res, 'Error al obtener campaña', 500);
    }
};

/**
 * Crea una nueva campaña
 * @route POST /api/campanas
 */
export const create = async (req, res) => {
    try {
        const { nombre, descripcion, objetivo, estado, fecha_inicio, fecha_fin, presupuesto, plataformas, kpi_principal } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, ['nombre']);
        if (!validation.valid) {
            return sendError(res, `Campos requeridos: ${validation.missing.join(', ')}`, 400);
        }

        // Validar estado
        const validEstados = ['borrador', 'activa', 'pausada', 'completada'];
        if (estado && !validEstados.includes(estado)) {
            return sendError(res, `Estado inválido. Opciones: ${validEstados.join(', ')}`, 400);
        }

        // Validar KPI
        const validKpis = ['alcance', 'engagement', 'leads'];
        if (kpi_principal && !validKpis.includes(kpi_principal)) {
            return sendError(res, `KPI inválido. Opciones: ${validKpis.join(', ')}`, 400);
        }

        // Validar fechas
        if (fecha_inicio && fecha_fin && new Date(fecha_inicio) > new Date(fecha_fin)) {
            return sendError(res, 'La fecha de inicio no puede ser posterior a la fecha de fin', 400);
        }

        const campana = await CampanasModel.create({
            nombre,
            descripcion,
            objetivo,
            estado: estado || 'borrador',
            fecha_inicio,
            fecha_fin,
            presupuesto: presupuesto || 0,
            plataformas,
            kpi_principal
        });

        return sendSuccess(res, { campana }, 'Campaña creada exitosamente', 201);
    } catch (error) {
        console.error('Error creando campaña:', error);
        return sendError(res, 'Error al crear campaña', 500);
    }
};

/**
 * Actualiza una campaña
 * @route PUT /api/campanas/:id
 */
export const update = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que existe
        const existingCampana = await CampanasModel.getById(parseInt(id));
        if (!existingCampana) {
            return sendError(res, 'Campaña no encontrada', 404);
        }

        // Validar estado si se proporciona
        const validEstados = ['borrador', 'activa', 'pausada', 'completada'];
        if (req.body.estado && !validEstados.includes(req.body.estado)) {
            return sendError(res, `Estado inválido. Opciones: ${validEstados.join(', ')}`, 400);
        }

        // Validar KPI si se proporciona
        const validKpis = ['alcance', 'engagement', 'leads'];
        if (req.body.kpi_principal && !validKpis.includes(req.body.kpi_principal)) {
            return sendError(res, `KPI inválido. Opciones: ${validKpis.join(', ')}`, 400);
        }

        const updated = await CampanasModel.update(parseInt(id), req.body);

        if (!updated) {
            return sendError(res, 'No se realizaron cambios', 400);
        }

        const campana = await CampanasModel.getById(parseInt(id));
        return sendSuccess(res, { campana }, 'Campaña actualizada');
    } catch (error) {
        console.error('Error actualizando campaña:', error);
        return sendError(res, 'Error al actualizar campaña', 500);
    }
};

/**
 * Cambia el estado de una campaña
 * @route PATCH /api/campanas/:id/estado
 */
export const updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const validEstados = ['borrador', 'activa', 'pausada', 'completada'];
        if (!estado || !validEstados.includes(estado)) {
            return sendError(res, `Estado requerido. Opciones: ${validEstados.join(', ')}`, 400);
        }

        const existingCampana = await CampanasModel.getById(parseInt(id));
        if (!existingCampana) {
            return sendError(res, 'Campaña no encontrada', 404);
        }

        await CampanasModel.updateEstado(parseInt(id), estado);

        return sendSuccess(res, { estado }, 'Estado actualizado');
    } catch (error) {
        console.error('Error actualizando estado:', error);
        return sendError(res, 'Error al actualizar estado', 500);
    }
};

/**
 * Elimina una campaña
 * @route DELETE /api/campanas/:id
 */
export const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const existingCampana = await CampanasModel.getById(parseInt(id));
        if (!existingCampana) {
            return sendError(res, 'Campaña no encontrada', 404);
        }

        // Verificar que no tenga contenido asociado
        if (existingCampana.total_contenido > 0) {
            return sendError(res, `No se puede eliminar. La campaña tiene ${existingCampana.total_contenido} contenido(s) asociado(s)`, 400);
        }

        await CampanasModel.remove(parseInt(id));

        return sendSuccess(res, null, 'Campaña eliminada');
    } catch (error) {
        console.error('Error eliminando campaña:', error);
        return sendError(res, 'Error al eliminar campaña', 500);
    }
};

/**
 * Obtiene estadísticas de campañas
 * @route GET /api/campanas/stats
 */
export const getStats = async (req, res) => {
    try {
        const stats = await CampanasModel.getStats();
        return sendSuccess(res, { stats });
    } catch (error) {
        console.error('Error obteniendo stats:', error);
        return sendError(res, 'Error al obtener estadísticas', 500);
    }
};
