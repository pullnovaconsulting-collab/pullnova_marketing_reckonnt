/**
 * @fileoverview Servicio de DALL-E
 * @description Integración con OpenAI DALL-E para generación de imágenes
 * @module services/dalle
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';
import * as StorageService from './storage.service.js';

dotenv.config();

// Inicializar cliente de OpenAI de forma segura
let openai = null;

const getClient = () => {
    if (!openai && process.env.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    return openai;
};

/**
 * Genera una imagen con DALL-E 3
 * @param {Object} options - Opciones de generación
 * @param {string} options.prompt - Descripción de la imagen a generar
 * @param {string} options.size - Tamaño de la imagen (1024x1024, 1792x1024, 1024x1792)
 * @param {string} options.quality - Calidad (standard, hd)
 * @param {string} options.style - Estilo (vivid, natural)
 * @returns {Promise<Object>} Resultado con URL de la imagen
 */
export const generarImagen = async ({
    prompt,
    size = '1024x1024',
    quality = 'standard',
    style = 'vivid'
}) => {
    try {
        // Validar tamaño
        const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
        if (!validSizes.includes(size)) {
            size = '1024x1024';
        }

        // Verificar cliente
        const client = getClient();
        if (!client) {
            return { success: false, error: 'OpenAI/DALL-E API no configurada' };
        }

        // Generar imagen con DALL-E 3
        const response = await client.images.generate({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: size,
            quality: quality,
            style: style
        });

        const imageUrl = response.data[0].url;
        const revisedPrompt = response.data[0].revised_prompt;

        // Subir a R2 si está configurado
        let finalImageUrl = imageUrl;
        const r2Config = StorageService.verificarConfiguracion();
        
        if (r2Config.configurado) {
            try {
                console.log('Subiendo imagen a R2...');
                finalImageUrl = await StorageService.uploadFromUrl(imageUrl, 'dalle');
                console.log('Imagen subida a R2:', finalImageUrl);
            } catch (uploadError) {
                console.error('Error subiendo a R2 (usando URL original):', uploadError);
                // Continuamos con la URL original si falla la subida
            }
        }

        return {
            success: true,
            url_imagen: finalImageUrl,
            prompt_original: prompt,
            prompt_revisado: revisedPrompt,
            modelo: 'dall-e-3',
            configuracion: { size, quality, style }
        };
    } catch (error) {
        console.error('Error generando imagen con DALL-E:', error);

        // Manejar errores específicos de OpenAI
        if (error.code === 'content_policy_violation') {
            return {
                success: false,
                error: 'El prompt viola las políticas de contenido de OpenAI. Intenta con una descripción diferente.'
            };
        }

        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Genera una imagen y la guarda en la base de datos
 * @param {Object} options - Opciones de generación
 * @param {number} options.contenido_id - ID del contenido asociado
 * @param {string} options.prompt - Descripción de la imagen
 * @param {string} options.size - Tamaño de la imagen
 * @param {string} options.quality - Calidad
 * @param {string} options.style - Estilo
 * @returns {Promise<Object>} Imagen generada y guardada
 */
export const generarYGuardarImagen = async ({
    contenido_id,
    prompt,
    size = '1024x1024',
    quality = 'standard',
    style = 'vivid'
}) => {
    try {
        // Generar la imagen
        const resultado = await generarImagen({ prompt, size, quality, style });

        // Guardar en la base de datos
        // Nota: generarImagen ya se encargó de subir a R2 si estaba configurado
        const [insertResult] = await pool.query(
            `INSERT INTO imagenes (contenido_id, url_imagen, prompt_imagen, modelo_ia) 
             VALUES (?, ?, ?, ?)`,
            [
                contenido_id || null,
                resultado.url_imagen,
                resultado.prompt_revisado || prompt,
                resultado.modelo
            ]
        );

        return {
            success: true,
            imagen: {
                id: insertResult.insertId,
                contenido_id,
                url_imagen: resultado.url_imagen,
                prompt_imagen: resultado.prompt_revisado || prompt,
                modelo_ia: resultado.modelo
            },
            generacion: resultado
        };
    } catch (error) {
        console.error('Error en generarYGuardarImagen:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Genera múltiples variaciones de una imagen
 * @param {Object} options - Opciones de generación
 * @param {string} options.prompt - Prompt base
 * @param {number} options.variaciones - Número de variaciones (máx 4)
 * @param {string} options.size - Tamaño
 * @returns {Promise<Object>} Array de imágenes generadas
 */
export const generarVariaciones = async ({
    prompt,
    variaciones = 2,
    size = '1024x1024'
}) => {
    try {
        // DALL-E 3 solo genera 1 imagen por llamada, hacemos múltiples llamadas
        const maxVariaciones = Math.min(variaciones, 4);
        const resultados = [];

        // Modificadores para variar el prompt
        const modificadores = [
            '',
            'Versión alternativa: ',
            'Variación creativa: ',
            'Interpretación artística: '
        ];

        for (let i = 0; i < maxVariaciones; i++) {
            const promptModificado = modificadores[i] + prompt;
            const resultado = await generarImagen({
                prompt: promptModificado,
                size,
                quality: 'standard',
                style: i % 2 === 0 ? 'vivid' : 'natural' // Alternar estilos
            });

            if (resultado.success) {
                resultados.push(resultado);
            }
        }

        return {
            success: true,
            imagenes: resultados,
            total_generadas: resultados.length,
            total_solicitadas: maxVariaciones
        };
    } catch (error) {
        console.error('Error generando variaciones:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Genera un prompt optimizado para DALL-E basado en el copy del contenido
 * @param {Object} options - Opciones
 * @param {string} options.copy - Texto del copy de marketing
 * @param {string} options.plataforma - Plataforma destino
 * @param {string} options.estilo - Estilo visual deseado
 * @param {string} options.colores - Paleta de colores
 * @returns {Promise<Object>} Prompt optimizado para DALL-E
 */
export const generarPromptDesdeContenido = async ({
    copy,
    plataforma = 'instagram',
    estilo = 'moderno y profesional',
    colores = 'azules y blancos corporativos'
}) => {
    try {
        // Verificar cliente
        const client = getClient();
        if (!client) {
            return { success: false, error: 'OpenAI API no configurada' };
        }

        // Usar GPT-4 para generar un prompt optimizado para DALL-E
        const completion = await client.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: `Eres un experto en generar prompts para DALL-E 3. 
Creas descripciones visuales detalladas que producen imágenes atractivas para marketing en redes sociales.
IMPORTANTE: No incluyas texto ni letras en las imágenes.`
                },
                {
                    role: 'user',
                    content: `Genera un prompt para DALL-E 3 que cree una imagen para acompañar este copy de ${plataforma}:

"${copy}"

Requisitos:
- Estilo visual: ${estilo}
- Colores predominantes: ${colores}
- Sin texto ni letras en la imagen
- Optimizado para ${plataforma}
- Profesional y atractivo

Responde SOLO con el prompt para DALL-E, sin explicaciones adicionales.`
                }
            ],
            temperature: 0.8,
            max_tokens: 500
        });

        const promptGenerado = completion.choices[0].message.content.trim();

        return {
            success: true,
            prompt_imagen: promptGenerado,
            copy_original: copy,
            configuracion: { plataforma, estilo, colores }
        };
    } catch (error) {
        console.error('Error generando prompt desde contenido:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Obtiene las imágenes asociadas a un contenido
 * @param {number} contenidoId - ID del contenido
 * @returns {Promise<Array>} Lista de imágenes
 */
export const getImagenesPorContenido = async (contenidoId) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM imagenes WHERE contenido_id = ? ORDER BY created_at DESC`,
            [contenidoId]
        );
        return rows;
    } catch (error) {
        console.error('Error obteniendo imágenes:', error);
        return [];
    }
};

/**
 * Elimina una imagen de la base de datos
 * @param {number} imagenId - ID de la imagen
 * @returns {Promise<boolean>} True si se eliminó
 */
export const eliminarImagen = async (imagenId) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM imagenes WHERE id = ?',
            [imagenId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        return false;
    }
};

/**
 * Verifica si la API key está configurada para DALL-E
 * @returns {Object} Estado de la configuración
 */
export const verificarConfiguracion = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    return {
        configurado: !!apiKey && apiKey.startsWith('sk-'),
        servicio: 'OpenAI DALL-E 3',
        funcionalidades: [
            'generarImagen',
            'generarYGuardarImagen',
            'generarVariaciones',
            'generarPromptDesdeContenido'
        ],
        tamaños_disponibles: ['1024x1024', '1792x1024', '1024x1792'],
        calidades: ['standard', 'hd'],
        estilos: ['vivid', 'natural']
    };
};
