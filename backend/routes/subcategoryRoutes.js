/*
rutas de subcategorias
define los endpoints crud para la gestion de subcategorias
las subcategorias son contenedores hijos de categorias y padres de productos
endpoints:
Post /api/subcategories crear una nueva subcategoria 
Get /api/subcategories obtiene todas las subcategorias
Get /api/subcategories/:id obtiene una subcategoria por id
Put /api/subcategories/:id actualiza una subcategoria por id
Delete /api/subcategories/:id elimina o desactiva una subcategoria por id
*/

const express = require('express');
const router = express.Router('');
const subcategoryController = require('../controllers/subcategoryController');
const {verifyToken} = require('../middleswares/authJwt');
const {checkRole} = require('../middleswares/role');
const { check } = require('express-validator');

const validateSubcategory = [
    check('name').not().isEmpty().withMessage('El nombre es obligatorio'),
    check('description').not().isEmpty().withMessage('La descripcion es obligatoria'),
    check('category').not().isEmpty().withMessage('La categoria es obligatoria')
    
]


router.post('/', verifyToken, checkRole(['admin','coordinador']), validateSubcategory, subcategoryController.createSubcategory);
router.get('/', subcategoryController.getSubcategories);
router.get('/:id', subcategoryController.getSubcategoryById);
router.put('/:id', verifyToken, checkRole(['admin','coordinador']), validateSubcategory, subcategoryController.updateSubcategory);
router.delete('/:id', verifyToken, checkRole(['admin']), subcategoryController.deleteSubcategory);

// --- rutas de productos ----------------------------------------------------
const productController = require('../controllers/productController');
const Product = require('../models/Product');

// validations for product payload
const validateProduct = [
    check('name').not().isEmpty().withMessage('El nombre es obligatorio'),
    check('description').not().isEmpty().withMessage('La descripcion es obligatoria'),
    check('price').isNumeric().withMessage('El precio debe ser un número'),
    check('stock').isNumeric().withMessage('El stock debe ser un número'),
    check('category').not().isEmpty().withMessage('La categoria es obligatoria'),
    check('subcategory').not().isEmpty().withMessage('La subcategoria es obligatoria')
];

// endpoints para productos (se montan en /api/subcategories/...) 
// según convención podrían utilizarse rutas generales como /products pero las dejamos aquí

router.post('/products', verifyToken, checkRole(['admin','coordinador']), validateProduct, productController.createProduct);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.put('/products/:id', verifyToken, checkRole(['admin','coordinador']), validateProduct, productController.updateProduct);
router.delete('/products/:id', verifyToken, checkRole(['admin']), productController.deleteProduct);

// obtener productos que pertenecen a una subcategoria especifica
router.get('/:id/products', async (req, res) => {
    try {
        // comprobar que la subcategoria existe opcionalmente
        const products = await Product.find({ subcategory: req.params.id })
            .populate('category', 'name')
            .populate('subcategory', 'name');
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Error al listar productos por subcategoria', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos de la subcategoria',
            error: error.message
        });
    }
});

module.exports = router; 