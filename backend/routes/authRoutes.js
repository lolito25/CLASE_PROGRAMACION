/*
rutas de autenticacion y autorizacion
define los endpoints real activos a autenticacion de usuarios 
POST /api/auth/signin : login de usuario
post /api/auth/signunp registrar un nuevo usuario
*/

const express = require ('express');
const router = express.Router();
const authController = require ('../controllers/authControllers');

const {verifySignUp} = require('../middleswares');
const {verifyToken} = require('../middleswares/authJwt');
const {checkRole} = require('../middleswares/role');

// rutas de autenticacion

//requiere email-usuario y contraseña
router.post('/signin', authController.signin);

router.post('/signup', verifyToken, checkRole('admin'), verifySignUp.checkDuplicateUsernameOrEmail, authController.signup);

module.exports = router;