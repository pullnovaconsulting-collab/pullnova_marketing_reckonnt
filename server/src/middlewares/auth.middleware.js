/**
 * @fileoverview Middleware de autenticación JWT
 * @description Verifica tokens JWT y adjunta el usuario al request
 * @module middlewares/auth
 */

import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

/**
 * Middleware para verificar el token JWT
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export const verifyToken = async (req, res, next) => {
    try {
        // Obtener el token del header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Token no proporcionado. Formato: Bearer <token>'
            });
        }

        // Extraer el token
        const token = authHeader.split(' ')[1];

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar el usuario en la base de datos
        const [users] = await pool.query(
            'SELECT id, nombre, email, rol, estado FROM usuarios WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];

        // Verificar que el usuario esté activo
        if (user.estado === 'inactivo') {
            return res.status(403).json({
                status: 'error',
                message: 'Usuario inactivo. Contacta al administrador.'
            });
        }

        // Adjuntar el usuario al request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expirado. Por favor, inicia sesión nuevamente.'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token inválido'
            });
        }

        console.error('Error en autenticación:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error en autenticación'
        });
    }
};

/**
 * Middleware opcional - no falla si no hay token
 * Útil para endpoints que pueden funcionar con o sin autenticación
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [users] = await pool.query(
            'SELECT id, nombre, email, rol, estado FROM usuarios WHERE id = ? AND estado = "activo"',
            [decoded.userId]
        );

        req.user = users.length > 0 ? users[0] : null;
        next();
    } catch (error) {
        // En caso de error, simplemente continuamos sin usuario
        req.user = null;
        next();
    }
};
