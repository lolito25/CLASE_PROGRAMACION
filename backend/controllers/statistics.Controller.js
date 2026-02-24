/*
Controlador de estadisticas
GET /api/statistics
auth token requerido
estadisticas disponibles:
total de usuarios
total de productos
total de categorias
total de subcategorias
*/

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');

/*
respuestas
200: estadisticas obtenidas
500: error de servidor
*/

const getStatistics = async (req, res) => {
    try {
        //ejecuta todos los requerimientos en paralelo
        const[totalUsers, totalProducts, totalCategories, totalSubcategories] = await Promise.all([
            User.countDocuments(), //contar usuarios
            Product.countDocuments(), //contar productos
            Category.countDocuments(), //contar categorias
            Subcategory.countDocuments() //contar subcategorias
        ]);

        //retorna las estadisticas
        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalCategories,
                totalSubcategories
            }
        });
    } catch (error) {
        console.error('Error en getStatistics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas',
            error: error.message
        });
    }
};

module.exports = {
    getStatistics
};
