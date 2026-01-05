/**
 * @fileoverview Controlador de IA
 * @description Endpoints para generación de contenido con IA (Gemini, OpenAI, DALL-E)
 * @module controllers/ia
 */

import * as GeminiService from '../services/gemini.service.js';
import * as OpenAIService from '../services/openai.service.js';
import * as DalleService from '../services/dalle.service.js';
import * as ContenidoModel from '../models/contenido.model.js';
import * as ConfigMarcaModel from '../models/configMarca.model.js';
import { sendSuccess, sendError, validateRequired } from '../utils/helpers.js';

/**
 * Genera copy para publicaciones
 * @route POST /api/ia/generar-copy
 */
export const generarCopy = async (req, res) => {
    try {
        const { tema, plataforma, objetivo, tono, segmento, variaciones, guardar, campana_id, modelo } = req.body;

        // Validar campos requeridos
        const validation = validateRequired(req.body, ['tema']);
        if (!validation.valid) {
            return sendError(res, `Campo requerido: ${validation.missing.join(', ')}`, 400);
        }

        // Obtener contexto de marca si existe
        let contextoMarca = null;
        try {
            contextoMarca = await ConfigMarcaModel.get();
        } catch (e) {
            // Si no hay config de marca, continuar sin ella
        }

        // Elegir servicio según modelo solicitado
        let resultado;
        const usarOpenAI = modelo === 'openai' || modelo === 'gpt-4';

        if (usarOpenAI) {
            const config = OpenAIService.verificarConfiguracion();
            if (!config.configurado) {
                return sendError(res, 'API de OpenAI no configurada. Verifica OPENAI_API_KEY en .env', 500);
            }

            resultado = await OpenAIService.generarCopy({
                tema,
                plataforma: plataforma || 'instagram',
                objetivo: objetivo || 'educar',
                tono: tono || contextoMarca?.tono_voz || 'profesional',
                segmento: segmento || contextoMarca?.segmento_principal || 'PyMEs',
                variaciones: parseInt(variaciones) || 1,
                contextoMarca
            });
        } else {
            const config = GeminiService.verificarConfiguracion();
            if (!config.configurado) {
                return sendError(res, 'API de Gemini no configurada. Verifica GEMINI_API_KEY en .env', 500);
            }

            resultado = await GeminiService.generarCopy({
                tema,
                plataforma: plataforma || 'instagram',
                objetivo: objetivo || 'educar',
                tono: tono || contextoMarca?.tono_voz || 'profesional',
                segmento: segmento || contextoMarca?.segmento_principal || 'PyMEs',
                variaciones: parseInt(variaciones) || 1,
                contextoMarca
            });
        }

        if (!resultado.success) {
            return sendError(res, `Error generando contenido: ${resultado.error}`, 500);
        }

        // Si se debe guardar como borrador
        let contenidoGuardado = null;
        if (guardar) {
            contenidoGuardado = await ContenidoModel.create({
                campana_id: campana_id || null,
                titulo: `IA: ${tema.substring(0, 50)}`,
                contenido: resultado.contenido,
                copy_texto: resultado.contenido,
                tipo: 'post',
                plataforma: plataforma || 'instagram',
                estado: 'pendiente',
                prompt_usado: resultado.prompt_usado,
                modelo_ia: resultado.modelo,
                created_by: req.user.id
            });
        }

        return sendSuccess(res, {
            generacion: resultado,
            contenido_guardado: contenidoGuardado
        }, 'Contenido generado exitosamente');
    } catch (error) {
        console.error('Error en generarCopy:', error);
        return sendError(res, 'Error generando copy', 500);
    }
};

/**
 * Genera ideas para calendario editorial
 * @route POST /api/ia/generar-ideas
 */
export const generarIdeas = async (req, res) => {
    try {
        const { tema, cantidad, plataformas, periodo, modelo } = req.body;

        const validation = validateRequired(req.body, ['tema']);
        if (!validation.valid) {
            return sendError(res, `Campo requerido: tema`, 400);
        }

        let resultado;
        const usarOpenAI = modelo === 'openai' || modelo === 'gpt-4';

        if (usarOpenAI && OpenAIService.verificarConfiguracion().configurado) {
            resultado = await OpenAIService.generarIdeas({
                tema,
                cantidad: parseInt(cantidad) || 5,
                plataformas: plataformas || ['instagram', 'facebook', 'linkedin'],
                periodo: periodo || 'semana'
            });
        } else {
            const config = GeminiService.verificarConfiguracion();
            if (!config.configurado) {
                return sendError(res, 'API de IA no configurada', 500);
            }

            resultado = await GeminiService.generarIdeas({
                tema,
                cantidad: parseInt(cantidad) || 5,
                plataformas: plataformas || ['instagram', 'facebook', 'linkedin'],
                periodo: periodo || 'semana'
            });
        }

        if (!resultado.success) {
            return sendError(res, `Error generando ideas: ${resultado.error}`, 500);
        }

        return sendSuccess(res, resultado, 'Ideas generadas exitosamente');
    } catch (error) {
        console.error('Error en generarIdeas:', error);
        return sendError(res, 'Error generando ideas', 500);
    }
};

