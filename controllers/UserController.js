const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const {sendEmailConfirmationLink,sendEmailForgetPasswordLink} = require("../utls/emailStuff");
const bcrypt = require("bcrypt");
const Cryptr = require('cryptr');
require("dotenv").config();
const {validateMongooseObjectId,isValidObjectId:isValidUserId} = require("../utls/mongooseDBValidation");
const {handleErrors:handleErrorUtlity} = require("../utls/handleErrors");
const {getProductById} = require("./ProductController");
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
        errors.error = error.message;
        res.status(400)
    }
    res.json({errors,data});
}

const getAllUsers = async (req,res)=>{
    let errors = {};
    let data = {};
    let message = "";
    try{
        const users = await User.find({});
        data = users;
        message = "Retrieved all users successfully";
    }
    catch(error){
        res.status(400)
        errors = handleErrorUtlity(error.message);
    }
    res.json({errors,data,message});
}

const getUserData = async (req,res)=>{
    const {id} = req.params;
    let data = {};
    let errors = {};
    validateMongooseObjectId(id,'user');
    try{
        const user = await User.findById(id);
        data = user;
    }
    catch(error){
        console.log(error.message);
        res.status(400);
        errors.error = "undefined user id";
    }
    res.json({errors,data});
}

const editUserData = async (req,res)=>{
    const {id} = req.params;
    try{
        validateMongooseObjectId(id,'user');
        let errors = {};
        let data = {};
        updateUserData(id,req,res);
    }
    catch(error){
        res.status(400);
        errors.error = error.message;
    }
}

const deleteUser = async (req,res)=>{
    const {id} = req.params;
    const adminId = req.user.id;
    let errors = {};
    let data = {}
    try{
        validateMongooseObjectId(id,'user');
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
    const id = req.user._id;
    let errors = {};
    try{
        validateMongooseObjectId(id,'user');
        updateUserData(id,req,res);
    }
    catch(error){
        errors.error = error.message;
        res.status(400).json({errors: errors,data: {},message: ""});
    }
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
    let message = "";
    try{
        validateMongooseObjectId(id,'user');
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
            message = "User blocked Successfully";
        }
    }
    catch(error){
        errors.error = error.message;
        res.status(400);
    }
    res.json({errors,data});
}

