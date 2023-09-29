const mongoose = require("mongoose");

const isValidObjectId = (id)=>{
    return mongoose.Types.ObjectId.isValid(id);
}

const validateMongooseObjectId = (id,TYPE)=>{
    console.log(id);console.log(isValidObjectId(id));
    if(!id || !isValidObjectId(id)){
        throw new Error(`Invalid ${TYPE} id`);
    }
}

const isValidCategoryTitle = (value)=>{
    return /^[a-zA-Z0-9- ]+$/.test(value);
}

module.exports = {
    isValidObjectId,
    isValidCategoryTitle,
    validateMongooseObjectId
};