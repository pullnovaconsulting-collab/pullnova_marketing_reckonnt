/**
 * @fileoverview Middleware de control de roles
 * @description Verifica que el usuario tenga los permisos necesarios según su rol
 * @module middlewares/role
 */

/**
 * Jerarquía de roles (de menor a mayor permisos)
 * viewer < editor < admin
 */
const ROLE_HIERARCHY = {
    viewer: 1,
    editor: 2,
    admin: 3
};

/**
 * Middleware factory para verificar roles mínimos
 * @param {string} minRole - Rol mínimo requerido ('viewer', 'editor', 'admin')
 * @returns {Function} Middleware function
 * 
 * @example
 * // Solo admin puede acceder
 * router.delete('/usuarios/:id', requireRole('admin'), deleteUsuario);
 * 
 * // Editor o superior pueden acceder
 * router.post('/campanas', requireRole('editor'), createCampana);
 */
export const requireRole = (minRole) => {
    return (req, res, next) => {
        // Verificar que el usuario esté autenticado
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'No autenticado'
            });
        }

        const userRoleLevel = ROLE_HIERARCHY[req.user.rol];
        const requiredRoleLevel = ROLE_HIERARCHY[minRole];

        // Verificar si el rol del usuario tiene suficientes permisos
        if (userRoleLevel < requiredRoleLevel) {
            return res.status(403).json({
                status: 'error',
                message: `Acceso denegado. Se requiere rol: ${minRole} o superior.`,
                requiredRole: minRole,
                currentRole: req.user.rol
            });
        }

        next();
    };
};

/**
 * Middleware para verificar que el usuario sea admin
 * Atajo para requireRole('admin')
 */
export const isAdmin = requireRole('admin');

/**
 * Middleware para verificar que el usuario sea editor o superior
 * Atajo para requireRole('editor')
 */
export const isEditor = requireRole('editor');

/**
 * Middleware para verificar que el usuario tenga al menos rol viewer
 * Básicamente verifica que esté autenticado (útil para claridad)
 */
export const isViewer = requireRole('viewer');

/**
 * Middleware para verificar que el usuario sea el propietario del recurso
 * o sea admin (puede acceder a todo)
 * @param {Function} getOwnerId - Función que extrae el owner_id del request
 * @returns {Function} Middleware function
 * 
 * @example
 * // El usuario solo puede editar su propio perfil (excepto admin)
 * router.put('/usuarios/:id', isOwnerOrAdmin((req) => parseInt(req.params.id)), updateUsuario);
 */
export const isOwnerOrAdmin = (getOwnerId) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'No autenticado'
            });
        }

        // Admin puede acceder a todo
        if (req.user.rol === 'admin') {
            return next();
        }

        // Verificar si es el propietario
        const ownerId = getOwnerId(req);
        if (req.user.id === ownerId) {
            return next();
        }

        return res.status(403).json({
            status: 'error',
            message: 'No tienes permiso para acceder a este recurso'
        });
    };
};
