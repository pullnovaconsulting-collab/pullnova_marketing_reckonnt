/**
 * @fileoverview Controlador de Redes Sociales
 * @description Endpoints para OAuth y publicación en redes
 * @module controllers/social
 */

import * as MetaService from '../services/meta.service.js';
import * as LinkedInService from '../services/linkedin.service.js';
import * as CuentasSocialesModel from '../models/cuentasSociales.model.js';
import * as ContenidoModel from '../models/contenido.model.js';
import { sendSuccess, sendError, validateRequired } from '../utils/helpers.js';
import crypto from 'crypto';

// Almacén temporal de estados OAuth (en producción usar Redis)
const oauthStates = new Map();

/**
 * Obtiene estado de configuración de redes sociales
 * @route GET /api/social/status
 */
export const getStatus = async (req, res) => {
    try {
        const meta = MetaService.verificarConfiguracion();
        const linkedin = LinkedInService.verificarConfiguracion();
        const cuentas = await CuentasSocialesModel.getConectadas();

        return sendSuccess(res, {
            configuracion: { meta, linkedin },
            cuentas_conectadas: cuentas.length,
            cuentas: cuentas.map(c => ({
                id: c.id,
                plataforma: c.plataforma,
                nombre: c.nombre_cuenta,
                expira: c.token_expires_at
            }))
        }, 'Estado de redes sociales');
    } catch (error) {
        return sendError(res, 'Error obteniendo estado', 500);
    }
};

// ==================== META (Facebook/Instagram) ====================

/**
 * Inicia flujo OAuth con Meta
 * @route GET /api/social/meta/auth
 */
export const iniciarAuthMeta = async (req, res) => {
    try {
        const meta = MetaService.verificarConfiguracion();
        if (!meta.configurado) {
            return sendError(res, 'Meta no está configurado. Verifica META_APP_ID y META_APP_SECRET', 400);
        }

        // Generar estado único para prevenir CSRF
        const state = crypto.randomBytes(16).toString('hex');
        oauthStates.set(state, {
            userId: req.user.id,
            timestamp: Date.now(),
            platform: 'meta'
        });

        // Limpiar estados antiguos (más de 10 minutos)
        for (const [key, value] of oauthStates.entries()) {
            if (Date.now() - value.timestamp > 600000) {
                oauthStates.delete(key);
            }
        }

        const redirectUri = `${req.protocol}://${req.get('host')}/api/social/meta/callback`;
        const authUrl = MetaService.getAuthUrl(redirectUri, state);

        return sendSuccess(res, {
            auth_url: authUrl,
            state
        }, 'Redirige al usuario a esta URL');
    } catch (error) {
        console.error('Error iniciando auth Meta:', error);
        return sendError(res, 'Error iniciando autenticación', 500);
    }
};

/**
 * Callback OAuth de Meta
 * @route GET /api/social/meta/callback
 */
export const callbackMeta = async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;

        if (error) {
            return res.redirect(`/social/error?message=${encodeURIComponent(error_description || error)}`);
        }

        // Verificar estado
        const stateData = oauthStates.get(state);
        if (!stateData) {
            return res.redirect('/social/error?message=Estado inválido o expirado');
        }
        oauthStates.delete(state);

        const redirectUri = `${req.protocol}://${req.get('host')}/api/social/meta/callback`;

        // Intercambiar código por token
        const tokenResult = await MetaService.exchangeCodeForToken(code, redirectUri);
        if (!tokenResult.success) {
            return res.redirect(`/social/error?message=${encodeURIComponent(tokenResult.error)}`);
        }

        // Obtener token de larga duración
        const longTokenResult = await MetaService.getLongLivedToken(tokenResult.access_token);
        const finalToken = longTokenResult.success ? longTokenResult.access_token : tokenResult.access_token;
        const expiresIn = longTokenResult.success ? longTokenResult.expires_in : tokenResult.expires_in;

        // Obtener páginas de Facebook
        const pagesResult = await MetaService.getPages(finalToken);

        if (pagesResult.success && pagesResult.pages.length > 0) {
            // Guardar primera página como cuenta conectada
            const page = pagesResult.pages[0];

            await CuentasSocialesModel.create({
                plataforma: 'facebook',
                nombre_cuenta: page.name,
                page_id: page.id,
                access_token: page.access_token,
                token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
                estado: 'conectada'
            });

            // Buscar cuenta de Instagram vinculada
            const igResult = await MetaService.getInstagramAccount(page.id, page.access_token);
            if (igResult.success) {
                await CuentasSocialesModel.create({
                    plataforma: 'instagram',
                    nombre_cuenta: `IG de ${page.name}`,
                    page_id: igResult.instagram_account_id,
                    access_token: page.access_token,
                    token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
                    estado: 'conectada'
                });
            }
        }

        // Redirigir a página de éxito en el frontend
        // Redirigir a página de éxito en el frontend
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientUrl}/?social_success=true&platform=meta`);
    } catch (error) {
        console.error('Error en callback Meta:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientUrl}/?social_error=true&message=Error procesando autenticación`);
    }
};

