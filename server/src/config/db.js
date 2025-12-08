import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración para Railway MySQL
const dbConfig = {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

export const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL exitosa');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        return false;
    }
};

// Función para obtener las tablas de la base de datos
export const getTables = async () => {
    try {
        const [rows] = await pool.query('SHOW TABLES');
        return rows;
    } catch (error) {
        console.error('Error obteniendo tablas:', error.message);
        return [];
    }
};
