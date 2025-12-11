/**
 * @fileoverview Controlador de Usuarios
 * @description Maneja CRUD de usuarios (solo admin)
 * @module controllers/usuarios
 */

import * as UsuariosModel from '../models/usuarios.model.js';
import { sendSuccess, sendError, paginate, paginatedResponse, validateRequired } from '../utils/helpers.js';

/**
 * Lista todos los usuarios con paginación
 * @route GET /api/usuarios
 */
export const list = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pagination = paginate(page, limit);

        const [users, total] = await Promise.all([
            UsuariosModel.getAll(pagination),
            UsuariosModel.count()
        ]);

        return sendSuccess(res, paginatedResponse(users, total, pagination.page, pagination.limit));
    } catch (error) {
        console.error('Error listando usuarios:', error);
        return sendError(res, 'Error al obtener usuarios', 500);
    }
};

/**
 * Obtiene un usuario por ID
 * @route GET /api/usuarios/:id
 */
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UsuariosModel.getById(parseInt(id));

        if (!user) {
            return sendError(res, 'Usuario no encontrado', 404);
        }

        return sendSuccess(res, { user });
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return sendError(res, 'Error al obtener usuario', 500);
    }
};

/**
 * Crea un nuevo usuario (admin)
 * @route POST /api/usuarios
 */
export const create = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, ['nombre', 'email', 'password']);
        if (!validation.valid) {
            return sendError(res, `Campos requeridos: ${validation.missing.join(', ')}`, 400);
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return sendError(res, 'Formato de email inválido', 400);
        }

        // Verificar email único
        if (await UsuariosModel.emailExists(email)) {
            return sendError(res, 'El email ya está registrado', 409);
        }

        // Validar rol
        const validRoles = ['admin', 'editor', 'viewer'];
        if (rol && !validRoles.includes(rol)) {
            return sendError(res, `Rol inválido. Opciones: ${validRoles.join(', ')}`, 400);
        }

        const user = await UsuariosModel.create({
            nombre,
            email,
            password,
            rol: rol || 'viewer'
        });

        return sendSuccess(res, { user }, 'Usuario creado exitosamente', 201);
    } catch (error) {
        console.error('Error creando usuario:', error);
        return sendError(res, 'Error al crear usuario', 500);
    }
};

/**
 * Actualiza un usuario
 * @route PUT /api/usuarios/:id
 */
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol, estado } = req.body;

        // Verificar que el usuario existe
        const existingUser = await UsuariosModel.getById(parseInt(id));
        if (!existingUser) {
            return sendError(res, 'Usuario no encontrado', 404);
        }

        // Validar email si se proporciona
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return sendError(res, 'Formato de email inválido', 400);
            }

            if (await UsuariosModel.emailExists(email, parseInt(id))) {
                return sendError(res, 'El email ya está en uso', 409);
            }
        }

        // Validar rol
        const validRoles = ['admin', 'editor', 'viewer'];
        if (rol && !validRoles.includes(rol)) {
            return sendError(res, `Rol inválido. Opciones: ${validRoles.join(', ')}`, 400);
        }

        // Validar estado
        const validEstados = ['activo', 'inactivo'];
        if (estado && !validEstados.includes(estado)) {
            return sendError(res, `Estado inválido. Opciones: ${validEstados.join(', ')}`, 400);
        }

        const updated = await UsuariosModel.update(parseInt(id), { nombre, email, rol, estado });

        if (!updated) {
            return sendError(res, 'No se realizaron cambios', 400);
        }

        const user = await UsuariosModel.getById(parseInt(id));
        return sendSuccess(res, { user }, 'Usuario actualizado');
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        return sendError(res, 'Error al actualizar usuario', 500);
    }
};

/**
 * Elimina (desactiva) un usuario
 * @route DELETE /api/usuarios/:id
 */
export const remove = async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir auto-eliminación
        if (parseInt(id) === req.user.id) {
            return sendError(res, 'No puedes eliminarte a ti mismo', 400);
        }

        const existingUser = await UsuariosModel.getById(parseInt(id));
        if (!existingUser) {
            return sendError(res, 'Usuario no encontrado', 404);
        }

        // Soft delete
        await UsuariosModel.softDelete(parseInt(id));

        return sendSuccess(res, null, 'Usuario desactivado exitosamente');
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        return sendError(res, 'Error al eliminar usuario', 500);
    }
};
