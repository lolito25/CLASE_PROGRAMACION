/*
MIDDLEWARE: Autenticación JWT
Verifica que el usuario tenga un token válido
y carga los datos del usuario en req.user
*/

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/*
Autenticar usuarios
Valida el token JWT Bearer en el header Authorization.
Si es válido, carga el usuario en req.user.
Si no es válido o no existe, retorna 401 Unauthorized.
*/

exports.authenticateJWT = async (req, res, next) => {
    try {
        // Extraer el token del header: Bearer <token>
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // Si no hay token, rechazar la solicitud
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticación requerido',
                details: 'Incluye Authorization: Bearer <token>'
            });
        }

        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar el usuario en la base de datos
        const user = await User.findById(decoded.userId);

        // Si el usuario no existe, rechazar la solicitud
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o ha sido eliminado'
            });
        }

        // Cargar el usuario en el request
        req.user = user;

        // Llamar al siguiente middleware o controlador
        next();

    } catch (error) {
        console.error('Error en authenticateJWT:', error.message);

        let message = 'Token de autenticación inválido';

        if (error.name === 'TokenExpiredError') {
            message = 'Token de autenticación expirado';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Token de autenticación no válido';
        }

        return res.status(401).json({
            success: false,
            message,
            error: error.message
        });
    }
};

/*
middleware para autorizar por el rol
verificar que el usuario tiene uno de los roles requeridos se usa despues del maldware de autenticacion
// @param{Array} roles - Lista de roles permitidos para acceder a la ruta
// @returns {Function} Middleware de autorización

uso : app.delete('/api/users/:id', authenticateJWT, authorizeRoles(['admin']), deleteUser);
*/

exports.authorizeRoles = (roles) => {
    return (req, res, next) => {
        // Verificar que el usuario autenticado tiene uno de los roles permitidos
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: rol insuficiente',
                requiredRoles: roles,
                currentRole: req.user.role,
                details: `tu rol es "${req.user.role}" pero se requiere uno de: ${roles.join(', ')}`
            });
        }
        //si el usuario tiene permiso , continuar con el siguiente middleware o controlador
        next();
    };
};
