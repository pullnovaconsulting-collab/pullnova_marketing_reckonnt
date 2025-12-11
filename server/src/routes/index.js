/**
 * @fileoverview Índice de Rutas API
 * @description Agrupa y exporta todas las rutas del sistema
 * @module routes/index
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import campanasRoutes from './campanas.routes.js';
import contenidoRoutes from './contenido.routes.js';
import iaRoutes from './ia.routes.js';
import socialRoutes from './social.routes.js';

const router = Router();

/**
 * Montar rutas en sus respectivos prefijos
 */

// Autenticación - /api/auth/*
router.use('/auth', authRoutes);

// Usuarios - /api/usuarios/*
router.use('/usuarios', usuariosRoutes);

// Campañas - /api/campanas/*
router.use('/campanas', campanasRoutes);

// Contenido - /api/contenido/*
router.use('/contenido', contenidoRoutes);

// IA / Generación - /api/ia/*
router.use('/ia', iaRoutes);

// Redes Sociales - /api/social/*
router.use('/social', socialRoutes);

/**
 * Información de la API
 * @route GET /api
 */
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'PULLNOVA Marketing API v2.0',
        endpoints: {
            auth: '/api/auth',
            usuarios: '/api/usuarios',
            campanas: '/api/campanas',
            contenido: '/api/contenido',
            ia: '/api/ia',
            social: '/api/social'
        },
        documentation: 'Ver README.md para más información'
    });
});

export default router;


