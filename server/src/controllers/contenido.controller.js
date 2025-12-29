/**
 * @fileoverview Controlador de Contenido
 * @description Maneja CRUD de contenido de marketing
 * @module controllers/contenido
 */

import * as ContenidoModel from '../models/contenido.model.js';
import * as CampanasModel from '../models/campanas.model.js';
import * as PublicacionesModel from '../models/publicaciones.model.js';
import * as CuentasSocialesModel from '../models/cuentasSociales.model.js';
import * as ImagenesModel from '../models/imagenes.model.js';
import { sendSuccess, sendError, paginate, paginatedResponse, validateRequired } from '../utils/helpers.js';

/**
 * Maneja la programación automática de publicaciones
 * Crea o actualiza la entrada en publicaciones_programadas si el estado es 'programado'
 */
const handleScheduling = async (contenido) => {
    try {
        // 1. Si NO es programado, verificar si había algo pendiente y borrarlo
        if (contenido.estado !== 'programado') {
            const existentes = await PublicacionesModel.getByContenido(contenido.id);
            const pendiente = existentes.find(p => p.estado === 'pendiente');
            if (pendiente) {
                await PublicacionesModel.remove(pendiente.id);
                console.log(`[AutoSchedule] Eliminada publicación pendiente para contenido ${contenido.id} (estado cambió a ${contenido.estado})`);
            }
            return;
        }

        // 2. Si ES programado, validar fecha
        if (!contenido.fecha_publicacion) {
            console.warn(`[AutoSchedule] Contenido ${contenido.id} es programado pero no tiene fecha`);
            return;
        }

        // 3. Buscar cuenta conectada para la plataforma
        const cuentas = await CuentasSocialesModel.getByPlataforma(contenido.plataforma);
        if (!cuentas || cuentas.length === 0) {
            console.warn(`[AutoSchedule] No se pudo programar: No hay cuentas conectadas para ${contenido.plataforma}`);
            return;
        }
        const cuenta = cuentas[0]; // Usar la primera disponible

        // 4. Gestionar duplicados (Eliminar anterior si existe para recrear con nuevos datos)
        const existentes = await PublicacionesModel.getByContenido(contenido.id);
        const pendiente = existentes.find(p => p.estado === 'pendiente');
        
        if (pendiente) {
            await PublicacionesModel.remove(pendiente.id);
        }

        // 5. Crear nueva publicación programada
        await PublicacionesModel.create({
            contenido_id: contenido.id,
            cuenta_social_id: cuenta.id,
            fecha_programada: new Date(contenido.fecha_publicacion)
        });

        console.log(`[AutoSchedule] ✅ Contenido ${contenido.id} programado para ${contenido.fecha_publicacion} en ${cuenta.nombre_cuenta}`);

    } catch (error) {
        console.error('[AutoSchedule] Error:', error);
    }
};

/**
 * Lista todo el contenido con paginación y filtros
 * @route GET /api/contenido
 */
export const list = async (req, res) => {
    try {
        const { page, limit, campana_id, estado, plataforma, tipo } = req.query;
        const pagination = paginate(page, limit);

        const filters = {
            ...pagination,
            campana_id: campana_id ? parseInt(campana_id) : null,
            estado,
            plataforma,
            tipo
        };

        const [contenido, total] = await Promise.all([
            ContenidoModel.getAll(filters),
            ContenidoModel.count({ campana_id: filters.campana_id, estado })
        ]);

        return sendSuccess(res, paginatedResponse(contenido, total, pagination.page, pagination.limit));
    } catch (error) {
        console.error('Error listando contenido:', error);
        return sendError(res, 'Error al obtener contenido', 500);
    }
};

/**
 * Obtiene contenido por ID
 * @route GET /api/contenido/:id
 */
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const contenido = await ContenidoModel.getById(parseInt(id));

        if (!contenido) {
            return sendError(res, 'Contenido no encontrado', 404);
        }

        return sendSuccess(res, { contenido });
    } catch (error) {
        console.error('Error obteniendo contenido:', error);
        return sendError(res, 'Error al obtener contenido', 500);
    }
};

