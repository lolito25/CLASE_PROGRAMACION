/*
modulo de conexion a la base de datos mongo db

este archivo maneja la conexion de la base de datos   mongo db utilizando mongoose

establece la conexion con la base de datos

configura las opciones de conexion 

maneja los errores de conexion

exporta la funcion de  connectdb para usar en server.js

*/

const mongoose = require('mongoose');
const {DB_URI} = process.env;

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI, {
            useNewUrlParser: true ,
            useUnifiedTopology: true,
            
        });
        console.log('conexion a la base de datos establecida');
    } catch(error){
        console.error('error al conectar a la base de datos: ', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
