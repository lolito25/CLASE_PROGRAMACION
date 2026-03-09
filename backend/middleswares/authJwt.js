/*
middleware de verficacion de token JWT
middleware para verificar y validar tokens jwt en las solicitudes
se usa en todas las rutas protegidas ara autenticar usuarios
caracteristicas:
soporta dos formatos de token
1 authorization: Bearer <token> (estandar REST )
2 x-access-token: <token> (header personalizado)
extrae informacion del token (id  role email)
la adjunta a req.userId req.userRole req.userEmail para uso en controladores
manejo de errores con codigos 403/401 y mensajes claros
flujo:
1. lee el header authorization o x-access-token
2. extrae el token (quita el bearer si es necesario)   
3. verifica el token con la JWT_SECRET
4. si es valido continua al siguiente middleware o controlador
5. si es invalido  retorna 401 con mensaje de error
6. si falta retorna 403  Forbidden con mensaje de error

validacion del token
1. verifica firma criptografica con JWT_SECRET
2. comprueba que no haya expirado (exp)
3. extrae el payload (id, role, email)

*/

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/auth.config');

/*
verificar token
funcionalidad
busca el token en las ubicaciones posibles (orden de procedencia)
1. header Authorization con formato Bearer <token> 
2.headers x-access-token 
si encuentra el token verifica su validez
sino encuentra retorna 403 forbidden con mensaje de error
si token es invalido / expirado retorna 401 unauthorized con mensaje de error
si  es valido adjunta datos del usuario  a req y continua

headers soportados
1. Authorization: Bearer <token>
2. x-access-token: <token> id, role, email
propiedades del request desìes del middleware:
req.userId = (string) id del usuario MONGO DB
req.userRole = (string) rol del usuario (admin, coordinador, auxiliar)
req.userEmail = (string) email del usuario
*/

const verifyTokenFn = (req, res, next) => {
    try {
        // soporta dos formatos authorization bearer o access-token
        let token = null;

        //formato authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {

            //extraer token quitando el beader
            token = req.headers.authorization.substring(7);
        }

        // formato access-token
        else if (req.headers['x-access-token']) {
            token = req.headers['x-access-token'];
        }

        //si no encuentro token retorno la solicitud
        if (!token) {
            return res.status(403).json({
                success: false,
                message: 'Token de autenticación requerido',
                details: 'Incluye Authorization'
            });
        }

        //verificar el token con la clave secreta
        const decoded = jwt.verify(token, config.secret);

        //adjuntar informacion del usuario al reqiest object para que otros middlewares y rutas puedan acceder a ella

        req.userId = decoded.id; //id mongo db
        req.userRole = decoded.role; //rol del usuario (admin, coordinador, auxiliar)
        req.userEmail = decoded.email; //email del usuario

        //token es valido continuar siguiente middleware o ruta
        next();
    } catch (error) {
        //n token invalido o expirado retornar 401 unauthorized
        return res.status(401).json({
            success: false,
            message: 'Token de autenticación inválido o expirado',
            error: error.message
        });
    }
};


/*
validacion de funcion para mejorar seguridad y manejo de errores
verificar que verifyTokenFn sea una funcion valida
esto es una validacion de seguridad para que le  middleware se exporte correctamente
si algo sale mal en su definicion lanzara un error en tiempo de carga de modulo
*/

if (typeof verifyTokenFn !== 'function') {
    console.error('error : verifyTokenFn no es una funcion valida');
    throw new Error('VerifyTokenFn debe ser una funcion valida');

}

//exportar el middleware
module.exports = {
    verifyToken: verifyTokenFn
}