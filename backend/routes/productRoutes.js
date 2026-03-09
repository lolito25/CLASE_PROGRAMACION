/**
 * Rutas de productos
 * define los endpoints CRUD para la gestion de productos
 * las productos son contenedores padres de productos y productos
 * endpoints:
 * Post /api/products crea una nueva subcategoria
 * Get /api/products obtiene todas las productos
 * Get /api/products/:id obtiene una subcategoria por id
 * Put /api/products/:id actualiza una subcategoria por id
 * Delete /api/products/:id elimina una subcategoria/desactivar 
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { check } = require('express-validator');
const { verifyToken } = require('../middleswares/authJwt');
const { checkRole } = require('../middleswares/role');

const validateProduct = [
    check('name')
        .not().isEmpty()
        .withMessage('el nombre es obligatorio'),
 
    check('description')
        .not().isEmpty()
        .withMessage('la descipcion es obligatoria'),

    check('price')
        .not().isEmpty()
        .withMessage('el precio es obligatorio'),
        
    check('stock')
        .not().isEmpty()
        .withMessage('el stock es obligatoria'),
        
    check('category')
        .not().isEmpty()
        .withMessage('la categoria es obligatoria'),
        
    check('subcategory')
        .not().isEmpty()
        .withMessage('la categoria es obligatoria'),
];

//Rutas CRUD

router.post('/',
    verifyToken,
    checkRole('admin','coordinador','auxiliar'),
    productController.createProduct
);

router.get('/',
    verifyToken, 
    productController.getProducts);

router.get('/:id', 
    verifyToken,
    productController.getProductById);

router.put('/:id',
    verifyToken,
    checkRole('admin','coordinador'),
    validateProduct,
    productController.updateProduct
);
router.delete('/:id',
    verifyToken,
    checkRole('admin'),
    productController.deleteProduct
);

module.exports = router;