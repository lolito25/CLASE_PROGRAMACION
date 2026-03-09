/*
post /api/user
get /api/users
get /api/users/:id
delete /api/users/:id

*/

const express = require('express');
const router = express.Router();
const userController = require ('../controllers/userController');
const {verifyToken} = require('../middleswares/authJwt');
const  {checkRole} = require('../middleswares/role');

router.use((req , res , next) => {
    console.log(' Diagnostifo Fr ruta ===');
    console.log (`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log ('Headers: ',{
        'Authorization': req.headers.authorization ? '***' + req.headers.authorization.slice(-4): null ,
        'x-access-token': req.headers['x-access-token'] ? '***' + req.headers['x-access-token'].slice(-4): null ,
    });
    next();
})

// rutas de usuarios

// crear nuevo usuario (solo admin)
router.post('/', verifyToken, checkRole('admin'), userController.createUser);

// listar todos los usuarios
router.get('/' , verifyToken, checkRole('admin','coordinador', 'auxiliar'), userController.getAllUsers);

//obtener un usuario por id 
router.get('/:id', verifyToken, checkRole('admin','coordinador', 'auxiliar'), userController.getUserById);

//eliminar o desactivar un usuario por id (solo admin)
router.delete('/:id', verifyToken,checkRole('admin'),userController.deleteUser);

module.exports = router;
