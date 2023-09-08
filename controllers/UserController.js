const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const {sendEmailConfirmationLink} = require("../utls/emailStuff");
const bcrypt = require("bcrypt");
require("dotenv").config();
const isValidUserId = require("../utls/mongooseDBValidation");
const maxAge = 15*24*60*60;
const halfAMounthFromNow =  new Date(Date.now() + maxAge * 1000);
const lodash = require("lodash");
const register = async (req,res)=>{
    let errors = {};
    let data = {};
    const {firstName,lastName,email,mobile,password,confirmPassword} = req.body;
    if(password !== confirmPassword){
        errors.confirmPassword = "passwords don't match";
        res.status(400);
    }   
    else{
        try{
            const user = new User({
                firstName,
                lastName,
                email,
                mobile,
                password
            });
            let newUser = await user.save();
            const token = await createToken(newUser._id);
            data = newUser;
            res.status(201).cookie("token",token,{expires: halfAMounthFromNow,httpOnly:false});
            generateConfirmationLink(newUser.id,newUser.email);
        }
        catch(error){
            console.log(error);
            res.status(400);
            errors = handleError(error);
        }
    }
    res.json({errors,data});

}

const login = async (req,res)=>{
    const {email,password} = req.body;
    let errors = {};
    let data = {};
    try{
        let user = await User.login(email,password);
        const token = await createToken(user._id);
        res.cookie("token",token,{expires: halfAMounthFromNow,httpOnly:false});
        data = user;
    }
    catch(error){
        console.log(error.message);
        errors = {error:error.message};
        res.status(400)
    }
    res.json({errors,data});
}

const getAllUsers = async (req,res)=>{
    try{
        const users = await User.find({});
        res.json(users);
    }
    catch(error){
        res.status(400).json(error);
    }
}

const getUserData = async (req,res)=>{
    const {id} = req.params;
    let data = {};
    let errors = {};
    if(isValidUserId(id)){
        try{
            const user = await User.findById(id);
            data = user;
        }
        catch(error){
            console.log(error.message);
            res.status(400);
            errors.error = "undefined user id";
        }
    }
    else{
        errors.error = "This is not a valid user";
        res.status(400);
    }
    res.json({errors,data});
}

const editUserData = async (req,res)=>{
    const {id} = req.params;
    if(!isValidUserId(id)){
        let errors = {};
        let data = {};
        errors.error = "This is not a vaild user";
        res.status(400).json(errors,data);
    }
    updateUserData(id,req,res);
}

const deleteUser = async (req,res)=>{
    const {id} = req.params;
    const adminId = req.user.id;
    let errors = {};
    let data = {}
    if(isValidUserId){
        try{
            if(id === adminId){
                throw new Error("Can't delete admin account");
            }
            const deletedUser = await User.findByIdAndDelete(id);
            if(deletedUser === null){
                throw new Error("User does not exists");
            }
            data = deletedUser;
        }
        catch(error){
            res.status(400);
            errors.error = error.message;
        }
    }
    else{
        errors.error = "This is not a vaild user";
        res.status(400);
    }
    res.json({errors,data}); 
}

const profile = async(req,res)=>{
    const user = req.user;
    let errors = {};
    let data = {};
    delete user["password"];
    data = user;
    res.json({errors,data});
}

const EditMyData = async (req,res)=>{
    const id = req.user.id;
    updateUserData(id,req,res);
}

const changePassword = async (req,res)=>{
    let errors = {};
    let data = {};
    const user = req.user;
    const {
        oldPassword,
        password,
        confirmPassword,
    } = req.body;
    try{
        if(password !== confirmPassword){
            errors.confirmPassword = "Passwords don't match";
            res.status(400);
        }
        else{
            const passOk = await User.passwordsMatch(oldPassword,user.password);
            if(passOk){
                if(password === oldPassword){
                    throw new Error("password: new password can't be the same as the old password");
                }
                await User.changePassword(password,user);              
                res.status(204);
            }
            else{
                errors.oldPassword = "password is incorrect";
                res.status(400);
            }
        }
    }
    catch(error){
        console.log(error);
        errors.password = getPasswordError(error.message);
        res.status(400);
    }
    res.json({errors,data});
}

const blockUser = async (req,res)=>{
    const {id} = req.params;
    const adminId = req.user.id;
    let data = {}
    let errors = {}
    if(isValidUserId(id)){
        try{
            if(adminId === id){
                throw new Error("Can't block admin account");
            }
            const user = await User.findById(id);
            if(!user){
                throw new Error("User not found");
            }
            else if(user.is_blocked){
                throw new Error("User already blocked");
            }
            else{
                await User.findByIdAndUpdate(id,{is_blocked:true});
                data.message = "User blocked Successfully";
            }
        }
        catch(error){
            errors.error = error.message;
            res.status(400);
        }
    }
    else{
        errors.error = "This is not a vaild user";
        res.status(400);
    }
    res.json({errors,data});
}

