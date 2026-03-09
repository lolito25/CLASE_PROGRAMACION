/**
 * Modelo de categoria MONGODB
 * Define la estructura de la categoria
 */

const mongoose =require('mongoose');

//Campos de categoria

const categorySchema = new mongoose.Schema({
    //nombre de la categoria unico y requerido
    name:{
        type: String,
        require: [true, 'El nombre es obligatorio'],
        unique: true,
        trim: true // eliminar espacion al inicio y final
    },

    //Descripcion de la categoria - requerida
    description: {
            type: String,
            require: [true, 'La descripcion es requerida'],
            trim: true
    },

    //Active, desactiva la categoria pero no la elimina
    active: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true, // agrega createdAt y updateAt automaticamente
    versinoKey: false, // no incluir campos __V
});

/**
 * MIDDLEWARE PRE-SAVE
 * Limpia indices duplicados
 * Mongodb aveces crea multiples indices con el mismo nombre
 * esto causa conflictos al intentar dropIndex o recrear indices
 * este middleware limpia los indices problematicos
 * proceso
 * 1 obtiene una lista de todos los indices de la coleccion
 * 2 busca si existe el indice con nombre name_1 (antiguo o duplicado)
 * si existe lo elimina antes de nuevas operaciones
 * ignora errores si el indice no existe
 * continua con el guardado normal
 */
categorySchema.pre('save', async function(next){
    try{
        //obtener referencia de la coleecion de mongoDB 
        const collection = this.contructor.collection
        //obtener lista de todos los indices
        const indexes = await collection.indexes();

        //Buscar di existe indice problematico nombre "name_1"
        //(del orden: 1 significado ascendente)
        const problematicIndex = indexes.find(index => index.name === 'name_1');
        
        //si lo encuentra, eliminarlo
        if (problematicIndex){
            await collection.dropIndex('name_1');
        }
    } catch (err) {
        //si el error es Index no found, no es problema - continuar
        //Si es otro error pasarlo al siguiente middleware
        if(!err.message.includes('Index no found')){
            return next(err);
        }
    }
    // Continuar con el guardado
    next();
});

/**
 * crear indice unico
 * 
 * mongo rechazara cualquier intento de insertar o actualizar un documento con un valor de name ya que exista
 * aumenta la velocidad de las busquedas
 */

categorySchema.index({name: 1},{
    unique: true,
    name: 'name_1' // nombre explicito para evitar conflictos
});

//exportar el modelo
module.exports = mongoose.model('Category', categorySchema);