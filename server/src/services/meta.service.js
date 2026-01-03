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
/**
 * Verifica el estado del contenedor de media de Instagram
 * @param {string} containerId - ID del contenedor
 * @param {string} accessToken - Token de acceso
 * @returns {Promise<boolean>} True si está listo, False si falló
 */
const checkContainerStatus = async (containerId, accessToken) => {
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 2000; // 2 segundos

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(
                `${META_GRAPH_URL}/${containerId}?fields=status_code,status&access_token=${accessToken}`
            );
            const data = await response.json();

            if (data.error) {
                console.error(`[MetaService] ❌ Error verificando estado:`, data.error);
                return false;
            }

            console.log(`[MetaService] Estado contenedor ${containerId}: ${data.status_code} (${data.status})`);

            if (data.status_code === 'FINISHED') {
                return true;
            }

            if (data.status_code === 'ERROR') {
                console.error(`[MetaService] ❌ El contenedor falló al procesarse`);
                return false;
            }

            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, delay));
            attempts++;
        } catch (error) {
            console.error(`[MetaService] Error en checkContainerStatus:`, error);
            return false;
        }
    }

    console.error(`[MetaService] ❌ Timeout esperando a que el contenedor esté listo`);
    return false;
};

/**
 * Publica contenido en una página de Facebook
 * @param {string} pageId - ID de la página
 * @param {string} pageAccessToken - Token de la página
 * @param {Object} content - Contenido a publicar (message, image_url, images array)
 * @returns {Promise<Object>} Resultado de publicación
 */
export const publishToFacebook = async (pageId, pageAccessToken, content) => {
    try {
        // Caso 1: Múltiples imágenes (Carrusel / Álbum)
        if (content.images && content.images.length > 1) {
            console.log(`[MetaService] Publicando álbum en Facebook con ${content.images.length} imágenes`);
            
            const mediaIds = [];
            
            // Subir cada imagen sin publicar
            for (const imageUrl of content.images) {
                const photoResponse = await fetch(`${META_GRAPH_URL}/${pageId}/photos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: imageUrl,
                        published: false,
                        access_token: pageAccessToken
                    })
                });
                
                const photoData = await photoResponse.json();
                if (photoData.error) throw new Error(photoData.error.message);
                mediaIds.push(photoData.id);
            }

            // Crear post con las imágenes adjuntas
            const feedResponse = await fetch(`${META_GRAPH_URL}/${pageId}/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content.message,
                    attached_media: mediaIds.map(id => ({ media_fbid: id })),
                    access_token: pageAccessToken
                })
            });

            const feedData = await feedResponse.json();
            if (feedData.error) throw new Error(feedData.error.message);

            console.log(`[MetaService] ✅ Álbum publicado exitosamente en Facebook ID: ${feedData.id}`);
            return { success: true, post_id: feedData.id, platform: 'facebook' };
        }

        // Caso 2: Una sola imagen o solo texto
        const imageUrl = content.image_url || (content.images && content.images[0]);
        
        const endpoint = imageUrl
            ? `${META_GRAPH_URL}/${pageId}/photos`
            : `${META_GRAPH_URL}/${pageId}/feed`;

        const body = imageUrl
            ? { url: imageUrl, caption: content.message, access_token: pageAccessToken }
            : { message: content.message, access_token: pageAccessToken };

        console.log(`[MetaService] Publicando en Facebook. Endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.error) {
            console.error(`[MetaService] ❌ Error de Facebook API:`, data.error);
            throw new Error(data.error.message);
        }

        console.log(`[MetaService] ✅ Publicación exitosa en Facebook ID: ${data.id || data.post_id}`);

        return {
            success: true,
            post_id: data.id || data.post_id,
            platform: 'facebook'
        };
    } catch (error) {
        console.error(`[MetaService] ❌ Error en publishToFacebook:`, error.message);
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
 * @param {Object} content - Contenido a publicar (caption, image_url, images array)
 * @returns {Promise<Object>} Resultado de publicación
 */
export const publishToInstagram = async (igAccountId, accessToken, content) => {
    try {
        console.log(`[MetaService] Publicando en Instagram. Cuenta: ${igAccountId}`);
        
        // Normalizar imágenes
        const images = content.images && content.images.length > 0 
            ? content.images 
            : (content.image_url ? [content.image_url] : []);

        if (images.length === 0) {
            throw new Error('Instagram requiere al menos una imagen');
        }

        let creationId;

        // Caso 1: Carrusel (Múltiples imágenes)
        if (images.length > 1) {
            console.log(`[MetaService] Creando carrusel de Instagram con ${images.length} imágenes`);
            const itemIds = [];

            // Crear contenedores para cada imagen
            for (const imageUrl of images) {
                const itemResponse = await fetch(`${META_GRAPH_URL}/${igAccountId}/media`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: imageUrl,
                        is_carousel_item: true,
                        access_token: accessToken
                    })
                });
                
                const itemData = await itemResponse.json();
                if (itemData.error) throw new Error(itemData.error.message);
                itemIds.push(itemData.id);
            }

            // Crear contenedor del carrusel
            const carouselResponse = await fetch(`${META_GRAPH_URL}/${igAccountId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    media_type: 'CAROUSEL',
                    caption: content.caption,
                    children: itemIds,
                    access_token: accessToken
                })
            });

            const carouselData = await carouselResponse.json();
            if (carouselData.error) throw new Error(carouselData.error.message);
            creationId = carouselData.id;

        } else {
            // Caso 2: Imagen única
            console.log(`[MetaService] Creando post de imagen única`);
            const containerResponse = await fetch(
                `${META_GRAPH_URL}/${igAccountId}/media`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: images[0],
                        caption: content.caption,
                        access_token: accessToken
                    })
                }
            );

            const containerData = await containerResponse.json();
            if (containerData.error) throw new Error(containerData.error.message);
            creationId = containerData.id;
        }

        console.log(`[MetaService] ✅ Contenedor creado: ${creationId}. Verificando estado...`);

        // Verificar estado antes de publicar
        const isReady = await checkContainerStatus(creationId, accessToken);
        if (!isReady) {
            throw new Error('El contenedor multimedia no estuvo listo a tiempo');
        }

        // Publicar el contenedor
        const publishResponse = await fetch(
            `${META_GRAPH_URL}/${igAccountId}/media_publish`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: creationId,
                    access_token: accessToken
                })
            }
        );

        const publishData = await publishResponse.json();

        if (publishData.error) {
            console.error(`[MetaService] ❌ Error publicando contenedor IG:`, publishData.error);
            throw new Error(publishData.error.message);
        }

        console.log(`[MetaService] ✅ Publicación exitosa en Instagram ID: ${publishData.id}`);

        return {
            success: true,
            post_id: publishData.id,
            platform: 'instagram'
        };
    } catch (error) {
        console.error(`[MetaService] ❌ Error en publishToInstagram:`, error.message);
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
