/*
routes/userRoutes.js

post /api/user
get /api/users
get /api/users/:id
put /api/users/:id
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

// crear nuevo usuario (solo admin)
router.post('/', verifyToken, checkRole('admin'), userController.createUser);

// listar todos los usuarios
router.get('/' , verifyToken, checkRole('admin','coordinador', 'auxiliar'), userController.getAllUsers);

// obtener usuario por id
router.get('/:id', verifyToken, checkRole('admin','coordinador', 'auxiliar'), userController.getUserById);

// ACTUALIZAR usuario
router.put('/:id', verifyToken, checkRole('admin'), userController.updateUser);

// eliminar usuario
router.delete('/:id', verifyToken,checkRole('admin'),userController.deleteUser);

module.exports = router;