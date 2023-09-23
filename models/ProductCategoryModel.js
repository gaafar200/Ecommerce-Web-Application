const mongoose = require("mongoose");
const validator = require("validator");
const {isValidCategoryTitle} = require("../utls/mongooseDBValidation");

const productCategorySchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true,"Category must have a title"],
        unquie: [true,"Category title must be unique"],
        index: true,
        validate:{
            validator: (value)=> isValidCategoryTitle(value),
            message: "Title is invalid",
        }
    }
},{timestamps: true});

module.exports = mongoose.model("PCategory",productCategorySchema);