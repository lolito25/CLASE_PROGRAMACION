/**
 * archivo indice de middlewares
 * centraliza la importacion de todos los middlewares de autenticacion y autorizacion
 * permite importar multiples middlewares de forma concisa en las rutas
 */

const authJWR = require('./authJwt');
const verifySignUp = require('./verifySingUp');

//exportar todos los middlewares agrupados o por modulo

module.exports = {
    authJWT: require('./authJwt'),
    verifySignUp: require('./verifySingUp'),
    role: require('./role')
};