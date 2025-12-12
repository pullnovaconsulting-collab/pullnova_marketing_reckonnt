/**
 * @fileoverview Servicio de OpenAI
 * @description Integración con OpenAI GPT-4 para generación de texto
 * @module services/openai
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

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
 * Genera copy para publicaciones de marketing usando GPT-4
 * @param {Object} options - Opciones de generación
 * @param {string} options.tema - Tema del post
 * @param {string} options.plataforma - Plataforma destino (instagram, facebook, linkedin)
 * @param {string} options.objetivo - Objetivo del post (educar, promocionar, convertir)
 * @param {string} options.tono - Tono de voz
 * @param {string} options.segmento - Segmento de audiencia
 * @param {number} options.variaciones - Número de variaciones a generar
 * @param {Object} options.contextoMarca - Contexto de la marca
 * @returns {Promise<Object>} Contenido generado
 */
export const generarCopy = async ({
    tema,
    plataforma = 'instagram',
    objetivo = 'educar',
    tono = 'profesional',
    segmento = 'PyMEs',
    variaciones = 1,
    contextoMarca = null
}) => {
    try {
        // Construir el prompt
        const prompt = construirPromptCopy({
            tema,
            plataforma,
            objetivo,
            tono,
            segmento,
            variaciones,
            contextoMarca
        });

        // Verificar cliente
        const client = getClient();
        if (!client) {
            return { success: false, error: 'OpenAI API no configurada' };
        }

        // Llamar a GPT-4
        const completion = await client.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto en marketing digital y copywriting para redes sociales. Generas contenido atractivo, profesional y optimizado para engagement.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 1500
        });

        const contenido = completion.choices[0].message.content;

        return {
            success: true,
            contenido,
            modelo: 'gpt-4-turbo-preview',
            prompt_usado: prompt,
            tokens_usados: completion.usage?.total_tokens || 0
        };
    } catch (error) {
        console.error('Error en OpenAI generarCopy:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Genera ideas de contenido para un calendario editorial
 * @param {Object} options - Opciones de generación
 * @returns {Promise<Object>} Ideas generadas
 */
export const generarIdeas = async ({
    tema,
    cantidad = 5,
    plataformas = ['instagram', 'facebook', 'linkedin'],
    periodo = 'semana'
}) => {
    try {
        const prompt = `Genera ${cantidad} ideas de contenido para redes sociales sobre "${tema}".

Para cada idea incluye:
1. Título atractivo
2. Descripción breve (2-3 oraciones)
3. Plataforma recomendada: ${plataformas.join(', ')}
4. Tipo de contenido (post, carrusel, video, story)
5. Mejor día/momento para publicar

Periodo de publicación: ${periodo}
Formato: JSON array con objetos { titulo, descripcion, plataforma, tipo, momento }`;

        const client = getClient();
        if (!client) {
            return { success: false, error: 'OpenAI API no configurada' };
        }

        const completion = await client.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un estratega de contenido digital. Respondes siempre en formato JSON válido.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.9,
            max_tokens: 2000
        });

        const contenido = completion.choices[0].message.content;

        // Intentar parsear como JSON
        let ideas = [];
        try {
            // Extraer JSON del contenido
            const jsonMatch = contenido.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                ideas = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            // Si no se puede parsear, devolver como texto
            ideas = contenido;
        }

        return {
            success: true,
            ideas,
            contenido_raw: contenido,
            modelo: 'gpt-4-turbo-preview'
        };
    } catch (error) {
        console.error('Error en OpenAI generarIdeas:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Mejora o reescribe un texto existente
 * @param {string} textoOriginal - Texto a mejorar
 * @param {string} instruccion - Tipo de mejora a aplicar
 * @returns {Promise<Object>} Texto mejorado
 */
export const mejorarTexto = async (textoOriginal, instruccion = 'mejorar') => {
    try {
        const prompt = `Mejora el siguiente texto para redes sociales.

Instrucción: ${instruccion}

Texto original:
${textoOriginal}

Proporciona:
1. Versión mejorada del texto
2. Breve explicación de los cambios realizados`;

        const client = getClient();
        if (!client) {
            return { success: false, error: 'OpenAI API no configurada' };
        }

        const completion = await client.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un editor experto en copywriting para redes sociales.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        return {
            success: true,
            texto_mejorado: completion.choices[0].message.content,
            texto_original: textoOriginal,
            modelo: 'gpt-4-turbo-preview'
        };
    } catch (error) {
        console.error('Error en OpenAI mejorarTexto:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// ================== FUNCIONES AUXILIARES ==================

/**
 * Construye un prompt optimizado para generación de copy
 * @private
 */
const construirPromptCopy = ({
    tema,
    plataforma,
    objetivo,
    tono,
    segmento,
    variaciones,
    contextoMarca
}) => {
    let prompt = `Genera ${variaciones} versión(es) de un post para ${plataforma} sobre: "${tema}"

REQUISITOS:
- Objetivo: ${objetivo}
- Tono: ${tono}
- Audiencia: ${segmento}
`;

    // Agregar contexto de marca si existe
    if (contextoMarca) {
        prompt += `
CONTEXTO DE LA MARCA:
- Nombre: ${contextoMarca.nombre_marca || 'RECKONNT'}
- Tono de voz: ${contextoMarca.tono_voz || tono}
- Pilares de comunicación: ${contextoMarca.pilares_comunicacion || 'Profesionalismo, cercanía, expertise'}
`;
    }

    // Agregar especificaciones por plataforma
    const especificaciones = {
        instagram: `
FORMATO INSTAGRAM:
- Máximo 2200 caracteres
- Incluir 5-10 hashtags relevantes
- Usar emojis estratégicamente
- Call-to-action claro`,
        facebook: `
FORMATO FACEBOOK:
- Texto conversacional
- Máximo 500 caracteres idealmente
- Incluir pregunta para engagement
- CTA al final`,
        linkedin: `
FORMATO LINKEDIN:
- Tono profesional pero cercano
- Estructura con saltos de línea
- Incluir insights o datos
- CTA profesional`
    };

    prompt += especificaciones[plataforma] || especificaciones.instagram;

    if (variaciones > 1) {
        prompt += `\n\nGenera ${variaciones} versiones diferentes, separadas por "---"`;
    }

    return prompt;
};

/**
 * Verifica si la API key de OpenAI está configurada
 * @returns {Object} Estado de la configuración
 */
export const verificarConfiguracion = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    return {
        configurado: !!apiKey && apiKey.startsWith('sk-'),
        servicio: 'OpenAI GPT-4',
        funcionalidades: ['generarCopy', 'generarIdeas', 'mejorarTexto']
    };
};
