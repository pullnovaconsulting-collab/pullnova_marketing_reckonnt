/**
 * @fileoverview Worker de Publicación Automática
 * @description Cron job que revisa y publica contenido programado
 * @module workers/scheduler
 */

import * as PublicacionesModel from '../models/publicaciones.model.js';
import * as ContenidoModel from '../models/contenido.model.js';
import * as MetricasModel from '../models/metricas.model.js';
import * as MetaService from '../services/meta.service.js';
import * as LinkedInService from '../services/linkedin.service.js';

// Intervalo de revisión en milisegundos (por defecto 5 minutos)
const INTERVALO_REVISION = parseInt(process.env.SCHEDULER_INTERVAL) || 5 * 60 * 1000;

// Estado del worker
let isRunning = false;
let intervalId = null;

/**
 * Ejecuta el ciclo de publicación
 * Revisa publicaciones pendientes y las publica si es hora
 */
export const ejecutarCiclo = async () => {
    if (isRunning) {
        console.log('[Scheduler] Ya hay un ciclo en ejecución, saltando...');
        return;
    }

    isRunning = true;
    const inicio = Date.now();
    let itemsProcesados = 0;

    try {
        console.log('[Scheduler] Iniciando ciclo de publicación...');

        // Registrar inicio
        await MetricasModel.logWorker({
            worker_name: 'scheduler',
            tipo: 'scheduler',
            estado: 'iniciado',
            mensaje: 'Iniciando revisión de publicaciones programadas'
        });

        // Obtener publicaciones pendientes listas para publicar
        const pendientes = await PublicacionesModel.getPendientesParaPublicar();
        console.log(`[Scheduler] ${pendientes.length} publicación(es) listas para publicar`);

        for (const publicacion of pendientes) {
            try {
                console.log(`[Scheduler] Procesando publicación ID ${publicacion.id}...`);

                // Publicar según la plataforma
                const resultado = await publicarEnPlataforma(publicacion);

                if (resultado.success) {
                    // Actualizar estado a enviado
                    await PublicacionesModel.updateEstado(publicacion.id, 'enviado', {
                        response_api: resultado,
                        external_post_id: resultado.post_id || null
                    });

                    // Actualizar estado del contenido a publicado
                    await ContenidoModel.updateEstado(publicacion.contenido_id, 'publicado');

                    console.log(`[Scheduler] ✅ Publicación ${publicacion.id} enviada exitosamente`);
                } else {
                    // Marcar como fallida
                    await PublicacionesModel.updateEstado(publicacion.id, 'fallido', {
                        response_api: resultado
                    });

                    console.log(`[Scheduler] ❌ Publicación ${publicacion.id} falló: ${resultado.error}`);
                }

                itemsProcesados++;
            } catch (error) {
                console.error(`[Scheduler] Error procesando publicación ${publicacion.id}:`, error);

                await PublicacionesModel.updateEstado(publicacion.id, 'fallido', {
                    response_api: { error: error.message }
                });
            }
        }

        const tiempoEjecucion = Date.now() - inicio;

        // Registrar finalización
        await MetricasModel.logWorker({
            worker_name: 'scheduler',
            tipo: 'scheduler',
            estado: 'completado',
            mensaje: `Procesadas ${itemsProcesados} publicaciones`,
            items_procesados: itemsProcesados,
            tiempo_ejecucion_ms: tiempoEjecucion
        });

        console.log(`[Scheduler] Ciclo completado en ${tiempoEjecucion}ms. Procesadas: ${itemsProcesados}`);

    } catch (error) {
        console.error('[Scheduler] Error en ciclo de publicación:', error);

        await MetricasModel.logWorker({
            worker_name: 'scheduler',
            tipo: 'scheduler',
            estado: 'error',
            mensaje: error.message
        });
    } finally {
        isRunning = false;
    }
};

/**
 * Publica contenido en la plataforma correspondiente
 * @param {Object} publicacion - Datos de la publicación
 * @returns {Promise<Object>} Resultado de la publicación
 */
const publicarEnPlataforma = async (publicacion) => {
    const { cuenta_plataforma, access_token, page_id, copy_texto, contenido_texto, titulo } = publicacion;

    // Preparar el contenido
    const texto = copy_texto || contenido_texto || titulo;

    if (!texto) {
        return { success: false, error: 'No hay contenido de texto para publicar' };
    }

    if (!access_token) {
        return { success: false, error: 'Token de acceso no disponible' };
    }

    switch (cuenta_plataforma) {
        case 'facebook':
            return await MetaService.publishToFacebook(page_id, access_token, { message: texto });

        case 'instagram':
            // Instagram requiere imagen, por ahora publicamos solo si hay imagen
            // TODO: Obtener imagen asociada al contenido
            return await MetaService.publishToInstagram(page_id, access_token, {
                caption: texto,
                // image_url: se necesita implementar
            });

        case 'linkedin':
            // LinkedIn usa el URN del usuario
            const personUrn = `urn:li:person:${page_id}`;
            return await LinkedInService.publishPost(access_token, personUrn, { text: texto });

        default:
            return { success: false, error: `Plataforma no soportada: ${cuenta_plataforma}` };
    }
};

/**
 * Inicia el worker de publicación automática
 */
export const iniciar = () => {
    if (intervalId) {
        console.log('[Scheduler] Worker ya está corriendo');
        return;
    }

    console.log(`[Scheduler] Iniciando worker con intervalo de ${INTERVALO_REVISION / 1000} segundos`);

    // Ejecutar inmediatamente al iniciar
    ejecutarCiclo();

    // Programar ejecuciones periódicas
    intervalId = setInterval(ejecutarCiclo, INTERVALO_REVISION);

    console.log('[Scheduler] Worker iniciado correctamente');
};

/**
 * Detiene el worker de publicación automática
 */
export const detener = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[Scheduler] Worker detenido');
    }
};

/**
 * Obtiene el estado del worker
 * @returns {Object} Estado del worker
 */
export const getEstado = () => {
    return {
        ejecutando: isRunning,
        activo: intervalId !== null,
        intervalo_ms: INTERVALO_REVISION,
        intervalo_minutos: INTERVALO_REVISION / 60000
    };
};

/**
 * Ejecuta un ciclo manualmente (para testing)
 */
export const ejecutarManual = async () => {
    console.log('[Scheduler] Ejecución manual iniciada');
    await ejecutarCiclo();
    return { success: true, mensaje: 'Ciclo ejecutado manualmente' };
};
