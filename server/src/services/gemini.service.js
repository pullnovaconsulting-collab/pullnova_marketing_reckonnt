/**
 * @fileoverview Servicio de Gemini AI
 * @description Integración con Google Gemini para generación de contenido
 * @module services/gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar cliente de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modelo para generación de texto
const textModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });



/**
 * Genera copy para publicaciones de marketing
 * @param {Object} options - Opciones de generación
 * @param {string} options.tema - Tema del post
 * @param {string} options.plataforma - Plataforma destino (instagram, facebook, linkedin)
 * @param {string} options.objetivo - Objetivo del post (educar, promocionar, convertir)
 * @param {string} options.tono - Tono de voz (profesional, casual, etc.)
 * @param {string} options.segmento - Segmento de audiencia
 * @param {number} options.variaciones - Número de variaciones a generar
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
        // Construir prompt optimizado para marketing
        const prompt = construirPromptCopy({
            tema,
            plataforma,
            objetivo,
            tono,
            segmento,
            variaciones,
            contextoMarca
        });

        // Generar contenido con Gemini
        const result = await textModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            contenido: text,
            prompt_usado: prompt,
            modelo: 'gemini-1.5-flash',
            metadata: {
                tema,
                plataforma,
                objetivo,
                tono,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Error generando copy con Gemini:', error);
        return {
            success: false,
            error: error.message,
            prompt_usado: null
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
        const prompt = `
Eres un experto en marketing digital para empresas de servicios contables y tecnología empresarial.

Genera ${cantidad} ideas de contenido para redes sociales sobre "${tema}" para publicar durante una ${periodo}.

Para cada idea incluye:
1. **Título**: Un título atractivo
2. **Tipo**: (post, carrusel, video corto, infografía)
3. **Plataforma recomendada**: (${plataformas.join(', ')})
4. **Gancho**: Primera línea que capture atención
5. **Puntos clave**: 3-4 puntos a cubrir
6. **CTA sugerido**: Llamada a la acción

Audiencia: PyMEs ecuatorianas, emprendedores, empresarios.
Tono: Profesional pero accesible, educativo, experto.

Responde en formato estructurado y fácil de leer.
`;

        const result = await textModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            ideas: text,
            prompt_usado: prompt,
            modelo: 'gemini-1.5-flash',
            cantidad_solicitada: cantidad
        };
    } catch (error) {
        console.error('Error generando ideas:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Mejora o reescribe un texto existente
 * @param {string} textoOriginal - Texto a mejorar
 * @param {string} instruccion - Qué tipo de mejora aplicar
 * @returns {Promise<Object>} Texto mejorado
 */
export const mejorarTexto = async (textoOriginal, instruccion = 'mejorar') => {
    try {
        const prompt = `
Eres un experto copywriter de marketing digital.

TEXTO ORIGINAL:
"${textoOriginal}"

INSTRUCCIÓN: ${instruccion}

Por favor, mejora el texto siguiendo la instrucción. Mantén la esencia del mensaje pero hazlo más:
- Atractivo y enganchante
- Profesional pero cercano
- Con llamadas a la acción claras
- Optimizado para redes sociales

Responde SOLO con el texto mejorado, sin explicaciones adicionales.
`;

        const result = await textModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            texto_mejorado: text,
            texto_original: textoOriginal,
            instruccion,
            modelo: 'gemini-1.5-flash'
        };
    } catch (error) {
        console.error('Error mejorando texto:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Genera un prompt para DALL-E o similar basado en el contenido
 * @param {Object} options - Opciones para el prompt de imagen
 * @returns {Promise<Object>} Prompt de imagen generado
 */
export const generarPromptImagen = async ({
    descripcion,
    estilo = 'moderno y profesional',
    colores = 'azules y blancos corporativos',
    tipo = 'ilustración'
}) => {
    try {
        const prompt = `
Eres un experto en prompts para generación de imágenes con IA.

Crea un prompt detallado en inglés para generar una imagen con las siguientes características:

DESCRIPCIÓN: ${descripcion}
ESTILO: ${estilo}
COLORES: ${colores}
TIPO: ${tipo}

El prompt debe ser:
- Específico y detallado
- Optimizado para DALL-E o Midjourney
- Sin texto en la imagen (importante)
- Estilo limpio y corporativo

Responde SOLO con el prompt en inglés, sin explicaciones.
`;

        const result = await textModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            prompt_imagen: text.trim(),
            metadata: {
                descripcion,
                estilo,
                colores,
                tipo
            }
        };
    } catch (error) {
        console.error('Error generando prompt de imagen:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// ================== FUNCIONES AUXILIARES ==================

/**
 * Construye un prompt optimizado para generación de copy
 */
function construirPromptCopy({ tema, plataforma, objetivo, tono, segmento, variaciones, contextoMarca }) {
    const limiteCaracteres = {
        instagram: 2200,
        facebook: 500,
        linkedin: 1300,
        twitter: 280
    };

    const limite = limiteCaracteres[plataforma] || 500;

    let promptBase = `
Eres un experto en marketing digital y copywriting para ${plataforma}.

TAREA: Genera ${variaciones > 1 ? variaciones + ' variaciones de ' : ''}un post sobre "${tema}".

PARÁMETROS:
- Plataforma: ${plataforma}
- Objetivo: ${objetivo}
- Tono: ${tono}
- Audiencia: ${segmento}
- Límite de caracteres: ${limite}
`;

    if (contextoMarca) {
        promptBase += `
CONTEXTO DE MARCA:
- Nombre: ${contextoMarca.nombre || 'RECKONNT'}
- Tono de voz: ${contextoMarca.tono_voz || 'Profesional y cercano'}
- Pilares: ${contextoMarca.pilares || 'Contabilidad, Tecnología, PyMEs'}
`;
    }

    promptBase += `
REQUISITOS:
1. Incluir un gancho atractivo en la primera línea
2. Usar emojis apropiados para ${plataforma}
3. Incluir hashtags relevantes (3-5 para Instagram, 2-3 para LinkedIn)
4. Terminar con un CTA claro
5. Mantener el tono ${tono}

IMPORTANTE: Responde ÚNICAMENTE con el contenido del post. No incluyas explicaciones, introducciones, ni repitas estas instrucciones en tu respuesta.

${variaciones > 1 ? 'Numera cada variación claramente.' : ''}
`;

    return promptBase;
}

/**
 * Verifica si la API key de Gemini está configurada
 */
export const verificarConfiguracion = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    return {
        configurado: !!apiKey && apiKey.length > 10,
        mensaje: apiKey ? 'API Key configurada' : 'API Key no encontrada'
    };
};
