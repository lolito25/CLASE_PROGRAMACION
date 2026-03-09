/**
 * productos requiere 3 modelos de relación principal (NAME,DESCRIPCION, PRECIOS, 2 RELACIONES)
 * los productos solo los modifican el admin (username o email), auxiliar solo puede consultar por id mas no modificarlos
 */

const Product = require('../models/Product');
const Categories = require ('../models/Category');
const SubCategory = require ('../models/Subcategory');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');

/**
 * create: crear nuevo producto
 * POST /api/categories
 * Auth bearer token requerido
 * Roles: admin y coordinador
 * body requerido:
 * name: nombre del producto
 * descriprion: descripcion del producto
 * retorna:
 * 201: producto creado en mongoDB    
 * 400: validacion fallida o nombre duplicando
 * 500: Error en bases de datos
 */

exports.createProduct = async (req, res) => {
    try{
        const { name, description, price, stock, category, subcategory } = req.body;
        //validacion de los campos de entrada
    if(!name || !description || !price || !stock || !category || !subcategory){
        return res.status(400).json({
            success: false,
            message: 'todos los campos son obligatorios',
            requiredFields: ['name', 'description','price','stock','category','subcategory']
        });
        }

        //validar que la categoria existe
        const categoryExist = await Category.findById(category);
        if(!categoryExist){
            return res.status(404).json({
                success: false,
                message: 'la categoria solicitada no existe',
                categoryId: category
            });
        }
        //validar que la subcategoria existe y pertenece a la categoria especificada
        const subcategoryExist = await Subcategory.findOne({
            _id: subcategory,
            category: category
        });
        if (!subcategoryExist){
            return res.status(400).json({
                success: false,
                message: 'la subcategoria no existe o no pertenece a la categoria especificada'
            });
        }
        // ===== CREAR PRODUCTO ======  

            const product = new Product({
                name,
                description,
                price,
                stock,
                category,
                subcategory
            });

            //si hay usuario autenticado, registrar quien creo el producto
            if (req.user && req.user._id){
                product.createdBy = req.user._id;
            }
            //guardar en base de datos
            const savedProduct = await product.save();

            //obtener producto poblado con datos de relaciones (populate)
            const productWithDetails = await Product.findById(savedProduct._id)
                .populate('category', 'name')
                .populate('subcategory', 'name')
                .populate('createdBy', 'username email');

                return res.status(201).json({
                    success: true,
                    message: 'Producto creado exitosamente',
                    data: productWithDetails
                });
        } catch (error){
            console.error('Error en createProduct: ', error);

            //manejar error de duplicado (campo unico)
            if(error.code === 11000){
                return res.status(400).json({
                    success: false,
                    message: 'ya existe un producto con ese nombre'
                });
            }
            res.status(500).json({
                success: false,
                message: 'error al crear producto',
                error: error.message
            });
        }       
    };

    /**
     * READ: Obtener productos (con filtro de activos/inactivos)
     * 
     * GET /api/products
     * query params:
     *      - includeInactive=true: mostrar tambien productos desactivados
     *      - Default: Solo productos activos (aactive: true)
     * 
     * retorna: array de productos poblados con categoria y subcategoria
     */
    exports.getProducts =async (req, res) =>{
        try {
            // Determinar si incluir productos inactivos
            const includeInactive = req.query.includeInactive === 'true';
            const activeFilter = includeInactive ? {} : { active: { $ne: false} };

            //obtener productos con datos relacionados
            const products = await Product.find(activeFilter)
                .populate('category', 'name')
                .populate('subcategory', 'name')
                .sort({ createdAt: -1});

                // si el usuario es auxiliar, no mostrar informacion de quien lo creo
                if (req.use && req.user.role === 'auxiliar'){
                    //Ocultar campo createdBy para usuarios auxiliares

                    products.forEach(product => {
                        product.createdBy = undefined;
                    });
                }

                res.status(200).json({
                    success: true,
                    count: products.lenght,
                    data: products
                });
        } catch (error){
            console.error('Error en getProducts ', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos',
                error: error.message
            });
        }
    };
    /**
     * READ: Obtener un producto especifico por ID
     * 
     * GET /api/products/:id
     * 
     * retorna: producto poblado con categoria y subcategoria
     */
    exports.getProductById = async (req, res) => {
        try{
            const product = await Product.findById(req.params.id)
                .populate('category', 'name description')
                .populate('subcategory', 'name description');

                if(!product) {
                    return res.status(404).json({
                        success: false,
                        message: 'Producto no encontrado'
                    });
                }

                //ocultar createdBy para usuarios auxiliares
                if (req.user && req.user.role === 'auxiliar') {
                    product.createdBy = undefined;
                }

                res.status(200).json({
                    success: true,
                    data: product
                });
        } catch (error) {
            console.error ('Error en getPorcutById ', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener producto',
                error: error.message
            });
        }
    };

    /**
     * UPDATE: Actualizar un producto
     * 
     * PUT /api/products/:id
     * Body: { cualquier campo a actualizar}
     * 
     *  - Solo actualiza campos enviados
     *  - Valida relaciones si se envian category o subcategory
     *  - Retoma producto actualizado
     */

    exports.updateProduct = async (req, res ) => {
        try{
            const {name, description, price, stock, category, subcategory } = req.body;
            const updateData = {};

            //agregar solo los campos que fueron enviados
            if (name) updateData.name = name;
            if (description) updateData.description = description;
            if (price) updateData.price = price;
            if (stock) updateData.stock = stock;
            if (category) updateData.category = category;
            if (subcategory) updateData.subcategory = subcategory;

            //validar relaciones si se actualizan
            if(category || subcategory ){
                if(category) {
                    const categoryExist = await Category.findById(category);
                    if(!categoryExist) {
                        return res.status(404).json({
                            success: false,
                            message: 'la categoria solicitada no existe'
                        });
                    }
                }
                if(subcategory){
                    const subcategoryExist = await Subcategory.findOne({
                        _id: subcategory,
                        category: category || updateData.category
                    });
                    if (!subcategoryExist) {
                        return res.status(404).json({
                            success: false,
                            message: 'La subcategoria no existe o no pertenece a la categoria'
                        });
                    }
                }
            }

            //actualizar producto en BD
            const updateProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
                new: true,
                runValidators: true
            }).populate('category', 'name')
              .populate('subcategory', 'name')
              .populate('createdBy', 'username email');

            if (!updateProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'producto no encontrado'
                });
            }

           res.status(200).json({
            success: true,
            message: 'Producto actualizado correctamente',
            data: updateProduct
        });

    } catch (error) { // <-- CORRECCIÓN: Aquí está el catch que faltaba
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: error.message
        });
      }  
    };

    /**
     * DELETE: Eliminar o desactivar un producto
     * 
     * DELETE /api/products/:id
     * Query params:
     * 
     *  - hardDelete=true : Eliminar permanentemente de la BD
     *  - Default: Soft delete (marcar como inactivo)
     * 
     * SOFT DELETE: Solo marca active: false
     * HARD DELETE: Elimina permanentemente el documento
     */

    exports.deleteProduct = async (req, res ) => {
        try{
            const isHardDelete = req.query.isHardDelete === 'true';
            const product = await Product.findById(req.params.id);

            if(!product){
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            if (isHardDelete) {
                //======== HARD DELETE: Eliminar permanentemente de la BD =======
                await Product.findByIdAndDelete(req.params.id);
                res.status(200).json({
                    success: true,
                    message: 'Producto eliminado permanentemente de la base de datos',
                    data: product
                });
            } else {
                // ============= SOFT DELETE: Solo marcar como inactivo ======
                product.active = false;
                await product.save();
                res.status(200).json({
                    success: true,
                    message: 'Producto desactivado exitosamente (soft delete)',
                    data: product
                });
            }
        } catch (error) {
            console.error('Error en deleteProduct ', error)
            res.status(500).json({
                success: false,
                message: 'error al eliminar producto',
                error: error.message
            });
        }
    };
