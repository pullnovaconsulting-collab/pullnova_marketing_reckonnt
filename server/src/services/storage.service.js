/**
 * @fileoverview Servicio de Almacenamiento (Cloudflare R2)
 * @description Maneja la subida de archivos a R2
 * @module services/storage
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Configuración de R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Opcional: URL pública personalizada

let s3Client = null;

const getClient = () => {
    if (!s3Client && R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
        s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });
    }
    return s3Client;
};

/**
 * Sube un archivo a R2
 * @param {Buffer} buffer - Contenido del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} contentType - Tipo MIME
 * @returns {Promise<string>} URL del archivo subido
 */
export const uploadImage = async (buffer, filename, contentType = 'image/png') => {
    const client = getClient();
    if (!client) {
        throw new Error('R2 no está configurado. Verifica las credenciales en .env');
    }

    try {
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: contentType,
        });

        await client.send(command);

        // Construir URL pública
        if (R2_PUBLIC_URL) {
            return `${R2_PUBLIC_URL}/${filename}`;
        }
        // Fallback a URL de R2 (si el bucket es público)
        return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${filename}`;
    } catch (error) {
        console.error('Error subiendo a R2:', error);
        throw new Error(`Error subiendo imagen: ${error.message}`);
    }
};

/**
 * Descarga una imagen de una URL y la sube a R2
 * @param {string} url - URL de la imagen (ej: OpenAI)
 * @param {string} prefix - Prefijo para el nombre del archivo
 * @returns {Promise<string>} URL de la imagen en R2
 */
export const uploadFromUrl = async (url, prefix = 'ai-generated') => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error descargando imagen: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Generar nombre único
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        const filename = `${prefix}-${timestamp}-${random}.png`;

        return await uploadImage(buffer, filename, 'image/png');
    } catch (error) {
        console.error('Error en uploadFromUrl:', error);
        throw error;
    }
};

/**
 * Verifica la configuración de R2
 */
export const verificarConfiguracion = () => {
    return {
        configurado: !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME),
        bucket: R2_BUCKET_NAME
    };
};