const unblockUser = async (req,res)=>{
    const {id} = req.params;
    let data = {}
    let errors = {}
    if(isValidUserId(id)){
        try{
            const user = await User.findById(id);
            if(!user){
                throw new Error("User not found");
            }
            else if(!user.is_blocked){
                throw new Error("User is not blocked");
            }
            else{
                await User.findByIdAndUpdate(id,{is_blocked:false});
                data.message = "User unblocked Successfully";
            }
        }
        catch(error){
            errors.error = error.message;
            res.status(400);
        }
    }
    else{
        res.status(400);
        errors.error = "This is not a vaild user";
    }
    res.json({errors,data});
}

const logout = (req,res)=>{
    res.cookie("token","");
    res.sendStatus(204);
}


/** Additional Functions */
const generateConfirmationLink = async (userId,userEmail)=>{
    const confirmationLinkBaseUrl = "http://localhost:5000/user/confirm?token=";
    const currentTimestamp = Date.now();
    const twentyFourHoursFromNow = currentTimestamp + 24 * 60 * 60 * 1000;
    const authConfirmationString = userId + "," + twentyFourHoursFromNow;
    const hashedAuthConfirmationString = await bcrypt.hash(authConfirmationString,10);
    const authConfirmationLink = confirmationLinkBaseUrl + hashedAuthConfirmationString;
    sendEmailConfirmationLink(userEmail,authConfirmationLink);
}

const updateUserData = async (id,req,res)=>{
    
    let finalData = {};
    let errors = {};
    const data = {
        firstName: req?.body?.firstName,
        lastName: req?.body?.lastName,
        mobile: req?.body?.mobile,
    }
    try{
        const newUser = await User.findByIdAndUpdate(id,data,{new:true,runValidators:true});
        finalData = newUser
    }
    catch(error){
        console.log(error.message);
        errors = handleEditErrorMessages(error);
        res.status(400);
    }
     res.json({errors,data:finalData});
}

const handleError = (err)=>{
    let errors = {};
    const errorMessage = err.message;
    errors.email = getEmailError(err);
    errors.mobile = getMobileError(errorMessage);
    errors.firstName = getFirstNameError(errorMessage);
    errors.password = getPasswordError(errorMessage);
    errors.lastName = getLastNameError(errorMessage);
    if(Object.keys(errors).length === 0){
        return {"errors":err};
    }
    return errors;
}

const handleEditErrorMessages = (err)=>{
    let parts = err.message.split(',');
    const functions = [getMobileError,getLastNameError,getFirstNameError];
    const keys = ["mobile","lastName","firstName"];
    let errors = {} 
    if(parts[0]){
        const errorNumber = getErrorNumber(parts[0]);
        if(errorNumber == -1){
            errors.error = "User doesn't exists";
            return errors;
        }
        errors[keys[errorNumber]] = functions[errorNumber](parts[0]);
    }
    if(parts[1]){
        const errorNumber = getErrorNumber(parts[1]);
        errors[keys[errorNumber]] = functions[errorNumber](parts[1]);
    }
    if(parts[2]){
       const errorNumber = getErrorNumber(parts[2]);
        errors[keys[errorNumber]] = functions[errorNumber](parts[2]);
    }
    return errors;
}

const getErrorNumber = (error)=>{
    if(error.includes("mobile")){
        return 0;
    }
    else if(error.includes("lastName")){
        return 1;
    }
    else if(error.includes("firstName")){
        return 2;
    }
    else{
        return -1;
    }
}

const getEmailError = (error)=>{
    if(error.code === 11000){
        return "email already in use";
    }
    else if (error.message.includes("email")){
        const e = error.message.split("email: ")[1];
        return e;
    }
}

const getFirstNameError = (error)=>{
    if(error.includes("firstName")){
        return error.split("firstName: ")[1];
    }
}

const getLastNameError = (error)=>{
    if(error.includes("lastName")){
        return error.split("lastName: ")[1];
    }
}

const getPasswordError = (error)=>{
    if(error.includes("password")){
        return error.split("password: ")[1];
    }
}

const getMobileError = (error)=>{
    if(error.includes("mobile")){
        const e = error.split("mobile: ")[1];
        return e;
    }
}
const createToken = (id)=>{
    return new Promise((resolve,reject)=>{
        jwt.sign({id},process.env.SECRET,{},(err,token)=>{
            if(err) reject(err);
            resolve(token);
        });
    })
}

module.exports = {
    register,
    login,
    getAllUsers,
    getUserData,
    editUserData,
    profile,
    changePassword,
    deleteUser,
    EditMyData,
    blockUser,
    unblockUser,
    logout,
};