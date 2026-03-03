/*
archivo de configuracion central del backend

este archivo centraliza todas las configuraciones principales de la alicacion

configuracion de JWT DE AUTENTICACION 

configuracion de conexion a la base de datos Mongo DB

definicion de roles del sistema

las variables de entorno tienen prioridad  sobre los valores por defecto

*/

module.exports = {
    // configuracion de JWT
    SECRET : proccess.env.JWT_SECRET || "tusecretoparalostokens",
    TOKEN_EXPIRATION: proccess.env.JWT_EXPIRATION || '24h',

    //configuracion de conexion a MongoDB
    DB : {
        URL : proccess.env.MONGODB_URL || "mongodb://Localhost:27017/nombre_mi_bd" ,
        OPTIONS : {
            useNewURLParser : true,
            userUnifiedTopology: true,
        }
    },

    //ROLES DEL SISTEMA
    ROLES : {ADMIN: 'admin', COORDINADOR: 'coordinador', AUXILIAR:'auxiliar'}
    
}