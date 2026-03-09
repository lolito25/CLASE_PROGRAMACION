/**
 * cotrolador de sub categoria
 * maneja todas las operaciones (CRUD) relacionadas con las sub-categorias
 * estructura: una subcategoria depende de una categoria padre, una categoria puede tener varias subcategorias, una subcategoria puede tener varios productos
 * cuando una subcategoria se elimina los productos relacionados se desactivan
 * cuando se ejecuta en cascada soft delete se eliminan de manera permanente
 */

const Subcategory = require ('../models/Subcategory');
const Category = require('../models/Category');
/**
 * create: crear nueva sub-categoria
 * POST /api/subcategories
 * Auth bearer token requerido
 * Roles: admin y coordinador
 * body requerido:
 * name: nombre de la sub-categoria
 * descriprion: descripcion de la sub-categoria
 * retorna:
 * 201: sub-categoria creada en mongoDB    
 * 400: validacion fallida o nombre duplicando
 * 500: Error en bases de datos
 */
exports.createSubcategory = async (req, res) => {
    try{
        const { name, description, category } = req.body;

        //validar que la categoria padre exista
        const parentCategory = await Category.findById(category);
        if (!parentCategory){
            return res.status(404).json({
                success: false,
                message: 'La categoria no existe'
            });
        }
        //crear nueva categoria
        const newSubcategory = new Subcategory({
            name: name.trim(),
            description: description.trim(),
            category: category
        });

        await newSubcategory.save();

        res.status(201).json({
            success: true,
            message: 'Subcategoria creada',
            data: newSubcategory     
        });
    } catch (error){
        console.error('Error en createSubcategory:', error);
        //manejo de errores de indice unico 
        if(error.message.includes('duplicate key') || error.message.includes('ya existe')) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una sub-categoria con ese nombre'
            });
        }
         // Error generico del servidor
         res.status(500).json({
            success: false,
            message: ' Error al crear la subcategoria'
         });     
    }
};

/**
 * GET consultar listado de sub-categorias
 * GET /api/subcategories
 * por defecto retorna solo las sub-categorias activas
 * con includeInactive=true retorna todas las sub-categorias incluyendo las inactivas
 * Ordena por descendente por fecha de creacion
 * retorna: 
 * 200: lista de sub-categorias
 * 500: error de base de datos 
 */

exports.getSubcategories =async (req, res) => {
        try{
    //por defecto solo las subcategorias activas
    //IncludeInactive=true permite ver desactivadas
    const includeInactive = req.query.includeInactive === 'true';
    const activeFilter = includeInactive ? {} : {active: { $ne: false } };
    const subcategories = await Subcategory.find(activeFilter).populate('category','name');
    res.status(200).json({
        success: true,
        data: subcategories
    });
    } catch (error){
        console.error('Error en Subcategorias', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener subcategorias'
        });
    } 
};
/**
 * READ Obtener una subcategoria especifica por id
 * GET api/subategories/:id
 */
exports.getSubcategoryById =async (req, res) => {
        try{
    //por defecto solo las categorias activas
    //IncludeInactive=true permite ver desactivadas
    const subcategory = await Subcategory.findById(req.params.id).populate('category', 'name');
    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'sub-Categoria no encontrada'
        });
    }
    res.status(200).json({
        success: true,
        data: subcategory
    })
    } catch (error){
        console.error('Error en obtener subcategorias por id', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener sub-categorias por id',
        });
    } 
};
/**
 * UPDATE: Actualizar sub-categoria existente
 * PUT /api/sub-categories/:id
 * Auth bearer token requerido
 * roles: admin y coordinador
 * body 
 * name: nuevo nombre de la sub-categoria
 * description: nueva descripcion
 * validaciones
 * si quiere solo actualizar el nombre, solo la descipcion o ambos
 * Retorna:
 * 200: sub-Categoria actualizada
 * 400: Nombre duplicado 
 * 404: sub-Categoria no encontrada
 * 500: error en base de datos
 */
exports.updateSubcategory = async (req, res) => {
    try{
        const { name, description, category } = req.body;


        // Verificar si cambia la categoria padre

        if (category){
            const parentCategory = await Category.findById(category);
            if (!parentCategory){
                return res.status(400).json({
                    success: false,
                    message: 'la categoria no existe'
                });
             };
        }
        //construir objeto de actualizacion solo con campos enviados

        const updateSubcategory = await Subcategory.findByIdAndUpdate(
            req.params.id, 
            { 
                name: name ? name.trim() : undefined,
                description: description ? description.trim() : undefined, 
                category
            },
            {new: true, runValidators: true}
        );

        if (!updateSubcategory){
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            message: 'subcategoria actualizada exitozamente',
            data: updateSubcategory
        });
    } catch (error){
        console.error('Error en actualizar subcategoria', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la sub-categoria'
        });
    }
};

/**
 *Delete: eliminar o desactivar una sub-categoria
 Delete /api/sub-categories/:id
 Auth Bearer token requerido
 roles: admin
 query param:
 hardDelete=true elimina permanentemente de la base de datos
 Default: Soft delete (solo desactivar)
 Soft Delete: marca la sub-categoria como inactiva
 Desactiva en cascada todas las subcatgorias, productos relacionados
 al activar retorna todos los datos incluyendo los inactivos
 
 
 HARD Delete: elimina permanentemente la sub-categoria de la base de datos
 No se puede recuperar

 Retorna:
 200: sub-Categoria eliminada o desactivada
 404: sub-Categoria no encontrada
 500: Error de base de datos
 */

 exports.deleteCategory = async (req, res) => {
    try{
        const Product = require('../models/Product');
        const isHardDelete = req.query.hardDelete === 'true';

        //Buscar la subcategoria a eliminar
        const subcategory = await Subcategory.findById(req.params.id);
        if(!subcategory) {
            return res.status(404).json({
                success: false,
                message: 'Sub-categoria no encontrada'
            });
        }

        if(isHardDelete) {

            //eliminar en cascada sibcategorias y productos relacionados
            //paso 1 obtener IDs de todos los productos relacionados
                await Product.deleteMany({ category: req.params.id });
                //paso 2 eliminar la subcategoria
                await Subcategory.findByIdAndDelete(req.params.id);

                return res.status(200).json({
                    success: true,
                    message: 'Sub-categoria eliminada permanentemente y sus productos relacionados',
                    data: {
                        subcategory: subcategory
                    }
                });
        } else {
            //soft delete solo marcar como inactivo con cascada
            subcategory.active = false;
            await subcategory.save();
            //desactivar todas las subcategorias relacionadas
            const products = await Product.updateMany(
                { category: req.params.id},
                { active: false}
            );
            return res.status(200).json({
                success: true,
                message: 'Subcategoria desactivada exitosamente y sus productos asociados',
                data: {
                    subcategory: subcategory,
                    productsDeactivated: products.modifiedCount
                }
            });
        }
    } catch (error){
        console.error('Error al desactivar la subcategoria:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar la subcategoria',
            error: error.message
        });
    }
 };