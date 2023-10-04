const mongoose = require("mongoose");
const validator = require("validator");
const productModel = new mongoose.Schema({
    title:{
        type:String,
        required:[true,"Product must have a title"],
        trim: true,
        validate:{
            validator: (value)=>{
                return /^[a-zA-Z 0-9]+$/.test(value);
            },
            message: "Title is not valid"
        },
    },
    slug:{
        type:String,
        required: [true,"Product must have a slug"],
        lowercase:true,
        validate:[
            {
                validator: (value)=>{
                    return /^[a-zA-Z-0-9]+$/.test(value);
                },
                message: "Slug is not valid"
            },
            {
                validator: async (value)=>{
                    return !await mongoose.models.Product.findOne({ slug: value });
                },
                message: "slug must be unique"    
            }
        ],
    },
    description:{
        type:String,
        required: [true,"Product must have a description"],
        validate:{
            validator: (value)=>{
                return /^[a-zA-Z 0-9+&]+$/.test(value);
            },
            message: "Description is not valid"
        },
    },
    category:{
        type:String,
        required: [true,"Product must have a category"],
        validate:{
            validator:(value)=>{
                return /^[a-zA-Z]+$/.test(value);
            },
            message: "Category is not valid",
        }
    },
    price:{
        type:Number,
        required: [true,"Product must have a price"],
        validate:{
            validator: (value)=>{
                return value > 0;
            },
            message: "Price is not valid"
        },
    },
    quantity:{
        type:Number,
        required: [true,"Product must have a quantity"],
        validate:{
            validator: (value)=>{
                return value > 0;
            },
            message: "Quantity is not valid"
        },
    },
    images:{
        type:Array,
    },
    color: {
        type: String,
        required: [true,"Product must have a color"],
    },
    brand:{
        type:String,
        enum:["Apple","Nike","Lenovo","Samsung"],
    },
    sold:{
        type: Number,
        default: 0,
    },
    ratingsCount: {
        type: Number,
        default: 0,
    },
    averageRating: {
        type: Number,
        default: 0.0
    }
},{timestamps: true});


module.exports = mongoose.model("Product",productModel);