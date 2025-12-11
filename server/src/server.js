import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool, testConnection, getTables } from './config/db.js';
import { generarImagen, generarTexto } from './crear-imagen.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del cliente (build de React)
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// ============== API ROUTES ==============

// Health check - verificar conexión a la base de datos
app.get('/api/health', async (req, res) => {
    try {
        const tables = await getTables();
        const tableNames = tables.map(t => Object.values(t)[0]);
        res.json({
            status: 'ok',
            message: 'Conexión a la base de datos exitosa',
            database: process.env.MYSQL_DATABASE || 'railway',
            tables: tableNames
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error conectando a la base de datos',
            error: error.message
        });
    }
});

// Estadísticas generales de la base de datos
app.get('/api/stats', async (req, res) => {
    try {
        // Obtener conteo de cada tabla
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

// Obtener datos de ejemplo de cada tabla
app.get('/api/data', async (req, res) => {
    try {
        const [usuarios] = await pool.query('SELECT * FROM usuarios LIMIT 5').catch(() => [[]]);
        const [campanas] = await pool.query('SELECT * FROM campanas LIMIT 5').catch(() => [[]]);
        const [contenido] = await pool.query('SELECT * FROM contenido LIMIT 5').catch(() => [[]]);

        res.json({
            status: 'ok',
            data: {
                usuarios,
                campanas,
                contenido
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error obteniendo datos',
            error: error.message
        });
    }
});

// Catch-all: servir React para cualquier otra ruta
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Crear publicación completa (imagen + texto)
app.post('/api/crear-publicacion', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                status: 'error',
                message: 'El prompt es requerido'
            });
        }

        // Imagen estilo Reckont
        const imageUrl = await generarImagen(prompt);

        // Texto para redes sociales
        const texto = await generarTexto(prompt);

        res.json({
            status: 'ok',
            imageUrl,
            texto
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error generando la publicación',
            error: error.message
        });
    }
});


// ============== START SERVER ==============

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Servidor PULLNOVA corriendo en puerto ${PORT}`);
    await testConnection();
});
