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
import promptsRoutes from './prompts.routes.js';
import configMarcaRoutes from './configMarca.routes.js';
import publicacionesRoutes from './publicaciones.routes.js';
import metricasRoutes from './metricas.routes.js';

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

// IA / Generación (Gemini, OpenAI, DALL-E) - /api/ia/*
router.use('/ia', iaRoutes);

// Redes Sociales - /api/social/*
router.use('/social', socialRoutes);

// Prompts / Plantillas IA - /api/prompts/*
router.use('/prompts', promptsRoutes);

// Configuración de Marca - /api/config-marca/*
router.use('/config-marca', configMarcaRoutes);

// Publicaciones Programadas - /api/publicaciones/*
router.use('/publicaciones', publicacionesRoutes);

// Métricas y Analytics - /api/metricas/*
router.use('/metricas', metricasRoutes);

/**
 * Información de la API
 * @route GET /api
 */
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'PULLNOVA Marketing API v2.0',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            usuarios: '/api/usuarios',
            campanas: '/api/campanas',
            contenido: '/api/contenido',
            ia: '/api/ia',
            social: '/api/social',
            prompts: '/api/prompts',
            config_marca: '/api/config-marca',
            publicaciones: '/api/publicaciones',
            metricas: '/api/metricas'
        },
        servicios_ia: {
            texto: ['Gemini', 'GPT-4'],
            imagenes: ['DALL-E 3']
        },
        redes_sociales: ['Facebook', 'Instagram', 'LinkedIn'],
        documentation: 'Ver README.md para más información'
    });
});

export default router;