/**
 * Mejora un texto existente
 * @route POST /api/ia/mejorar-texto
 */
export const mejorarTexto = async (req, res) => {
    try {
        const { texto, instruccion, modelo } = req.body;

        const validation = validateRequired(req.body, ['texto']);
        if (!validation.valid) {
            return sendError(res, 'Campo requerido: texto', 400);
        }

        let resultado;
        const usarOpenAI = modelo === 'openai' || modelo === 'gpt-4';

        if (usarOpenAI && OpenAIService.verificarConfiguracion().configurado) {
            resultado = await OpenAIService.mejorarTexto(
                texto,
                instruccion || 'mejorar para redes sociales'
            );
        } else {
            const config = GeminiService.verificarConfiguracion();
            if (!config.configurado) {
                return sendError(res, 'API de IA no configurada', 500);
            }

            resultado = await GeminiService.mejorarTexto(
                texto,
                instruccion || 'mejorar para redes sociales'
            );
        }

        if (!resultado.success) {
            return sendError(res, `Error mejorando texto: ${resultado.error}`, 500);
        }

        return sendSuccess(res, resultado, 'Texto mejorado exitosamente');
    } catch (error) {
        console.error('Error en mejorarTexto:', error);
        return sendError(res, 'Error mejorando texto', 500);
    }
};

/**
 * Genera prompt para imagen (sin generar la imagen)
 * @route POST /api/ia/generar-prompt-imagen
 */
export const generarPromptImagen = async (req, res) => {
    try {
        const { descripcion, estilo, colores, tipo } = req.body;

        const validation = validateRequired(req.body, ['descripcion']);
        if (!validation.valid) {
            return sendError(res, 'Campo requerido: descripcion', 400);
        }

        let resultado;

        if (OpenAIService.verificarConfiguracion().configurado) {
            resultado = await DalleService.generarPromptDesdeContenido({
                copy: descripcion,
                estilo: estilo || 'moderno y profesional',
                colores: colores || 'azules y blancos corporativos'
            });
        } else if (GeminiService.verificarConfiguracion().configurado) {
            resultado = await GeminiService.generarPromptImagen({
                descripcion,
                estilo: estilo || 'moderno y profesional',
                colores: colores || 'azules y blancos corporativos',
                tipo: tipo || 'ilustración'
            });
        } else {
            return sendError(res, 'Ninguna API de IA está configurada', 500);
        }

        if (!resultado.success) {
            return sendError(res, `Error generando prompt: ${resultado.error}`, 500);
        }

        return sendSuccess(res, resultado, 'Prompt de imagen generado');
    } catch (error) {
        console.error('Error en generarPromptImagen:', error);
        return sendError(res, 'Error generando prompt de imagen', 500);
    }
};

/**
 * Genera una imagen con DALL-E (sin subir a R2 automáticamente)
 * @route POST /api/ia/generar-imagen
 */
export const generarImagen = async (req, res) => {
    try {
        const { prompt, contenido_id, size, quality, style } = req.body;

        const validation = validateRequired(req.body, ['prompt']);
        if (!validation.valid) {
            return sendError(res, 'Campo requerido: prompt', 400);
        }

        const config = DalleService.verificarConfiguracion();
        if (!config.configurado) {
            return sendError(res, 'API de OpenAI/DALL-E no configurada. Verifica OPENAI_API_KEY en .env', 500);
        }

        let resultado;
        if (contenido_id) {
            // Si hay contenido_id, usar el flujo antiguo (generar y guardar)
            resultado = await DalleService.generarYGuardarImagen({
                contenido_id: parseInt(contenido_id),
                prompt,
                size: size || '1024x1024',
                quality: quality || 'standard',
                style: style || 'vivid'
            });
        } else {
            // Sin contenido_id, generar solo para preview (no subir a R2)
            resultado = await DalleService.generarImagenSinSubir({
                prompt,
                size: size || '1024x1024',
                quality: quality || 'standard',
                style: style || 'vivid'
            });
        }

        if (!resultado.success) {
            return sendError(res, `Error generando imagen: ${resultado.error}`, 500);
        }

        return sendSuccess(res, resultado, 'Imagen generada exitosamente');
    } catch (error) {
        console.error('Error en generarImagen:', error);
        return sendError(res, 'Error generando imagen', 500);
    }
};

/**
 * Confirma una imagen y la sube a R2
 * @route POST /api/ia/confirmar-imagen
 */