const unblockUser = async (req,res)=>{
    const {id} = req.params;
    let data = {}
    let errors = {}
    try{
        validateMongooseObjectId(id,'user');
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
    res.json({errors,data});
}

const logout = (req,res)=>{
    res.cookie("token","");
    res.sendStatus(204);
}

const confirmEmail = async (req,res)=>{
    let data = {};
    let message = "";
    let errors = {};
    const encToken = req?.query?.token; 
    if(!encToken){
        errors.error = "This Link is not valid";
        res.status(400);
    }
    const token = decryptToken(encToken,process.env.SECRET);
    const parts = token.split(',');
    const userId = parts[0];
    const expiresAt = parts[1];
    if(isValidUserId(userId) && isValidTimestamp(expiresAt)){
        const currentTimestamp = Date.now();
        if(currentTimestamp >= expiresAt){
            errors.error = "This link has been expired";
            res.status(400);
        }
        else{
            try{
                
                const user = await User.findById(userId);
                if(!user){
                    errors.error = "This Link is not valid";
                }
                else if(user.is_verified){
                    errors.error = "User email already verified";
                }
                else{
                    await User.findByIdAndUpdate(userId,{is_verified: true});
                    message = "User Email Verfied Correctly";
                }
            }
            catch(error){
                console.log(error.message);
                errors.error = error.message;
                res.status(400);
            }
        }
    }
    else{
        console.log("Ya");
        errors.error = "This Link is not valid";
        res.status(400);
    }

    res.json({errors,data,message});
}

const resendConfirmLink = (req,res)=>{
    let errors = {};
    let data = {};
    let message = "";
    try{
        if(req.user.is_verified){
            throw new Error("Email already Verfied");
        }
        generateConfirmationLink(req.user._id,req.user.email);
        message = "Email sended successfully";
    }
    catch(Error){
        errors.error = Error.message;
        res.status(400);
    }
    res.json({errors,data,message});
}

const forgetPasswordEmail = async (req,res)=>{
    const errors = {};
    const data = {};
    let message = "";
    const {email} = req.body;
    try{
        const user = await User.findOne({email});
        if(!user){
            throw new Error("Email does not exists");
        }
        generateForgetPasswordLink(user._id,user.email,user.password);
        message = "Reset Password Email Was Sent successfully";

    }
    catch(error){
        errors.error = error.message;
        res.status(400);
    }
    res.json({errors,data,message})
}

const resetPassword = async (req,res)=>{
    const {id} = req.params;
    let {token} = req.query;
    const {newPassword,confirmNewPassword} = req.body;
    let data = {};
    let errors = {};
    let message = "";
    try{
        const user = await User.findById(id);
        if(!isValidUserId(id) || !token || !user){
            throw new Error("Invalid Link!");
        }
        const tokenData = decryptToken(token,user.password);
        const currentTimeStamp = Date.now();
        const parts = tokenData.split(',');
        const userId = parts[0];
        const timeStamp = parts[1];
        if(!isValidUserId(userId)
         || !isValidTimestamp(timeStamp)
         || userId != id
         || currentTimeStamp > timeStamp){
            throw new Error("Invalid Link!");
        }
        const passOk =  await bcrypt.compare(newPassword,user.password);
        if(passOk){
            errors.newPassword = "New password can't be same as the old passwprd";
            res.status(400);
        }
        else if(newPassword !== confirmNewPassword){
            errors.confirmNewPassword = "passwords don't match";
        }
        else{
            const newUser = await User.changePassword(newPassword,user);
            console.log(newUser);
            token = await createToken(user._id);
            res.cookie("token",token,{expires: halfAMounthFromNow,httpOnly:false});
            message = "Password changed successfully";
            data = newUser;
        }
    }
    catch(error){
        errors.error = error.message;
        res.status(400);
    }
    res.json({errors,data,message});
}

const addToWishlist = async (req,res)=>{
    const {productId} = req.params;
    let data = {};
    let errors = {};
    let message = "";
    try{
        let user = req.user;
        validateMongooseObjectId(productId,'product');
        const product = await getProductById(productId)
        if(!product){
            throw new Error("Invalid product id");
        }
        let wishlist = user.wishlist;
        const alreadyInWishList = wishlist.some((productObject)=> productObject.toString() === productId);
        if(alreadyInWishList){
            wishlist = wishlist.filter((id)=> id.toString() !== productId);
            message = "Product removed successfully from wishlist";
        }
        else{
            wishlist.push(productId);
            message = "Product added successfully to wishlist";
        }
        const newUser = await User.findByIdAndUpdate(user._id,{
            wishlist:wishlist
        },{runValidator:true,new:true})
        data = newUser;
    }
    catch(error){
        errors = handleErrorUtlity(error.message);
        res.status(400);
    }
    res.json({errors,data,message});
}


/** Additional Functions */
const returnCryptrObject = (secretKey)=>{
    return new Cryptr(secretKey); 
}

const encryptText = (text,secretKey)=>{
    const cryptr = returnCryptrObject(secretKey)
    return cryptr.encrypt(text);
}

const decryptToken = (cipherText,secretKey)=>{
    const cryptr = returnCryptrObject(secretKey)
    return cryptr.decrypt(cipherText);
}

const isValidTimestamp = (timestamp)=>{
    const minTimestamp = Date.now() - (10 * 365 * 24 * 60 * 60 * 1000);
    const maxTimestamp = Date.now() + (10 * 365 * 24 * 60 * 60 * 1000);
    if(timestamp < minTimestamp || timestamp > maxTimestamp){ 
        return false;
    }
    return true;
}

const LinkGenerationBase = (confirmationLinkBaseUrl,userId,userPassword)=>{
    let secretKey = ""
    if(!userPassword){
        secretKey = process.env.SECRET;
    }
    else{
        secretKey = userPassword;
    }

    const currentTimestamp = Date.now();
    const twentyFourHoursFromNow = currentTimestamp + 24 * 60 * 60 * 1000;
    const authConfirmationString = userId + "," + twentyFourHoursFromNow;
    const encryptedAuthConfirmationString = encryptText(authConfirmationString,secretKey);
    return confirmationLinkBaseUrl + encryptedAuthConfirmationString  
}

const generateConfirmationLink = async (userId,userEmail)=>{
    const confirmationLinkBaseUrl = "http://localhost:3000/user/confirm?token=";
    const authConfirmationLink = LinkGenerationBase(confirmationLinkBaseUrl,userId)
    sendEmailConfirmationLink(userEmail,authConfirmationLink);
}

const generateForgetPasswordLink = async (userId,userEmail,userPassword)=>{
    const confirmationLinkBaseUrl = `http://localhost:3000/reset-password/${userId}?token=`
    const authConfirmationLink = LinkGenerationBase(confirmationLinkBaseUrl,userId,userPassword);
    sendEmailForgetPasswordLink(userEmail,authConfirmationLink);
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
        errors.error = err.message;
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
    confirmEmail,
    resendConfirmLink,
    forgetPasswordEmail,
    resetPassword,
    addToWishlist,
};