/**
 * Crea nuevo contenido
 * @route POST /api/contenido
 */
export const create = async (req, res) => {
    try {
        const {
            campana_id, titulo, contenido, copy_texto,
            tipo, plataforma, estado, prompt_usado, modelo_ia, fecha_publicacion,
            imagen_url, imagen_prompt  // Nuevos campos para imagen de IA
        } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, ['titulo']);
        if (!validation.valid) {
            return sendError(res, `Campos requeridos: ${validation.missing.join(', ')}`, 400);
        }

        // Validar que la campaña existe si se proporciona
        if (campana_id) {
            const campana = await CampanasModel.getById(parseInt(campana_id));
            if (!campana) {
                return sendError(res, 'Campaña no encontrada', 404);
            }
        }

        // Validar tipo
        const validTipos = ['post', 'imagen', 'video', 'carrusel', 'story'];
        if (tipo && !validTipos.includes(tipo)) {
            return sendError(res, `Tipo inválido. Opciones: ${validTipos.join(', ')}`, 400);
        }

        // Validar plataforma
        const validPlataformas = ['instagram', 'facebook', 'linkedin', 'twitter'];
        if (plataforma && !validPlataformas.includes(plataforma)) {
            return sendError(res, `Plataforma inválida. Opciones: ${validPlataformas.join(', ')}`, 400);
        }

        // Validar estado
        const validEstados = ['pendiente', 'aprobado', 'programado', 'publicado', 'rechazado'];
        if (estado && !validEstados.includes(estado)) {
            return sendError(res, `Estado inválido. Opciones: ${validEstados.join(', ')}`, 400);
        }

        const nuevoContenido = await ContenidoModel.create({
            campana_id: campana_id ? parseInt(campana_id) : null,
            titulo,
            contenido,
            copy_texto,
            tipo: tipo || 'post',
            plataforma: plataforma || 'instagram',
            estado: estado || 'pendiente',
            prompt_usado,
            modelo_ia,
            fecha_publicacion,
            created_by: req.user.id
        });

        console.log('[CONTENIDO] Nuevo contenido creado ID:', nuevoContenido.id);
        console.log('[CONTENIDO] imagen_url recibida:', imagen_url);
        console.log('[CONTENIDO] imagen_prompt recibida:', imagen_prompt);

        // Si se proporcionó una imagen, crear registro en tabla imagenes
        if (imagen_url) {
            console.log('[IMAGEN] ✅ Iniciando creación de registro de imagen...');
            try {
                const imagenCreada = await ImagenesModel.create({
                    contenido_id: nuevoContenido.id,
                    url_imagen: imagen_url,
                    prompt_imagen: imagen_prompt || 'Imagen generada con IA',
                    modelo_ia: modelo_ia || 'dall-e-3'
                });
                console.log('[IMAGEN] ✅ Registro creado exitosamente:', imagenCreada);
            } catch (imgError) {
                console.error('[IMAGEN] ❌ Error creando registro:', imgError);
                console.error('[IMAGEN] Stack trace:', imgError.stack);
                // No fallar la creación del contenido si falla la imagen
            }
        } else {
            console.log('[IMAGEN] ⚠️ No se recibió imagen_url');
        }

        // Intentar programar automáticamente
        await handleScheduling(nuevoContenido);

        return sendSuccess(res, { contenido: nuevoContenido }, 'Contenido creado exitosamente', 201);
    } catch (error) {
        console.error('Error creando contenido:', error);
        return sendError(res, 'Error al crear contenido', 500);
    }
};

/**
 * Actualiza contenido
 * @route PUT /api/contenido/:id
 */
