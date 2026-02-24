/*
MIDDLEWARE : autenticacion JWT
verificar que el usuario tenga un token valido y carga los datos del usuario en req.userId y req.userRole
*/

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/*
autenticar usuarios
valida el token jwt bearer en  el haeder authorization
si es valido  carga el usuario en req.user
si no es valido o no existe retorna 401 Unauthorized
*/

exports.authenticateJWT = async (req, res, next) => {
    try{
        //extraer el token del header bearer <token>
        const token = req.header('Authorization')?.replace('Bearer ', '');

        //si no hay token rechaza la solicitud

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticacion requerido',
                details:'incluye authorization bearer <token>'
            });
        }
    } catch (error) {
        console.error('Error en authenticateJWT:', error.message);
        res.status(401).json({
            success: false,
            message: 'Token de autenticacion invalido',
            error: error.message
        });
    }
};
