const Blog = require("../models/blogModel");
const {isValidObjectId} = require("../utls/mongooseDBValidation")
const createBlog = async (req,res)=>{
    let errors = {};
    let data = {};
    let message = "";
    const {
        title,
        description,
        category,
        image
    } = req.body;
    try{
        const blog = new Blog({
            title,
            description,
            category,
            image
        });
        const newBlog = await blog.save();
        data = newBlog;
        message = "Blog have been added successfully";
    }
    catch(error){
        errors = handleAddNewBlogErrors(error.message);
    }
    res.json({errors,data,message});
}

const editBlog = async (req,res)=>{
    let errors = {};
    let data = {};
    let message = "";
    const dataToUpdate = {
        title: req?.body?.title,
        description: req?.body?.description,
        category: req?.body?.description,
        image: req?.body?.image
    }
    const {id} = req.params; 
    try{
        if(!id || !isValidObjectId(id)){
            throw new Error("Invalid blog id provided!");
        }
        const blog = await Blog.findById(id);
        if(!blog){
            throw new Error("Blog do not exists!");
        }
        const newBlog = await Blog.findByIdAndUpdate(id,dataToUpdate,{runValidators: true,new: true});
        data = newBlog;
        console.log(newBlog);
        message = "Blog updated successfully";
    }
    catch(error){
        console.log(error.message);
        errors = handleErrors(error.message);
        res.status(422);
    }
    res.json({errors,data,message});
        
}

/**Additional Functions */

const handleErrors = (error)=>{
    let errors = {};
    const errorMessages = error.split(', ');
    errorMessages.forEach((error)=>{
        if(error.indexOf(': ') === -1){
            errors.error = error;
        }
        else{
            const errorParts = error.split(': ');
            errors[errorParts[0]] = errorParts[1];
        }
    })
    return errors;
}

const handleAddNewBlogErrors = (error)=>{
    const errorMessageStart = "Blog validation failed: ";
    const usfualErrorMessage = error.replace(new RegExp(`^${errorMessageStart}`), '');
    return handleErrors(usfualErrorMessage);
}

module.exports = {
    createBlog,
    editBlog,

}