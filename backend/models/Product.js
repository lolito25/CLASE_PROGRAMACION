/**
 * modelo de producto MONGODB
 * Define la estructura del producto
 * el producto depende de una subcategoria depende de una categoria
 * muchos productos pueden pertenecer a una subcategoria 
 * tiene relacion un user para ver quien creo el producto
 * soporte de imagenes (array de url)
 * validacion de valores numericos (no negativos)
 */

const mongoose =require('mongoose');

    //campos de la tabla producto
    
const productSchema = new mongoose.Schema({
    //nombre del producto unico y requerido
    name:{
        type: String,
        require: [true, 'El nombre es obligatorio'],
        unique: true, // no pueden haber dos productos con el mismo nombre
        trim: true // eliminar espacion al inicio y final
    },
    
    //Descripcion del producto - requerida
    description: {
        type: String,
        require: [true, 'La descripcion es requerida'],
        trim: true
    },
    
    
    //Precio en unidades monetarias
    //No puede ser negativo
    price: {
        type: Number,
        require: [true, 'El precio es obligatorio'],
        min:[0, 'El precio no puede ser negativo']
    },

    // cantidad de stock
    //no puede ser negativo
    stock: {
        type: Number,
        require: [true, 'El stock es obligatorio'],
        min:[0, 'El stock no puede ser negativo']
    },

    //Categoria padre, esta producto pertenece a una categoria 
    //relacion 1 - muchos. Una categoria puede tener muchas productos
    //un producto pertenece a una subcategoria pero una subcategoria puede tener muchos productos relacion 1 a muchos
    

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // puede ser poblado con .populate ('category')
        required: [true, 'La categoria es requerida']
    },

     subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory', // puede ser poblado con .populate ('subcategory')
        required: [true, 'La subcategoria es requerida']
    },

    // quien creo el producto 
    //referencia de User no requerido
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' //puede ser poblado para mostrar los usuarios
    },

    //Array de urls de imagenes de productos
    images: [{
        type: String, //url de la imagen
    }],

    //Active, desactiva el producto pero no la elimina
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
productSchema.post('save', function(error, doc, next) {
        //verificar si es error de mongoDB por violacion de indice unico
    if (error.name === 'MongoServerError' && error.code === 11000){
            return next(new Error('Ya existe un producto con ese nombre'));  
    } 
    // pasar el error tal como es
    next(error);
});

/**
 * crear indice unico
 * 
 * mongo rechazara cualquier intento de insertar o actualizar un documento con un valor de name ya que exista
 * aumenta la velocidad de las busquedas
 */

//exportar el modelo
module.exports = mongoose.model('Product', productSchema);

