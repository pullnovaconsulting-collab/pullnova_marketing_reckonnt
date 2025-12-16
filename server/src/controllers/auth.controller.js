/**
 * @fileoverview Controlador de Autenticación
 * @description Maneja login, registro y perfil de usuario
 * @module controllers/auth
 */

import jwt from 'jsonwebtoken';
import * as UsuariosModel from '../models/usuarios.model.js';
import { sendSuccess, sendError, validateRequired } from '../utils/helpers.js';

/**
 * Registra un nuevo usuario
 * @route POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, ['nombre', 'email', 'password']);
        if (!validation.valid) {
            return sendError(res, `Campos requeridos faltantes: ${validation.missing.join(', ')}`, 400);
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return sendError(res, 'Formato de email inválido', 400);
        }

        // Validar longitud de password
        if (password.length < 6) {
            return sendError(res, 'La contraseña debe tener al menos 6 caracteres', 400);
        }

        // Verificar si el email ya existe
        if (await UsuariosModel.emailExists(email)) {
            return sendError(res, 'El email ya está registrado', 409);
        }

        // Validar rol (solo admin puede crear otros admins)
        let assignedRol = 'viewer'; // Default
        if (rol && ['viewer', 'editor'].includes(rol)) {
            assignedRol = rol;
        }
        // Para crear admin, se debe hacer desde un usuario admin existente

        // Crear usuario
        const user = await UsuariosModel.create({
            nombre,
            email,
            password,
            rol: assignedRol
        });

        // Generar token JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return sendSuccess(res, { user, token }, 'Usuario registrado exitosamente', 201);
    } catch (error) {
        console.error('Error en registro:', error);
        return sendError(res, 'Error al registrar usuario', 500);
    }
};

/**
 * Inicia sesión de usuario
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, ['email', 'password']);
        if (!validation.valid) {
            return sendError(res, `Campos requeridos faltantes: ${validation.missing.join(', ')}`, 400);
        }

        // Buscar usuario por email
        const user = await UsuariosModel.getByEmail(email);
        if (!user) {
            return sendError(res, 'Credenciales inválidas', 401);
        }

        // Verificar que el usuario esté activo
        if (user.estado === 'inactivo') {
            return sendError(res, 'Usuario inactivo. Contacta al administrador.', 403);
        }

        // Verificar contraseña
        const isValidPassword = await UsuariosModel.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return sendError(res, 'Credenciales inválidas', 401);
        }

        // Generar token JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Retornar usuario sin password
        const { password_hash, ...userWithoutPassword } = user;

        return sendSuccess(res, {
            user: userWithoutPassword,
            token
        }, 'Inicio de sesión exitoso');
    } catch (error) {
        console.error('Error en login:', error);
        return sendError(res, 'Error al iniciar sesión', 500);
    }
};

/**
 * Obtiene el perfil del usuario autenticado
 * @route GET /api/auth/me
 */
export const me = async (req, res) => {
    try {
        // req.user viene del middleware de autenticación
        const user = await UsuariosModel.getById(req.user.id);

        if (!user) {
            return sendError(res, 'Usuario no encontrado', 404);
        }

        return sendSuccess(res, { user }, 'Perfil obtenido');
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        return sendError(res, 'Error al obtener perfil', 500);
    }
};

/**
 * Actualiza la contraseña del usuario autenticado
 * @route PUT /api/auth/password
 */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validar campos
        const validation = validateRequired(req.body, ['currentPassword', 'newPassword']);
        if (!validation.valid) {
            return sendError(res, `Campos requeridos faltantes: ${validation.missing.join(', ')}`, 400);
        }

        if (newPassword.length < 6) {
            return sendError(res, 'La nueva contraseña debe tener al menos 6 caracteres', 400);
        }

        // Obtener usuario con password
        const user = await UsuariosModel.getByEmail(req.user.email);

        // Verificar contraseña actual
        const isValid = await UsuariosModel.verifyPassword(currentPassword, user.password_hash);
        if (!isValid) {
            return sendError(res, 'Contraseña actual incorrecta', 401);
        }

        // Actualizar contraseña
        await UsuariosModel.updatePassword(req.user.id, newPassword);

        return sendSuccess(res, null, 'Contraseña actualizada exitosamente');
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        return sendError(res, 'Error al cambiar contraseña', 500);
    }
};
