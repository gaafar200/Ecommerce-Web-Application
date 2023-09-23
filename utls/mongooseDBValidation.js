const mongoose = require("mongoose");

const isValidObjectId = (id)=>{
    return mongoose.Types.ObjectId.isValid(id);
}

const validateMongooseObjectId = (id,TYPE)=>{
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