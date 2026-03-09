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
    SECRET : process.env.JWT_SECRET || "tusecretoparalostokens",
    TOKEN_EXPIRATION: process.env.JWT_EXPIRATION || '24h',

    //configuracion de conexion a MongoDB
    DB : {
        URL : process.env.MONGO_URI || "mongodb://localhost:27017/crud-mongo" ,
        OPTIONS : {
            useNewURLParser : true,
            useUnifiedTopology: true,
        }
    },

    //ROLES DEL SISTEMA
    ROLES : {ADMIN: 'admin', COORDINADOR: 'coordinador', AUXILIAR:'auxiliar'}
    
}