// ==================== LINKEDIN ====================

/**
 * Inicia flujo OAuth con LinkedIn
 * @route GET /api/social/linkedin/auth
 */
export const iniciarAuthLinkedIn = async (req, res) => {
    try {
        const linkedin = LinkedInService.verificarConfiguracion();
        if (!linkedin.configurado) {
            return sendError(res, 'LinkedIn no está configurado. Verifica LINKEDIN_CLIENT_ID y LINKEDIN_CLIENT_SECRET', 400);
        }

        const state = crypto.randomBytes(16).toString('hex');
        oauthStates.set(state, {
            userId: req.user.id,
            timestamp: Date.now(),
            platform: 'linkedin'
        });

        const redirectUri = `${req.protocol}://${req.get('host')}/api/social/linkedin/callback`;
        const authUrl = LinkedInService.getAuthUrl(redirectUri, state);

        return sendSuccess(res, {
            auth_url: authUrl,
            state
        }, 'Redirige al usuario a esta URL');
    } catch (error) {
        console.error('Error iniciando auth LinkedIn:', error);
        return sendError(res, 'Error iniciando autenticación', 500);
    }
};

/**
 * Callback OAuth de LinkedIn
 * @route GET /api/social/linkedin/callback
 */
export const callbackLinkedIn = async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;

        if (error) {
            return res.redirect(`/social/error?message=${encodeURIComponent(error_description || error)}`);
        }

        const stateData = oauthStates.get(state);
        if (!stateData) {
            return res.redirect('/social/error?message=Estado inválido o expirado');
        }
        oauthStates.delete(state);

        const redirectUri = `${req.protocol}://${req.get('host')}/api/social/linkedin/callback`;

        // Intercambiar código por token
        const tokenResult = await LinkedInService.exchangeCodeForToken(code, redirectUri);
        if (!tokenResult.success) {
            return res.redirect(`/social/error?message=${encodeURIComponent(tokenResult.error)}`);
        }

        // Obtener perfil del usuario
        const profileResult = await LinkedInService.getProfile(tokenResult.access_token);

        if (profileResult.success) {
            await CuentasSocialesModel.create({
                plataforma: 'linkedin',
                nombre_cuenta: profileResult.profile.name || 'LinkedIn Usuario',
                page_id: profileResult.profile.sub, // URN del usuario
                access_token: tokenResult.access_token,
                token_expires_at: tokenResult.expires_at,
                estado: 'conectada'
            });
        }

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientUrl}/?social_success=true&platform=linkedin`);
    } catch (error) {
        console.error('Error en callback LinkedIn:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientUrl}/?social_error=true&message=Error procesando autenticación`);
    }
};

// ==================== PUBLICACIÓN ====================

/**
 * Publica contenido en una red social
 * @route POST /api/social/publicar/:contenidoId
 */
