/**
 * @fileoverview Servicio OAuth para LinkedIn
 * @description Maneja autenticación y publicación en LinkedIn API
 * @module services/linkedin
 */

import dotenv from 'dotenv';

dotenv.config();

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

/**
 * Genera la URL de autorización OAuth para LinkedIn
 * @param {string} redirectUri - URI de redirección
 * @param {string} state - Estado para prevenir CSRF
 * @returns {string} URL de autorización
 */
export const getAuthUrl = (redirectUri, state) => {
    const scopes = [
        'openid',
        'profile',
        'email',
        'w_member_social'
    ].join(' ');

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINKEDIN_CLIENT_ID,
        redirect_uri: redirectUri,
        state: state,
        scope: scopes
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
};

/**
 * Intercambia código de autorización por access token
 * @param {string} code - Código de autorización
 * @param {string} redirectUri - URI de redirección usada
 * @returns {Promise<Object>} Token de acceso
 */
export const exchangeCodeForToken = async (code, redirectUri) => {
    try {
        const response = await fetch(
            'https://www.linkedin.com/oauth/v2/accessToken',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                    client_id: LINKEDIN_CLIENT_ID,
                    client_secret: LINKEDIN_CLIENT_SECRET
                }).toString()
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error_description || data.error);
        }

        return {
            success: true,
            access_token: data.access_token,
            expires_in: data.expires_in, // segundos
            expires_at: new Date(Date.now() + data.expires_in * 1000)
        };
    } catch (error) {
        console.error('Error intercambiando código LinkedIn:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Obtiene el perfil del usuario autenticado
 * @param {string} accessToken - Token de acceso
 * @returns {Promise<Object>} Perfil del usuario
 */
export const getProfile = async (accessToken) => {
    try {
        const response = await fetch(
            `${LINKEDIN_API_URL}/userinfo`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error_description || data.error);
        }

        return {
            success: true,
            profile: {
                sub: data.sub, // LinkedIn URN (persona ID)
                name: data.name,
                email: data.email,
                picture: data.picture
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Publica contenido en LinkedIn
 * @param {string} accessToken - Token de acceso
 * @param {string} personUrn - URN del usuario (urn:li:person:xxx)
 * @param {Object} content - Contenido a publicar
 * @returns {Promise<Object>} Resultado de publicación
 */
export const publishPost = async (accessToken, personUrn, content) => {
    try {
        // Estructura del post según LinkedIn API v2
        const postBody = {
            author: personUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: content.text
                    },
                    shareMediaCategory: content.image_url ? 'IMAGE' : 'NONE'
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        };

        // Si hay imagen, primero hay que registrarla (proceso más complejo)
        // Por ahora solo publicamos texto

        const response = await fetch(
            `${LINKEDIN_API_URL}/ugcPosts`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify(postBody)
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error publicando en LinkedIn');
        }

        const postId = response.headers.get('x-restli-id');

        return {
            success: true,
            post_id: postId,
            platform: 'linkedin'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            platform: 'linkedin'
        };
    }
};

/**
 * Verifica si la configuración de LinkedIn está completa
 */
export const verificarConfiguracion = () => {
    return {
        configurado: !!LINKEDIN_CLIENT_ID && !!LINKEDIN_CLIENT_SECRET,
        client_id_presente: !!LINKEDIN_CLIENT_ID,
        client_secret_presente: !!LINKEDIN_CLIENT_SECRET
    };
};
