/**
 * Controlador de usuarios
 * Este modulo maneja todas las operaciones del crud para la gestion de usuarios
 * incluye control de acceso a basado en rorles
 * Roles permitidos admin, coordinador, auxiliar
 * Seguridad
 * Las contraseñas nunca se devuelven en respuestas
 * los auxiliares no pueden ver y actuakuzar otros usuarios
 * los coordinadores no pueden ver los administradores
 * activar y desactivar usuarios
 * eliminar permanentemente un usuairo solo admin
 * 
 * operaciones
 * getAlluser listar usuarios con filtro por rol
 * getuserById obtener usuario especifico
 * Createuser crear un nuevo usuario con validacion
 * Updateuser actualizar usuario con restricciones de rol
 * Delete: user eliminar usuario con restricciones de rol
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Obtener lista de usuarios
 * GET /api/users
 * Auth token requerido
 * Query params incluir activo o desactivados
 * 
 * retorna
 * 200 array usuarios filtrados
 * 500 error de servidor 
 */

exports.getAllUsers = async (req, res) => {
    try {
        // por defecto solo mostrar usuarios activos
        const includeInactive = req.query.includeInactive === 'true';
        const activeFilter = includeInactive ? {} : { active: { $ne: false } };

        let users;

        //control de accesobasado en rol
        if (req.userRole === 'auxiliar') {
            //los auxiliares solo pueden verse a si mismo
            users = await User.find({ _id: req.userId, ...activeFilter }).select('-password');
        } else {
            //los admin y coordinadores ven todos los usuarios
            users = await User.find(activeFilter).select('-password');
        }

        res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('[CONTROLLER] Error en getAllusers: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al obtener todos los usuarios'
        });
    }
};

/**
 * Read obtener un usuario especifico por id
 * GET /api/users/:id
 * auth token requerido
 * respuestas
 * 200: usuario encontrado
 * 403: sin permiso para ver el usuario
 * 404: usuario no encontrado
 * 500: error de servidor
 */

exports.getUserById = async (req, res) => {
    try {
        // por defecto solo mostrar usuarios activos
        const user = await user.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //validaciones de acceso
        //los auxiliares soloo pueden ver su propio perfil
        if (req.userRole === 'auxiliar' && req.userId !== user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'no tienes permisos para ver este usuario'
            });
        }

        //los coordinadores no pueden ver administradores
        if (req.userRole === 'coordinador' && role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'no puedes ver usuarios admin'
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Error en getUserById ', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al encontrar al usuario especifico',
            error: error.message
        });
    }
};


/*
CREATE crear un nuevo usuario
POST /api/users
Auth bearer token requerido
Roles : admin y coordinador (con restricciones)

respuestas :
201: usuario creado
400 : validacion fallida
500: error de sv
*/

exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        //crear usuario nuevo
        const user = new user({
            username,
            email,
            password,
            role
        });

        //guardar en bd
        const savedUser = await user.save();

        res.status(201).json({
            success: true,
            message: 'Usuario creado',
            user: {
                id: savedUser.username,
                email: savedUser.email,
                role: savedUser.role
            }
        });

    } catch (error) {
        console.error('Error en createUuser:', error);
        res.status(500).json({
            success: false,
            message: 'error al crear usuario',
            error: error.message
        });
    }
};


/*
    * Update actualizar un usuario existente
    * Put /api/users/:id
    * Auth bearer token requerido
    * Validaciones
    * Auxiliar solo puede actualizar su propio perfil 
    * Auxiliar no puede cambiar su rol
    * Admin, coordinador pueden actualizar otros usuarios 
    * 200 usuario actualizado
    * 403 sin permiso para actualizar
    * 404 usuario no encontrado
    * 500 error de servidor
*/

exports.updateUser = async (req, res) => {
    try {

        //restriccion: auxiliar solo puede actualizar su propio perfil 
        if (req.userRole === 'auxiliar' && req.userId.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'no tienes permisos para actualizar este usuario'
            });
        }

        //restriccion auxiliar no puede cambiar su rol
        if (req.userRole === 'auxiliar' && req.body.role) {
            return res.status(403).json({
                success: false,
                message: 'no puedes cambiar tu rol'
            });
        }

        //actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true } //retorna documento actualizado
        ).select('-password'); //no retorna contraseña

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Usuario actualizado',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error en updateUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

/*
    * DELETE eliminar usuario
    * delete /api/users/:id
    * roles:admin
    * query params:
        hardDelete= true eliminar permanentemente
        default soft delete desactivar

    el admin solo puede desactivar  otro admin
    retorna:
    * 200 usuario eliminado o desactivado
    * 403 sin permiso
    * 404 usuario no encontrado
    * 500 error de sv
*/

exports.deleteUser = async (req, res) => {
    try {
        const ishardDelete = req.query.ishardDelete === 'true';
        // solo administradores pueden eliminar/activar usuarios
        if (req.userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar usuarios'
            });
        }

        const userToDelete = await User.findById(req.params.id);

        if (userToDelete.role === 'admin' && req.userId.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'No puedes eliminar a otro administrador'
            });
        }
    
        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        if (ishardDelete) {
            //eliminar permanentemente
            await User.findByIdAndDelete(req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Usuario eliminado permanentemente'
            });
        }

        // soft delete: desactivar usuario
        userToDelete.active = false;
        await userToDelete.save();

        return res.status(200).json({
            success: true,
            message: 'Usuario desactivado'
        });
    } catch (error) {
        console.error('Error en deleteUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar/desactivar usuario',
            error: error.message
        });

    }
};

