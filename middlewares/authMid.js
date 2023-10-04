const jwt = require("jsonwebtoken");
const User = require("../models/userModel")
require("dotenv").config();
const verifiyToken = (token)=>{
    return new Promise((resolve,reject)=>{ 
        jwt.verify(token,process.env.SECRET,{},(err,data)=>{
            if(err) reject(err);
            resolve(data.id);
        })
    })
}

const authenticateUser = async (req,res,next)=>{
    const {token} = req.cookies;
    let errors = {};
    try{
        const id = await verifiyToken(token);
        const user = await User.findById(id);
        if(user === null){
            throw new Error();
        }
        req.user = user;
        next();
    }
    catch(error){
        res.status(401);
        errors.error = "UNAUTHORIZED"
        res.json(errors);
    }
}

const authenticateAdmin = (req,res,next)=>{
    let errors = {};
    const user = req.user;
    try{
        if(user.role !== 1){
            errors.error = "You are Not authorized to perform this action"
            res.status(401).json({errors,data: {},message:""});
        }
        else{
            next();
        }
    }
    catch(error){
        console.log(error);
        errors.error = "You are Not authorized to perform this action"
        res.status(401).json({errors,data: {},message:""});
    }
}

module.exports = {
    authenticateUser,
    authenticateAdmin,
};