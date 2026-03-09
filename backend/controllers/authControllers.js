/**
 * control de autenticacion
 * maneja el registro del login y generacion de token JWT
 */ 

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config =require('../config/auth.config');

/**
 * SIGNUP: crear nuevo usuario
 * POST /api/auth/signup
 * Body {username, email, password role}
 * crea usuario en la base de datos
 * enctripta contraseña amtes de giardar con bcrypt
 * genera token JWT
 * Retorna usuario sin mostrar la contraseña
 */

exports.signup = async (req, res) => {
    try{
        //crear nuevo usuario
        const user = new user({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role || 'auxiliar' //por defecto el rol es auxiliar
        });

        //guardar en base de datos
        //la contraseña se enctripta automaticamente en el middleware del modelo
        const savedUser = await user.save();

        //generar token jwt que expira en 24 horas
        const token  = jwt.sign(
            {
            id: savedUser.id,
            role: savedUser.role,
            email: savedUser.email
            },
            config.secret,
            { expiresIn: config.jwtExpiration }
    );

        //Preparando respuesra sin mostrar la contraseña
        const UserResponse = {
            id: savedUser.username,
            username: savedUser.username,
            email: savedUser.email,
            role: savedUser.role,
        };

        res.status(200).json({
            success: true,
            message: 'Usuario no registrado correctamente',
            token: token,
            user: UserResponse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }

};

/**
 * SINGIN: Iniciar sesion
 * POST /api/auth/singin
 * body { email o usuario, password }
 * busca el usuario por email o username
 * valida la contraseña con bcrypt
 * si es correcto el token jwt
 * El token se usa para autenticar futuras solicitudes
 */
exports.signin = async(req, res) => {
    try{
        //validar que se envie el email o el username
        if(!req.body.email && !req.body.username){
            return res.status(400).json({
                success: false,
                message: 'email o username requerido'
            });
        }

        //validar que se envie la contraseña
        if(!req.body.password){
            return res.status(400).json({
                success: false,
                message: 'password requerido'
            });
        }
        //buscar usuario por email o username
        const user = await User.findOne({
            $or: [
                { username: req.body.username},
                { email: req.body.email}
            ]
        }).select('+password'); //inlcuye password field

        // si no existe el usuario con este email o username
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //verificar que el usuario tenga contraseña
        if(!user.password) {
            return res.status(500).json({
                success: false,
                message: 'Error interno: usuario sin contraseña'
            });
        }
        
        //comparar contraseña enviada con el hash almacenado 
        const isPasswordValid = await bcrypt.compare
        (req.body.password, user.password);

        if (!isPasswordValid){
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }
        //Generar token JWT 24 horas
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role || 'admin',
                email: user.email
            },
            config.secret,
            { expiresIn: config.jwtExpiration}
        );

        // prepara respuesta sin mostrar la contraseña
        const UserResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        res.status(200).json({
            success: true,
            message: 'Inicio de sesion exitoso',
            token: token,
            user: UserResponse
        });
    } catch (error){
        return res.status(500).json({
            success: false,
            message: 'Error al iniciar sesion',
            error: error.message
        });
    }
};