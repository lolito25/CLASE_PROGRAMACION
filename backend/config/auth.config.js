//carga de variables de entorno desde .env 
require('dotenv').config();

module.exports= {
    //clave para firmar los tokens de jwt
    secret: process.env.JWT_SECRET || "tusecretoparalostokens",

    //tiempo de expiracion del token en segundos
    jwtExpiration: process.env.JWT_EXPIRATION ||
    86400, //24 HORAS
    
    //Tiempo de expiracion de refrescar el token
    jwtRefresh: 6048000, // 7 Dias
    
    //Numero de rondas para encriptar la contraseña
    slatRounds: process.env.SALT_ROUNDS || 8
};
