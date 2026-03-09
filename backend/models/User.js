// modelo de usuario
/* define la estructura de base de datos para los usuarios
encripta la contraseña
manejo de roles, (admin, coordinador, auxiliar)
*/

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//estructura de la base de datos para los usuarios

const userSchema = new mongoose.Schema({
    //El nombre de usuario debe ser unico en toda la BD
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true //elimina los espacios en blanco al inicio y al final 
    },
    //Email debe ser unico valido en minusculas
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,// convierte a minusculas
        trim: true,//elimina los espacions
        match: [/\S+@\S+\.\S+/, 'El correo no es valido'] // valida el patron del email
    },
    //contraseña - requerida, minimo 4 caracteres
    password: {
        type: String,
        required: true,
        minlength: 4,
        select: false // no incluir en resultados por defecto
    },
    //rol de usuario restringe valores especificos
    role:{
        type: String,
        enum: ['admin', 'coordinador', 'auxiliar'], // valores permitidos
        default: 'auxiliar' // rol por defecto, los usuarios nuevos son auxiliar
    },
    //usuarios activos
    active: {
        type: Boolean,
        default: true // nuevos usuarios comienzan activos
    },
}, {
 timestamps: true, // agrega createdAt y updatedAt automaticamente
 versionKey: false //no incluir _v en el control de versiones de mongoose
});

    //Middleware encripta la contraseña antes de guardar el usuario
    userSchema.pre('save', async function(next) {
    //si el passwor no fue modificado ni encripta el nuevo
    if(!this.isModified('password')) return next();

    try{
        //generar slat con complejidad de 10 rondas
        //mayor numero de rondas = mas seguro pero es mas lento
        const slat = await bcrypt.genSalt (10);
        
        //encriptar el password  con el salt generado
        this.password = await bcrypt.hash(this.password, slat);

        //continuar con el guardado normal
        next();
    } catch (error){
        // si hay error en la encriptacion pasar error al siguiente middleware
        next(error);
    }
    });

    //crear y exportar el modulo de usuario

    module.exports = mongoose.model('User', userSchema);
