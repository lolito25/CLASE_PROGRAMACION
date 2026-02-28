/*
rutas de categorias
define los endpoints crud para la gestion de categorias
las categorias son contenedores padres de subcategorias y productos
endpoints:
Post /api/categories crear una nueva categorias 
Get /api/categories obtiene todas las categorias
Get /api/categories/:id obtiene una categoria por id
Put /api/categories/:id actualiza una categoria por id
Delete /api/categories/:id elimina o desactiva una categoria por id
*/

const express = require('express');
const router = express.Router('');
const categoryController = require('../controllers/categoryController');
const {verifyToken} = require('../middleswares/authJwt');
const {checkRole} = require('../middleswares/role');

//rutas crud

router.post('/', verifyToken, checkRole(['admin','coordinador']), categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

router.put('/:id', verifyToken, checkRole(['admin','coordinador']), categoryController.updateCategory);
router.delete('/:id', verifyToken, checkRole(['admin']), categoryController.deleteCategory);

module.exports = router;