export const update = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que existe
        const existingContenido = await ContenidoModel.getById(parseInt(id));
        if (!existingContenido) {
            return sendError(res, 'Contenido no encontrado', 404);
        }

        // Validar campaña si se proporciona
        if (req.body.campana_id) {
            const campana = await CampanasModel.getById(parseInt(req.body.campana_id));
            if (!campana) {
                return sendError(res, 'Campaña no encontrada', 404);
            }
        }

        // Validar tipo si se proporciona
        const validTipos = ['post', 'imagen', 'video', 'carrusel', 'story'];
        if (req.body.tipo && !validTipos.includes(req.body.tipo)) {
            return sendError(res, `Tipo inválido. Opciones: ${validTipos.join(', ')}`, 400);
        }

        // Validar plataforma si se proporciona
        const validPlataformas = ['instagram', 'facebook', 'linkedin', 'twitter'];
        if (req.body.plataforma && !validPlataformas.includes(req.body.plataforma)) {
            return sendError(res, `Plataforma inválida. Opciones: ${validPlataformas.join(', ')}`, 400);
        }

        // Validar estado si se proporciona
        const validEstados = ['pendiente', 'aprobado', 'programado', 'publicado', 'rechazado'];
        if (req.body.estado && !validEstados.includes(req.body.estado)) {
            return sendError(res, `Estado inválido. Opciones: ${validEstados.join(', ')}`, 400);
        }

        const updated = await ContenidoModel.update(parseInt(id), req.body);

        if (!updated) {
            return sendError(res, 'No se realizaron cambios', 400);
        }

        const contenido = await ContenidoModel.getById(parseInt(id));
        
        // Intentar programar automáticamente
        await handleScheduling(contenido);

        return sendSuccess(res, { contenido }, 'Contenido actualizado');
    } catch (error) {
        console.error('Error actualizando contenido:', error);
        return sendError(res, 'Error al actualizar contenido', 500);
    }
};

/**
 * Cambia el estado del contenido
 * @route PATCH /api/contenido/:id/estado
 */
export const updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const validEstados = ['pendiente', 'aprobado', 'programado', 'publicado', 'rechazado'];
        if (!estado || !validEstados.includes(estado)) {
            return sendError(res, `Estado requerido. Opciones: ${validEstados.join(', ')}`, 400);
        }

        const existingContenido = await ContenidoModel.getById(parseInt(id));
        if (!existingContenido) {
            return sendError(res, 'Contenido no encontrado', 404);
        }

        await ContenidoModel.updateEstado(parseInt(id), estado);

        return sendSuccess(res, { estado }, 'Estado actualizado');
    } catch (error) {
        console.error('Error actualizando estado:', error);
        return sendError(res, 'Error al actualizar estado', 500);
    }
};

/**
 * Elimina contenido
 * @route DELETE /api/contenido/:id
 */
export const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const existingContenido = await ContenidoModel.getById(parseInt(id));
        if (!existingContenido) {
            return sendError(res, 'Contenido no encontrado', 404);
        }

        await ContenidoModel.remove(parseInt(id));

        return sendSuccess(res, null, 'Contenido eliminado');
    } catch (error) {
        console.error('Error eliminando contenido:', error);
        return sendError(res, 'Error al eliminar contenido', 500);
    }
};

/**
 * Obtiene contenido pendiente de aprobación
 * @route GET /api/contenido/pendientes
 */
export const getPendientes = async (req, res) => {
    try {
        const { limit } = req.query;
        const contenido = await ContenidoModel.getPendingApproval(parseInt(limit) || 10);
        return sendSuccess(res, { contenido });
    } catch (error) {
        console.error('Error obteniendo pendientes:', error);
        return sendError(res, 'Error al obtener contenido pendiente', 500);
    }
};

/**
 * Obtiene estadísticas de contenido
 * @route GET /api/contenido/stats
 */
export const getStats = async (req, res) => {
    try {
        const stats = await ContenidoModel.getStats();
        return sendSuccess(res, { stats });
    } catch (error) {
        console.error('Error obteniendo stats:', error);
        return sendError(res, 'Error al obtener estadísticas', 500);
    }
};
