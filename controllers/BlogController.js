const Blog = require("../models/blogModel");
const {validateMongooseObjectId} = require("../utls/mongooseDBValidation");
const handleErrorUtitlties = require("../utls/handleErrors");

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
        category: req?.body?.category,
        image: req?.body?.image
    }
    const {id} = req.params; 
    try{
        validateMongooseObjectId(id,'blog');
        const blog = await checkBlogExistsAndRetreive(id);
        const newBlog = await Blog.findByIdAndUpdate(id,dataToUpdate,{runValidators: true,new: true});
        data = newBlog;
        console.log(newBlog);
        message = "Blog updated successfully";
    }
    catch(error){
        console.log(error.message);
        errors = handleEditBlogErrorMesage(error.message);
        res.status(422);
    }
    res.json({errors,data,message});    
}

const getBlog = async (req,res)=>{
    let data = {};
    let errors = {};
    let message = "";
    const {id} = req.params;
    try{
        validateMongooseObjectId(id,'blog');
        const blog = await Blog.findByIdAndUpdate(id,{$inc: {numViews : 1}}
        ,{new: true,runValidators: true})
        .populate('likes').populate('dislikes');
        if(!blog){
            throw new Error("Blog doesn't exists");
        }
        data = blog;
        message = "Retrevied blog object successfully";
    }
    catch(error){
        errors.error = error.message;
        res.status(422);
    }
    res.json({errors,data,message});
}

const getAllBlogs = async (req,res)=>{
    let data = {};
    let errors = {};
    let message = "";
    try{
        const blogs = await Blog.find()
        .populate('likes').populate('dislikes');
        data = blogs;
        message = "Retreived all blogs successfully";
    }
    catch(error){
        errors.error = error.message;
        res.status(422);
    }
    res.json({errors,data,message});
}

const deleteABlog = async (req,res)=>{
    let errors = {};
    let data = {};
    let message = "";
    const {id} = req.params;
    try{
        validateMongooseObjectId(id,'blog');
        const blog = await Blog.findByIdAndDelete(id);
        if(!blog){
            throw new Error("Blog doesn't exists");
        }
        data = blog;
        message = "Blog deleted successfully";
    }
    catch(error){
        errors.error = error.message;
        res.status(422);
    }
    res.json({errors,data,message});
}

const likeABlog = async (req,res)=>{
    let errors = {};
    let message = "";
    const {id} = req.params;
    const userId = req.user._id;
    const messageOptions = ["You liked this blog","You unliked this blog"];
    const ProperActionOrderArray = ['likes','dislikes'];
    try{
        const messageState = await performLikeOrDislikeLogic(id,userId,ProperActionOrderArray);
        message = messageOptions[messageState];
    }
    catch(error){
        errors.error = error.message
        res.status(422);
    }
    res.json({errors,data:{},message});
}

const dislikeABlog = async (req,res)=>{
    let errors = {};
    let message = "";
    const {id} = req.params;
    const userId = req.user._id;
    const messageOptions = ["You disliked this blog","You undisliked this blog"];
    const ProperActionOrderArray = ['dislikes','likes'];
    try{
        const messageState = await performLikeOrDislikeLogic(id,userId,ProperActionOrderArray);
        message = messageOptions[messageState];
    }
    catch(error){
        errors.error = error.message
        res.status(422);
    }
    res.json({errors,data:{},message});
}

/**Additional Functions */

const performLikeOrDislikeLogic = async (blogId,userId,ProperActionOrderArray)=>{
    try{
        validateMongooseObjectId(blogId,'blog');
        const blog = await checkBlogExistsAndRetreive(blogId);
        let FirstAction = blog[ProperActionOrderArray[0]];
        let messageState = -1;
        if(FirstAction.includes(userId)){
            FirstAction = removeUserFromArray(userId,FirstAction);
            blog[ProperActionOrderArray[0]] = FirstAction;
            messageState = 1;
        }
        else{
            blog[ProperActionOrderArray[1]] = removeUserFromArray(userId,blog.dislikes);
            FirstAction.push(userId);
            blog[ProperActionOrderArray[0]] = FirstAction;
            messageState = 0;
        }
        await blog.save();
        return messageState;
    }
    catch(error){
        throw error;
    }
}

const checkBlogExistsAndRetreive = async (id)=>{
    const blog = await Blog.findById(id);
        if(!blog){
            throw new Error("Blog does not exists!");
        }
    return blog;   
}

const handleAddNewBlogErrors = (error)=>{
    const errorMessageStart = "Blog validation failed: ";
    const usfualErrorMessage = error.replace(new RegExp(`^${errorMessageStart}`), '');
    return handleErrorUtitlties.handleErrors(usfualErrorMessage);
}

const handleEditBlogErrorMesage = (error)=>{
    const errorMessageStart = "Validation failed: ";
    const usfualErrorMessage = handleErrorUtitlties.removeErrorMessageStart(error.message,errorMessageStart);
    return handleErrorUtitlties.handleErrors(usfualErrorMessage);
}

const removeUserFromArray = (userId,array)=>{
    return array.filter((element)=> !element.equals(userId));
}

module.exports = {
    createBlog,
    editBlog,
    getBlog,
    getAllBlogs,
    deleteABlog,
    likeABlog,
    dislikeABlog
}