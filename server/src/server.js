/**
 * @fileoverview Servidor principal de PULLNOVA Marketing
 * @description Inicializa Express, middlewares, rutas y conexión a DB
 * @module server
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool, testConnection, getTables } from './config/db.js';
import apiRoutes from './routes/index.js';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============== MIDDLEWARES ==============

// CORS - permitir peticiones desde el frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Parser de JSON
app.use(express.json());

// Parser de URL encoded
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del cliente (build de React)
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// ============== RUTAS API ==============

// Montar todas las rutas bajo /api
app.use('/api', apiRoutes);

// ============== ENDPOINTS LEGACY (compatibilidad) ==============

/**
 * Health check básico - verificar conexión a la base de datos
 * @route GET /api/health
 */
app.get('/api/health', async (req, res) => {
    try {
        const tables = await getTables();
        const tableNames = tables.map(t => Object.values(t)[0]);
        res.json({
            status: 'ok',
            message: 'Conexión a la base de datos exitosa',
            database: process.env.MYSQL_DATABASE || 'railway',
            tables: tableNames,
            version: '1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error conectando a la base de datos',
            error: error.message
        });
    }
});

/**
 * Estadísticas generales de la base de datos
 * @route GET /api/stats
 */
app.get('/api/stats', async (req, res) => {
    try {
        const [usuarios] = await pool.query('SELECT COUNT(*) as count FROM usuarios').catch(() => [[{ count: 0 }]]);
        const [campanas] = await pool.query('SELECT COUNT(*) as count FROM campanas').catch(() => [[{ count: 0 }]]);
        const [contenido] = await pool.query('SELECT COUNT(*) as count FROM contenido').catch(() => [[{ count: 0 }]]);

        res.json({
            status: 'ok',
            stats: {
                usuarios: usuarios[0]?.count || 0,
                campanas: campanas[0]?.count || 0,
                contenido: contenido[0]?.count || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error obteniendo estadísticas',
            error: error.message
        });
    }
});

// ============== ERROR HANDLING ==============

/**
 * Middleware de manejo de errores global
 */
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);

    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ============== CATCH-ALL PARA SPA ==============

/**
 * Servir React para cualquier otra ruta (SPA)
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ============== INICIAR SERVIDOR ==============

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║       🚀 PULLNOVA Marketing Server                 ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║  Puerto: ${PORT}                                        ║`);
    console.log(`║  Entorno: ${process.env.NODE_ENV || 'development'}                          ║`);
    console.log('╚════════════════════════════════════════════════════╝');

    // Probar conexión a la base de datos
    const connected = await testConnection();
    if (connected) {
        console.log('✅ Base de datos conectada');
    } else {
        console.log('⚠️  Base de datos no disponible');
    }
});

export default app;
