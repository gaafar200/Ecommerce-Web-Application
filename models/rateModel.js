const mongoose = require("mongoose");
const validator = require("validator");
const ratingSchema = new mongoose.Schema({
    rate: Number,
    comment: String,
    productId: {type: mongoose.Schema.Types.ObjectId,ref:'Product'},
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
},
{
    timestamps: true,
    _id: true
}
);

module.exports = mongoose.model('Rating',ratingSchema);

