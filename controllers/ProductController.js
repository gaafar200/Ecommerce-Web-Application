const Product = require("../models/productModel");
const isValidProductId = require("../utls/mongooseDBValidation");
const slugify = require("slugify");
const createProduct = async(req,res)=>{
    let data = {};
    let errors = {};

    const {
        title,
        description,
        price,
        quantity,
        color,
        brand,
        category
    } = req.body;
    try{
        const slug = await createSlug(title);
        const product = new Product({
            title,
            slug,
            description,
            price,
            quantity,
            color,
            brand,
            category,
        });
        const newProduct = await product.save();
        data = newProduct;
    }
    catch(error){
        console.log(error.message);
        errors = handleErrors(error.message);
    }
    res.json({errors,data});
}

const getAllProducts = async (req,res)=>{
    let data = {};
    let errors = {};
    //Filitering
    let queryParams = {...req.query};
    const excludedParams = ['sort','page','limit','fields'];
    excludedParams.forEach((param)=> delete queryParams[param]);
    let queryString = JSON.stringify(queryParams);
    queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g,(match)=> `$${match}`);

    //Sorting
    let sortBy;
    if(req.query.sort){
        sortBy = req.query.sort.split(",").join(" ");
    }
    else{
        sortBy = "-createdAt"
    }

    //pagination
    const limit = req.query.limit ? req.query.limit : 25;
    const page = req.query.page ? req.query.page : 1;
    const skip = (page -  1) * limit;
    try{
        const products = await Product.find(JSON.parse(queryString)).sort(sortBy).limit(limit).skip(skip);
        data = products;
    }
    catch(error){
        errors.error = error.message;
        res.status(400);
    }
    res.json({errors,data});
}

const getSpecificProduct = async (req,res)=>{
    const {id} = req.params;
    let data = {};
    let errors = {};
    if(isValidProductId(id)){
        try{
            const product = await Product.findById(id);
            if(product === null){
                errors.error = "user not found"
                res.status(400);
            }
            else{
                data = product;
            }
        }   
        catch(error){
            errors.error = error.message;
        }
    }
    else{
        errors.error = "Product id is not valid";
        res.status(400);
    }
    res.json({errors,data});
}

const updateProduct = async (req,res)=>{    
    const {id} = req.params;
    let errors = {};
    let data = {};
    if(isValidProductId(id)){
        try{
            const editData = {
                title: req?.body?.title,
                description: req?.body?.description,
                price: req?.body?.price,
                quantity: req?.body?.quantity,
                color: req?.body?.color,
                brand: req?.body?.brand,
                category: req?.body?.category
            }
            if(editData.title){
                editData.slug = await createSlug(editData.title);
            }
            const product = await Product.findByIdAndUpdate(id,editData,{new:true,runValidators:true});
            data = product;
        }
        catch(error){
            console.log(error.message);
            errors = handleErrors(error.message);
        }
    }
    else{
        errors.error = "invalid product id";
        res.status(400);
    }
    res.json({errors,data});
}

const deleteProduct = async (req,res)=>{
    const {id} = req.params;
    let errors = {};
    let data = {};
    if(isValidProductId(id)){
        try{
            const product = await Product.findByIdAndDelete(id);
            if(product == null){
                errors.error = "Product has not been found";
                res.status(404);
            }
            else{
                data = product;
            }
        }
        catch(e){
            errors.error = e.message;
            res.status(400);
        }
    }   
    else{
        errors.error = "invalid product id";
        res.status(400);
    }
    res.json({errors,data}) 
}


/** Additional Functions */
const handleErrors = (message)=>{
    let errors = {};
    const errorParts = message.split(',');
    let colonIndex = errorParts[0].indexOf(':');
    errorParts[0] = errorParts[0].substring(colonIndex + 1).trim();
    errorParts.forEach((err)=>{
        colonIndex = err.indexOf(":");
        let key = err.substring(0,colonIndex).trim();
        let value = err.substring(colonIndex + 1).trim();
        errors[key] = value;
    });
    return errors;
}

const createSlug = async (title)=>{
    if(title === undefined){
        throw new Error("Error: title: Product must have a title");
    }
    else{
        slug = slugify(title);
        let product = await Product.find({slug});
        while(product){
            const min = 111;
            const max = 999;
            const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
            slug += String(randomNumber);
            product = await Product.findOne({slug});
        }
        return slug;
    }
}

module.exports = {
    createProduct,
    getAllProducts,
    getSpecificProduct,
    updateProduct,
    deleteProduct
}