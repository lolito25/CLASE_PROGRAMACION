/**
 * Modelo de subcategoria MONGODB
 * Define la estructura de la subcategoria
 * la subcategoria depende de una categoria
 * muchos productos pueden perteneces a una subcategoria
 * muchas subcategorias dependen de una sola categoria
 */

const mongoose =require('mongoose');

//Campos de subcategoria

const subcategorySchema = new mongoose.Schema({
    //nombre de la subcategoria unico y requerido
    name:{
        type: String,
        require: [true, 'El nombre es obligatorio'],
        unique: true, // no pueden haber dos subcategorias con el mismo nombre
        trim: true // eliminar espacion al inicio y final
    },
    
    //Descripcion de la subcategoria - requerida
    description: {
            type: String,
            require: [true, 'La descripcion es requerida'],
            trim: true
    },
    
    //Categoria padre, esta subcategoria pertenece a una categoria 
    //relacion 1 - muchos. Una categoria puede tener muchas subcategorias

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // puede ser poblado con .populate ('category')
        required: [true, 'La categoria es requerida']
    },

    //Active, desactiva la subcategoria pero no la elimina
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
subcategorySchema.post('save', function(error, doc, next) {
        //veruficar si es error de mongoDB por violacion de indice unico
    if (error.name === 'MongoServerError' && error.code === 1000){
            next(new Error('Ya existe una subcategoria con ese nombre'));
        
    } else {
    // pasar el error tal como es
    next(error);
    }
});

/**
 * crear indice unico
 * 
 * mongo rechazara cualquier intento de insertar o actualizar un documento con un valor de name ya que exista
 * aumenta la velocidad de las busquedas
 */

//exportar el modelo
module.exports = mongoose.model('Subcategory', subcategorySchema);