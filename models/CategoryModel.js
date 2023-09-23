const mongoose = require("mongoose");
const validator = require("validator");
const {isValidCategoryTitle} = require("../utls/mongooseDBValidation");
const CategorySchema = new mongoose.Schema({
    title:{
        type:String,
        required: [true,"Category must be unique"],
        unique: [true,"Category title must be unique"],
        index: true,
        validate:{
            validator: (value)=> isValidCategoryTitle(value),
            message:"Category title is invalid",
        },
    },
    type: {
        type: String,
        required: [true, "Category must have a type"],
        validate: {
            validator: (value) =>  {
                return ['product', 'blog', 'brand'].includes(value);
            },        
            message: "Category type is invalid",
        },
    }
},{
    timestamps: true
});

module.exports = mongoose.model("Category",CategorySchema);