export const publicarContenido = async (req, res) => {
    try {
        const { contenidoId } = req.params;
        const { cuenta_id, plataforma } = req.body;

        // Validar
        if (!cuenta_id) {
            return sendError(res, 'cuenta_id es requerido', 400);
        }

        // Obtener contenido
        const contenido = await ContenidoModel.getById(parseInt(contenidoId));
        if (!contenido) {
            return sendError(res, 'Contenido no encontrado', 404);
        }

        // Obtener cuenta social
        const cuenta = await CuentasSocialesModel.getById(parseInt(cuenta_id));
        if (!cuenta) {
            return sendError(res, 'Cuenta social no encontrada', 404);
        }

        if (cuenta.estado !== 'conectada') {
            return sendError(res, 'La cuenta no está conectada. Reconecta la cuenta.', 400);
        }

        let resultado;

        console.log(`[SocialController] Publicando contenido ${contenidoId} en ${cuenta.plataforma}`);
        console.log(`[SocialController] Imágenes encontradas: ${contenido.imagenes?.length || 0}`);

        switch (cuenta.plataforma) {
            case 'facebook':
                const fbPayload = { message: contenido.copy_texto || contenido.contenido };
                
                // Si hay imagen, agregarla al payload
                if (contenido.imagenes && contenido.imagenes.length > 0) {
                    fbPayload.image_url = contenido.imagenes[0].url_imagen;
                    console.log(`[SocialController] ✅ Imagen detectada para Facebook: ${fbPayload.image_url}`);
                } else {
                    console.log(`[SocialController] ⚠️ No hay imágenes para Facebook`);
                }

                resultado = await MetaService.publishToFacebook(
                    cuenta.page_id,
                    cuenta.access_token,
                    fbPayload
                );
                break;

            case 'instagram':
                if (!contenido.imagenes || contenido.imagenes.length === 0) {
                    console.log(`[SocialController] ❌ Error: Instagram requiere imagen`);
                    return sendError(res, 'Instagram requiere una imagen', 400);
                }
                
                console.log(`[SocialController] ✅ Imagen detectada para Instagram: ${contenido.imagenes[0].url_imagen}`);
                
                resultado = await MetaService.publishToInstagram(
                    cuenta.page_id,
                    cuenta.access_token,
                    {
                        image_url: contenido.imagenes[0].url_imagen,
                        caption: contenido.copy_texto || contenido.contenido
                    }
                );
                break;

            case 'linkedin':
                console.log(`[SocialController] Publicando en LinkedIn (solo texto por ahora)`);
                resultado = await LinkedInService.publishPost(
                    cuenta.access_token,
                    `urn:li:person:${cuenta.page_id}`,
                    { text: contenido.copy_texto || contenido.contenido }
                );
                break;

            default:
                return sendError(res, `Plataforma ${cuenta.plataforma} no soportada`, 400);
        }

        if (!resultado.success) {
            return sendError(res, `Error publicando: ${resultado.error}`, 500);
        }

        // Actualizar estado del contenido
        await ContenidoModel.updateEstado(parseInt(contenidoId), 'publicado');

        return sendSuccess(res, {
            resultado,
            contenido_id: contenidoId,
            plataforma: cuenta.plataforma
        }, 'Contenido publicado exitosamente');
    } catch (error) {
        console.error('Error publicando contenido:', error);
        return sendError(res, 'Error publicando contenido', 500);
    }
};

/**
 * Obtiene todas las cuentas sociales
 * @route GET /api/social/cuentas
 */
export const getCuentas = async (req, res) => {
    try {
        const cuentas = await CuentasSocialesModel.getAll();
        return sendSuccess(res, { cuentas });
    } catch (error) {
        return sendError(res, 'Error obteniendo cuentas', 500);
    }
};

/**
 * Desconecta una cuenta social
 * @route DELETE /api/social/cuentas/:id
 */
export const desconectarCuenta = async (req, res) => {
    try {
        const { id } = req.params;
        const removed = await CuentasSocialesModel.remove(parseInt(id));

        if (!removed) {
            return sendError(res, 'Cuenta no encontrada', 404);
        }

        return sendSuccess(res, null, 'Cuenta desconectada');
    } catch (error) {
        return sendError(res, 'Error desconectando cuenta', 500);
    }
};
