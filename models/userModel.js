const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:[true,"user must have first name"],
        validate:{
            validator: (value)=>{
                return /^[a-zA-Z]+$/.test(value)
            },
            message: "invalid firstname"
        }
    },
    lastName:{
        type:String,
        required:[true,"user must have last name"],
        validate:{
            validator: (value)=>{
                return /^[a-zA-Z]+$/.test(value)
            },
            message: "invalid lastname"
        }
    },
    email:{
        type:String,
        required:[true,"user must have an email"],
        validate:[
            {
                validator: (value)=>{
                    return validator.isEmail(value);
                },
                message: "invalid email address"
            },
            {
                validator: async (value)=>{
                    return !await mongoose.models.User.findOne({ email: value });
                },
                message: "this email is already in use"    
            }
            
        ]
    },
    mobile:{
        type: String,
        required: [true,"user must have mobile number"],
        validate:[
            {
                validator: (value)=>{
                    return /^[0-9+]+$/.test(value);
                },
                message: "mobile number is not valid"
            },
            {    
                validator: (value)=>{
                    return value.length >= 4;
                },
                message: "mobile number is not valid"
            }    
        ]
    },
    password:{
        type:String,
        required:[true,"you must enter a password to your account"],
    },
    role:{
        type: Number,
        min:0,
        max:1,
        default: 0 /** 0 for user 1 for admin */
    },
    cart:{
        type:Array,
        default: []
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "address"
    },
    is_blocked:{
        type:Boolean,
        default: false,
    },
    wishlist:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    is_verfied:{
        type:Boolean,
        default:false
    }
});


userSchema.pre("save",async function(next){
    this.password = await this.preprocessPassword(this.password);
    next();
});

userSchema.methods.preprocessPassword = async function(password){
    if(password.length < 8){
        throw new Error("password: password is too short, must be at least 8 characters long");
    }
    return await bcrypt.hash(password,10);
}

userSchema.statics.changePassword = async function(password,user){
    const newPassword = await user.preprocessPassword(password);
    await this.findByIdAndUpdate(user._id,{password:newPassword},
    {new: true,runValidators: true });   
}

userSchema.statics.login = async function(email,password){
    const user = await this.findOne({email});
    if(!user){
        throw new Error('wrong credentials');
    }
    const passwordOk = await this.passwordsMatch(password,user.password);
    if(passwordOk){
        return user;
    }
    else{
        throw new Error('wrong credentials');
    }
}

userSchema.statics.passwordsMatch = async function(userPassword,dbPassword){
    return await bcrypt.compare(userPassword,dbPassword);
}

module.exports = mongoose.model("User",userSchema);