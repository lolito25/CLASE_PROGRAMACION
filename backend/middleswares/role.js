/*
middleware control de roles de usuario

sirve para verificar que el usuario autenticado tiene permisos necesarios para acceder a una ruta especifica

funcion factory checkRole() permite especificar los roles permitidos 

funcion Helper para roles especificos isAdmin, isCdoordinador, isAuxiliar

requiere que verifyToken se haya ejecutado primero 

verifica que req.userRole exista
compara req.userRole contra lista de roles permitidos

si esta lista continua
si no esta en la lista restona 403  Forbidden con mensaje descriptivo
si no existe userRole retorna 401 (token corructo)

uso :
checkRole('admin') solo admin
checkRole('admin', 'coordinador', 'auxiliar') todos con permisos

roles del sistema:
admin acceso total
coordinador  no puede eliminar ni gestionar usuarios
auxiliar acceso limitado a tareas especificas
*/

/*
factory funtion checkRole
retorna middleware que verifica si el usuario tiene uno de los roles permitidos
// @param(...string) allowedRoles - roles permitidos en el sistema
// @returns {function} middleware de express

*/

const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        //verificar que el usuario fue atenticado y verifyToken ejecutado
        //req, userRole es establecido por verifyToken middleware
        if (!req.userRole) {
            return res.status(401).json({
                success:false,
                message: 'token invalido'

            });
        }
        //verificar si el rol del usuario está en la lista de roles permitidos
        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                success:false,
                message: `Prermisos insuficientes se requiere ${allowedRoles.join(" o ")}`
            });
        }
        next(); //continuar con la ejecución de la ruta si el rol es válido
   }  
};

//funciones helper para roles especificos
//verifica que el usuario es admin
//uso: router.delete('/admin-only'. verifyToken, isAdmin, controller.method)

const isAdmin = (req, res, next) =>{
    return checkRole('admin')(req,res,next)
};

//verificar si el usuario es coordinador
const isCoordinador = (req,res,next) =>{
    return checkRole('coordinador')(req,res,next)
}

//verificar si el usuario es auxiliar
const isAuxiliar = (req,res,next) =>{
    return checkRole('auxiliar')(req,res,next)
}

//modulo a exportar
module.exports = {
    checkRole,
    isAdmin,
    isCoordinador,
    isAuxiliar
}
