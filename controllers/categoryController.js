const Category = require("../models/CategoryModel");
const handleErrorUtitlties = require("../utls/handleErrors");
const {validateMongooseObjectId} = require("../utls/mongooseDBValidation");
const createCategory = async (req,res)=>{
    let data = {};
    let errors = {};
    let message = "";
    const {title,type} = req.body;
    try{
        const category = new Category({title,type});
        const newCategory = await category.save();
        data = newCategory;
        message = "Product category created successfully";
    }
    catch(error){
        errors = handleCategoryErrorMessage(error);
        res.status(400);
    }
    res.json({errors,data,message});
}

const editCategory = async (req,res)=>{
    let data = {};
    let errors = {};
    let message = "";
    const {id} = req.params;
    const editData = {
        title: req?.body?.title,
    };
    try{
        validateMongooseObjectId(id,'category');
        const newCategory = await Category.findByIdAndUpdate(id,editData,{runValidators: true,new : true});
        data = newCategory;
        message = "Product Category Updated Successfully";
    }
    catch(error){
        console.log(error);
        errors = handleCategoryErrorMessage(error);
        res.status(422);
    }
    res.json({errors,data,message});
}

const getAllBrands = async (req,res)=>{
    let errors = {};
    let data = {};
    let message = "";
    try{
        data = await getAllCategoriesOfOneType('brand');
        console.log(data);
        message = "retrevied all brands successfully";
    }
    catch(error){
        errors = handleCategoryErrorMessage(error);
        res.status(422);
    }
    res.json({errors,data,message});
}

const getAllProductCategories = async (req,res)=>{
    let errors = {};
    let data = {};
    let message = "";
    try{
        data = await getAllCategoriesOfOneType('product');
        message = "retrevied all product categories successfully";
    }
    catch(error){
        errors = await handleCategoryErrorMessage(error);
        res.status(422);
    }
    res.json({errors,data,message});
}  

const getAllBlogCategories = async (req,res)=>{
    let errors = {};
    let data = {};
    let message = "";
    try{
        data = await getAllCategoriesOfOneType('blog');
        message = "retrevied all blog categories successfully";
    }
    catch(error){
        errors = handleCategoryErrorMessage(error);
        res.status(422);
    }
    res.json({errors,data,message});
}

const getACategorty = async (req,res)=>{
    const {id} = req.params;
    let data = {};
    let errors = {};
    let message = "";
    try{
        validateMongooseObjectId(id,'category');
        const category = await Category.findById(id);
        if(!category){
            throw new Error("No Category Found!");
        }
        data = category;
        message = "Category has been retreived";
    }
    catch(error){
        res.status(400);
        errors.error = handleCategoryErrorMessage(error);
    }
    res.json({data,errors,message});
}

const deleteACategory = async(req,res)=>{
    let data = {};
    let errors = {};
    let message = "";
    const {id} = req.params;
    try{    
        validateMongooseObjectId(id,'Category');
        const category = await Category.findByIdAndDelete(id);
        if(!category){
            throw new Error("Category Not Found!!");
        }
        data = category;
        message = "Category deleted Successfully";
    }
    catch(error){
        res.status(400);
        errors = handleCategoryErrorMessage(error);
    }
    res.json({errors,data,message});
}

/** addtional functions */
const handleCategoryErrorMessage = (error)=>{
    let errors = {};
    if(error.code === 11000){
        errors.title = "Category title must be unique";
    }
    else{
        const messageStart = "Category validation failed: ";
        const usfualErrorMessage = handleErrorUtitlties.removeErrorMessageStart(error.message,messageStart);
        errors = handleErrorUtitlties.handleErrors(usfualErrorMessage);
    }
    return errors;
}


const getAllCategoriesOfOneType = (CATEGORY_TYPE)=>{
    return new Promise(async (resolve,reject)=>{
        try{
            resolve(await Category.find({type:CATEGORY_TYPE}));
        }
        catch(error){
            reject(error);
        } 
    })
}



module.exports = {
    createCategory,
    editCategory,
    getAllBrands,
    getAllProductCategories,
    getAllBlogCategories,
    getACategorty,
    deleteACategory,
};

