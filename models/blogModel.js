const mongoose = require("mongoose");
const validator = require("validator");

const blogSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true,"Blog must have a title."],
        validate: {
            validator: (value)=>{
                return /^[A-Za-z0-9 ]+$/.test(value);
            },
            message: "Title is not valid."
        }
    },
    description:{
        type:String,
        required:[true,"Blog must have a description."]
    },
    category:{
        type:String,
        required:[true,"Blog must have a category"],
    },
    numViews:{
        type:Number,
        default:0,
    },
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'User',
        }    
    ],
    dislikes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'User',
        }    
    ],
    image:{
        type:String,
        default:"images/blog/default-blog-image.jpg"
    },
    author:{
        type:String,
        default:"Admin"
    },
},{
    toJSON:{
        virtuals: true
    },
    toObject:{
        virtuals: true
    },
    timestamps: true
});

module.exports = mongoose.model("Blog",blogSchema);