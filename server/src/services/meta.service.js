/**
 * @fileoverview Servicio OAuth para Meta (Facebook/Instagram)
 * @description Maneja autenticación y publicación en Meta APIs
 * @module services/meta
 */

import dotenv from 'dotenv';

dotenv.config();

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_API_VERSION = 'v18.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Genera la URL de autorización OAuth para Meta
 * @param {string} redirectUri - URI de redirección después de auth
 * @param {string} state - Estado para prevenir CSRF
 * @returns {string} URL de autorización
 */
export const getAuthUrl = (redirectUri, state) => {
    const scopes = [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'instagram_basic',
        'instagram_content_publish',
        'business_management'
    ].join(',');

    const params = new URLSearchParams({
        client_id: META_APP_ID,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: 'code',
        state: state
    });

    return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`;
};

/**
 * Intercambia código de autorización por access token
 * @param {string} code - Código de autorización
 * @param {string} redirectUri - URI de redirección usada
 * @returns {Promise<Object>} Token de acceso
 */
export const exchangeCodeForToken = async (code, redirectUri) => {
    try {
        const params = new URLSearchParams({
            client_id: META_APP_ID,
            client_secret: META_APP_SECRET,
            redirect_uri: redirectUri,
            code: code
        });

        const response = await fetch(
            `${META_GRAPH_URL}/oauth/access_token?${params.toString()}`
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            success: true,
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in
        };
    } catch (error) {
        console.error('Error intercambiando código:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Obtiene token de larga duración
 * @param {string} shortToken - Token de corta duración
 * @returns {Promise<Object>} Token de larga duración
 */
export const getLongLivedToken = async (shortToken) => {
    try {
        const params = new URLSearchParams({
            grant_type: 'fb_exchange_token',
            client_id: META_APP_ID,
            client_secret: META_APP_SECRET,
            fb_exchange_token: shortToken
        });

        const response = await fetch(
            `${META_GRAPH_URL}/oauth/access_token?${params.toString()}`
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            success: true,
            access_token: data.access_token,
            expires_in: data.expires_in // ~60 días
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Obtiene las páginas de Facebook del usuario
 * @param {string} accessToken - Token de acceso
 * @returns {Promise<Object>} Lista de páginas
 */
export const getPages = async (accessToken) => {
    try {
        const response = await fetch(
            `${META_GRAPH_URL}/me/accounts?access_token=${accessToken}`
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            success: true,
            pages: data.data.map(page => ({
                id: page.id,
                name: page.name,
                access_token: page.access_token,
                category: page.category
            }))
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Obtiene cuentas de Instagram conectadas a páginas de Facebook
 * @param {string} pageId - ID de la página de Facebook
 * @param {string} pageAccessToken - Token de la página
 * @returns {Promise<Object>} Cuenta de Instagram
 */
export const getInstagramAccount = async (pageId, pageAccessToken) => {
    try {
        const response = await fetch(
            `${META_GRAPH_URL}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        if (!data.instagram_business_account) {
            return {
                success: false,
                error: 'No hay cuenta de Instagram Business vinculada'
            };
        }

        return {
            success: true,
            instagram_account_id: data.instagram_business_account.id
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Publica contenido en una página de Facebook
 * @param {string} pageId - ID de la página
 * @param {string} pageAccessToken - Token de la página
 * @param {Object} content - Contenido a publicar
 * @returns {Promise<Object>} Resultado de publicación
 */
export const publishToFacebook = async (pageId, pageAccessToken, content) => {
    try {
        const endpoint = content.image_url
            ? `${META_GRAPH_URL}/${pageId}/photos`
            : `${META_GRAPH_URL}/${pageId}/feed`;

        const body = content.image_url
            ? { url: content.image_url, message: content.message, access_token: pageAccessToken }
            : { message: content.message, access_token: pageAccessToken };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            success: true,
            post_id: data.id || data.post_id,
            platform: 'facebook'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            platform: 'facebook'
        };
    }
};

/**
 * Publica contenido en Instagram
 * @param {string} igAccountId - ID de cuenta de Instagram
 * @param {string} accessToken - Token de acceso
 * @param {Object} content - Contenido a publicar
 * @returns {Promise<Object>} Resultado de publicación
 */
export const publishToInstagram = async (igAccountId, accessToken, content) => {
    try {
        // Paso 1: Crear contenedor de media
        const containerResponse = await fetch(
            `${META_GRAPH_URL}/${igAccountId}/media`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: content.image_url,
                    caption: content.caption,
                    access_token: accessToken
                })
            }
        );

        const containerData = await containerResponse.json();

        if (containerData.error) {
            throw new Error(containerData.error.message);
        }

        // Paso 2: Publicar el contenedor
        const publishResponse = await fetch(
            `${META_GRAPH_URL}/${igAccountId}/media_publish`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: containerData.id,
                    access_token: accessToken
                })
            }
        );

        const publishData = await publishResponse.json();

        if (publishData.error) {
            throw new Error(publishData.error.message);
        }

        return {
            success: true,
            post_id: publishData.id,
            platform: 'instagram'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            platform: 'instagram'
        };
    }
};

/**
 * Verifica si la configuración de Meta está completa
 */
export const verificarConfiguracion = () => {
    return {
        configurado: !!META_APP_ID && !!META_APP_SECRET,
        app_id_presente: !!META_APP_ID,
        app_secret_presente: !!META_APP_SECRET
    };
};
