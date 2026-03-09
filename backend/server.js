/*
servidor principal

punto de entrada a la aplicacion backend

configura express, cors y conecta a la base de datos MONGO DB , define  rutas y conecta con el frontend 
*/

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');

/*
validaciones iniciales
verifica que las variables de entorno requeridas esten definidas
*/

// validar variables de entorno esenciales
// se puede usar la URL de la configuración por defecto si no se especifica
const mongoUri = process.env.MONGO_URI || config.DB.URL;
if (!mongoUri){
    console.error('error: cadena de conexión MongoDB no está definida');
    process.exit(1);
}

if (!process.env.JWT_SECRET){
    console.error('error : JWT_SECRET no esta definida en .env');
    process.exit(1);
}

//importar todas las rutas
const authRoutes = require ('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const statisticsRoutes = require('./routes/statisticsRouter');


const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// logging HTTP requests
app.use(morgan('dev'));

// body parsers
app.use(express.json());                // parse JSON bodies
app.use(express.urlencoded({extended:true})); // parse form-encoded bodies

//coneion a mongo db
mongoose.connect(mongoUri, config.DB.OPTIONS)
    .then(() => console.log('MongoDB conectado exitosamente'))
    .catch(err => {
        console.error('Error al conectar a MongoDB:', err.message);
        process.exit(1);
    });

//registra rutas

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/statistics', statisticsRoutes);

//ruta base opcional para verificar que el servidor responde
app.get('/', (req, res) => res.send('Backend funcionando'));

// manejo de rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Recurso no encontrado'
    });
});

// middleware global de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error global:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
});

// listeners para errores de promesas no manejadas o excepciones
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', err => {
    console.error('Uncaught Exception thrown:', err);
    process.exit(1);
});

// iniciar el servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

// exportar la instancia de app (útil para pruebas o uso en otros módulos)
module.exports = app;
