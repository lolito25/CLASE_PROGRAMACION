/**
 * controlador de categorias
 * maneja todas las opreaciones (CRUD) relacionadas con categorias
 */

const Category = require ('../models/Category');
const Subcategory = require('../models/Subcategory');
/**
 * create: crear nueva categoria
 * POST /api/categories
 * Auth bearer token requerido
 * Roles: admin y coordinador
 * body requerido:
 * name: nombre de la categoria
 * descriprion: descripcion de la categoria
 * retorna:
 * 201: categoria creada en mongoDB    
 * 400: validacion fallida o nombre duplicando
 * 500: Error en bases de datos
 */
exports.createCategory = async (req, res) => {
    try{
        const { name, description } = req.body;
        //validacion de los campos de entrada
        if(!name || typeof name !== 'string' || name.trim() === ''){
            return res.status(400).json({
                success: false,
                message: 'El nombre es obligatorio, debe ser texto valido'
            });
        }
            if(!description || typeof description !== 'string' || description.trim() === ''){
            return res.status(400).json({
                success: false,
                message: 'La descripcion es obligatoria y debe ser texto valido'
            });    
        }

        //limpiar espacion en blanco
        const trimmedName = name.trim();
        const trimmedDesc = description.trim();

        //verificar si ya existe una categoria con el mismo nombre
        const existingCategory = await Category.findOne({ name: trimmedName});
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una vategoria con ese nombre'
            });
        }

        //crear nueva categoria
        const newCategory = new Category({
            name: trimmedName,
            description: trimmedDesc
        });

        await newCategory.save();

        res.status(201).json({
            success: true,
            message: 'Categoria creada',
            data: newCategory     
        });
    } catch (error){
        console.error('Error en createCategory:', error);
        //manejo de errores de indice unico 
        if(error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una categoria con ese nombre'
            });
        }
         // Error generico del servidor
         res.status(500).json({
            success: false,
            message: ' Error al crear categoria',
            error: error.message
         });     
    }
};

/**
 * GET consultar listado de cateforias
 * GET /api/categories
 * por defecto retorna solo las categorias activas
 * con includeInactive=true retorna todas las categorias incluyendo las inactivas
 * Ordena por descendente por fecha de creacion
 * retorna: 
 * 200: lista de categorias
 * 500: error de base de datos 
 */

exports.getCategories =async (req, res) => {
        try{
    //por defecto solo las categorias activas
    //IncludeInactive=true permite ver desactivadas
    const includeInactive = req.query.includeInactive === 'true';
    const activeFilter = includeInactive ? {} : {active: { $ne: false } };
    const categories = await Category.find(activeFilter).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        data: categories
    });
    } catch (error){
        console.error('Error en getCategorias', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias',
            error: error.message
        });
    } 
};
/**
 * READ Obtener una categoria especifica por id
 * GET api/Categories/:id
 */
exports.getCategoryById =async (req, res) => {
        try{
    //por defecto solo las categorias activas
    //IncludeInactive=true permite ver desactivadas
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Categoria no encontrada'
        });
    }
    res.status(200).json({
        success: true,
        data: category
    })
    } catch (error){
        console.error('Error en getCategoryById', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias',
            error: error.message
        });
    } 
};
/**
 * UPDATE: Actualizar categoria existente
 * PUT /api/categories/:id
 * Auth bearer token requerido
 * roles: admin y coordinador
 * body 
 * name: nuevo nombre de la categoria
 * description: nueva descripcion
 * validaciones
 * si quiere solo actualizar el nombre, solo la descipcion o ambos
 * Retorna:
 * 200: Categoria actualizada
 * 400: Nombre duplicado 
 * 404: Categoria no encontrada
 * 500: error en base de datos
 */
exports.updateCategory = async (req, res) => {
    try{
        const { name, description } = req.body;
        const updateData = {};

        // solo actualizar campos que fueron enviados

        if (name){
            updateData.name = name.trim();

            //verificar si el nuevo nombre ua existe en otra categoria

            const existing = await Category.findOne({
                name: updateData.name,
                _id: { $ne: req.params.id} // asegura que el nombre no sea el mismo id

            });

        if(existing) {
             return res.status(400).json({
                    success: false,
                    message: 'Este nombre ya existe'
                });
            }
        }
        if (description){
            updateData.description = description.trim();
        }

        //actualizar la categoria en la base de datos

        const updateCategory = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updateCategory){
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Categoria actualizada exitozamente',
            data: updateCategory
        });
    } catch (error){
        console.error('Error en updateCategory', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la categoria',
            error: error.message
        });
    }
};

/**
 *Delete: eliminar o desactivar una categoria
 Delete /api/categories/:id
 Auth Bearer token requerido
 roles: admin
 query param:
 hardDelete=true elimina permanentemente de la base de datos
 Default: Soft delete (solo desactivar)
 Soft Delete: marca la categoria como inactiva
 Desactiva en cascada todas las subcatgorias, productos relacionados
 al activar retorna todos los datos incluyendo los inactivos
 
 
 HARD Delete: elimina permanentemente la categoria de la base de datos
 Elimina en cascada la categoria, subcategorias, y productos relacionados
 No se puede recuperar

 Retorna:
 200: Categoria eliminada o desactivada
 404: Categoria no encontrada
 500: Error de base de datos
 */

 exports.deleteCategory = async (req, res) => {
    try{
        const SubCategory = require('../models/Subcategory');
        const Product = require('../models/Product');
        const isHardDelete = req.query.hardDelete === 'true';

        //Buscar la categoria a eliminar
        const category = await Category.findById(req.params.id);
        if(!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        if(isHardDelete) {

            //eliminar en cascada sibcategorias y productos relacionados
            //paso 1 obtener IDs de todas las subcategorias relacionadas
            const subIds = (await Subcategory.find({
                category: req.params.id })).map(s => s._id);
                //paso 2 para eliminar todos productos
                await Product.deleteMany({ category: req.params.id });
                //paso 3 eliminar todos de subcategoria
                await subcategory.deleteMany({ SubCategory:{ $in: subIds} } );
                //paso 4 eliminar todas las subcategorias de esta categoria
                await SubCategory.deleteMany({ category: req.params.id });
                // paso 5 eliminar la categoria misma
                await Category.findByIdAndDelete(req.params.id);

                res.status(200).json({
                    success: true,
                    message: 'Categoria eliminada permanentemente y sus subcategorias y sus productos relacionados',
                    data: {
                        category: category
                    }
                });
        } else {
            //soft delete solo marcar como inactivo con cascada
            category.active = false;
            await category.save();
            
            //desactivar todas las subcategorias
            const subcategories = await Subcategory.updateMany(
                { category: req.params.id },
                { active: false}
            );

            //desactivar todos los productos relacionados por la categoria y subcategoria
            const products = await Product.updateMany(
                { category: req.params.id},
                { active: false}
            );

            res.status(200).json({
                success: true,
                message: 'Categoria desactivada exitosamente y sus subcategorias y productos asociados',
                data: {
                    category: category,
                    subcategoriesDeactivated: subcategories.modifiedCount,
                    productsDeactivated: products.modifiedCount
                }
            });
        }
    } catch (error){
        console.error('Error en deleteCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar la categoria',
            error: error.message
        });
    }
 };