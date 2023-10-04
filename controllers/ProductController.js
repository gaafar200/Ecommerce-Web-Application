const Product = require("../models/productModel");
const Rate = require("../models/rateModel")
const {isValidObjectId:isValidProductId,validateMongooseObjectId} = require("../utls/mongooseDBValidation");
const {handleErrors} = require("../utls/handleErrors");
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
        data = newProduct.toObject();
        data.totalRating = 0;
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
    let message = "";
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
        message = "Retreived all products successfully";
    }
    catch(error){
        errors.error = error.message;
        res.status(400);
    }
    res.json({errors,data,message});
}

const getSpecificProduct = async (req,res)=>{
    const {id} = req.params;
    let data = {};
    let errors = {};
    let message = "";
    if(isValidProductId(id)){
        try{
            const product = await Product.findById(id);
            if(!product){
                errors.error = "Product not found!"
                res.status(400);
            }
            else{
                data = product
                message = "Retrieved product successfully";
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
    res.json({errors,data,message});
}

const updateProduct = async (req,res)=>{    
    const {id} = req.params;
    let errors = {};
    let data = {};
    let message = ""
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
            if(!product){
                throw new Error("error: Product not found!");
            }
            data = product;
            message = "Product updated successfully";
        }
        catch(error){
            res.status(400);
            console.log(error.message);
            errors = handleErrors(error.message);
        }
    }
    else{
        errors.error = "invalid product id";
        res.status(400);
    }
    res.json({errors,data,message});
}

const deleteProduct = async (req,res)=>{
    const {id} = req.params;
    let errors = {};
    let data = {};
    let message = "";
    if(isValidProductId(id)){
        try{
            const product = await Product.findByIdAndDelete(id);
            if(product == null){
                errors.error = "Product has not been found";
                res.status(404);
            }
            else{
                data = product;
                message = "Product deleted Successfully";
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
    res.json({errors,data,message}); 
}

const rateAProduct = async (req,res)=>{ 
    let data = {};
    let errors = {};
    let message = "";
    const userId = req.user._id;
    const {id:productId} = req.params;
    const {rate,comment} = req.body
    try{
        validateMongooseObjectId(productId,'product');
        validateUserRate(rate);
        const product = await Product.findById(productId);
        if(!product){
            throw new Error("Invalid product id");
        }
        const userRate = await Rate.findOne({productId,postedBy:userId});
        let newAverageRate = 0;
        let newRatingsCount = 0;
        if(userRate){
            newAverageRate = recomputeAverageRate(product.averageRating,product.ratingsCount,rate,userRate.rate);
            console.log(newAverageRate);
            newRatingsCount = product.ratingsCount;
            userRate.rate = rate;
            userRate.comment = comment;
            userRate.save();
            message = "Rate updated successfully";
        }
        else{
            newAverageRate = computeAverageRate(product.averageRating,product.ratingsCount,rate);
            newRatingsCount = product.ratingsCount + 1;
            const newRateRecord = new Rate({
                rate,
                comment,
                productId,
                postedBy: userId
            })
            newRateRecord.save();
            message = "Rate submitted succssfully";
        }
        const newProduct = await Product.findByIdAndUpdate(productId,
            {
                averageRating: newAverageRate,
                ratingsCount: newRatingsCount,
            },
            {
                ruuValidators: true,
                new: true
            }
        );
        data = newProduct;
    }    
    catch(error){
        console.log(error.message);
        errors = handleErrors(error.message);
        res.status(400);
    }
    res.json({errors,data,message});  
}

/** Additional Functions */
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

const getProductById = async (id)=>{
    return await Product.findById(id);
}

const validateUserRate = (rate)=>{
    console.log(typeof rate);
    if(rate === undefined){
        throw new Error("rate: rate is required!");
    }
    else if(typeof rate !== 'number' || rate > 5 || rate < 0){
        throw new Error("rate: rate is invalid");
    }
    else{
        return true;
    }
}
const recomputeAverageRate = (oldAverageRate,oldRatingCount,newRate,oldRate)=>{
    return ((oldAverageRate * oldRatingCount - oldRate + newRate))/oldRatingCount;
}
const computeAverageRate = (oldAverageRate,oldRatingCount,newRate)=>{
    return (oldAverageRate * oldRatingCount + newRate)/(oldRatingCount + 1)
}

module.exports = {
    createProduct,
    getAllProducts,
    getSpecificProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    rateAProduct
}