export const confirmarImagen = async (req, res) => {
    try {
        const { url_temporal, prompt } = req.body;

        const validation = validateRequired(req.body, ['url_temporal']);
        if (!validation.valid) {
            return sendError(res, 'Campo requerido: url_temporal', 400);
        }

        const resultado = await DalleService.confirmarYSubirImagen({
            url_temporal,
            prompt: prompt || 'Imagen confirmada'
        });

        if (!resultado.success) {
            return sendError(res, `Error confirmando imagen: ${resultado.error}`, 500);
        }

        return sendSuccess(res, resultado, 'Imagen confirmada y subida a R2');
    } catch (error) {
        console.error('Error en confirmarImagen:', error);
        return sendError(res, 'Error confirmando imagen', 500);
    }
};

/**
 * Sube una imagen procesada (desde el editor) a R2
 * @route POST /api/ia/upload-processed-image
 */
export const uploadProcessedImage = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'No se ha subido ninguna imagen', 400);
        }

        const buffer = req.file.buffer;
        const filename = `processed-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
        
        // Subir a R2 usando el servicio de storage existente
        // Importamos dinámicamente o usamos el servicio ya importado si tiene el método
        // En este archivo ya importamos StorageService en otros controladores?
        // No, pero DalleService usa StorageService. 
        // Vamos a importar StorageService directamente aquí también.
        
        // Nota: Necesitamos importar StorageService al inicio del archivo si no está
        const r2Url = await import('../services/storage.service.js').then(m => 
            m.uploadImage(buffer, filename, req.file.mimetype)
        );

        return sendSuccess(res, {
            url_imagen: r2Url,
            filename: filename
        }, 'Imagen procesada subida exitosamente');
    } catch (error) {
        console.error('Error en uploadProcessedImage:', error);
        return sendError(res, 'Error subiendo imagen procesada', 500);
    }
};

/**
 * Genera variaciones de imagen
 * @route POST /api/ia/generar-variaciones-imagen
 */
export const generarVariacionesImagen = async (req, res) => {
    try {
        const { prompt, variaciones, size } = req.body;

        const validation = validateRequired(req.body, ['prompt']);
        if (!validation.valid) {
            return sendError(res, 'Campo requerido: prompt', 400);
        }

        const config = DalleService.verificarConfiguracion();
        if (!config.configurado) {
            return sendError(res, 'API de DALL-E no configurada', 500);
        }

        const resultado = await DalleService.generarVariaciones({
            prompt,
            variaciones: parseInt(variaciones) || 2,
            size: size || '1024x1024'
        });

        if (!resultado.success) {
            return sendError(res, `Error generando variaciones: ${resultado.error}`, 500);
        }

        return sendSuccess(res, resultado, 'Variaciones generadas exitosamente');
    } catch (error) {
        console.error('Error en generarVariacionesImagen:', error);
        return sendError(res, 'Error generando variaciones', 500);
    }
};

/**
 * Obtiene imágenes de un contenido
 * @route GET /api/ia/imagenes/:contenidoId
 */
export const getImagenesPorContenido = async (req, res) => {
    try {
        const { contenidoId } = req.params;
        const imagenes = await DalleService.getImagenesPorContenido(parseInt(contenidoId));

        return sendSuccess(res, {
            imagenes,
            total: imagenes.length
        });
    } catch (error) {
        console.error('Error obteniendo imágenes:', error);
        return sendError(res, 'Error al obtener imágenes', 500);
    }
};

/**
 * Elimina una imagen
 * @route DELETE /api/ia/imagenes/:id
 */
export const eliminarImagen = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminada = await DalleService.eliminarImagen(parseInt(id));

        if (!eliminada) {
            return sendError(res, 'Imagen no encontrada', 404);
        }

        return sendSuccess(res, null, 'Imagen eliminada');
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        return sendError(res, 'Error al eliminar imagen', 500);
    }
};

/**
 * Verifica estado de la configuración de IA
 * @route GET /api/ia/status
 */
export const getStatus = async (req, res) => {
    try {
        const gemini = GeminiService.verificarConfiguracion();
        const openai = OpenAIService.verificarConfiguracion();
        const dalle = DalleService.verificarConfiguracion();

        return sendSuccess(res, {
            gemini,
            openai,
            dalle,
            servicios_disponibles: [
                'generar-copy',
                'generar-ideas',
                'mejorar-texto',
                'generar-prompt-imagen',
                'generar-imagen',
                'generar-variaciones-imagen'
            ],
            modelos_texto: gemini.configurado || openai.configurado
                ? (openai.configurado ? ['gemini', 'gpt-4'] : ['gemini'])
                : [],
            modelo_imagen: dalle.configurado ? 'dall-e-3' : null
        }, 'Estado de servicios IA');
    } catch (error) {
        return sendError(res, 'Error verificando estado', 500);
    }
};

/**
 * Proxy para imágenes (para evitar CORS)
 * @route GET /api/ia/proxy-image
 */
export const proxyImage = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('URL requerida');
        }

        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).send('Error fetching image');
        }

        // Copiar headers relevantes
        res.setHeader('Content-Type', response.headers.get('content-type'));
        res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir CORS

        // Pipe del stream
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.send(buffer);

    } catch (error) {
        console.error('Error en proxyImage:', error);
        res.status(500).send('Error proxying image');
    }
};
