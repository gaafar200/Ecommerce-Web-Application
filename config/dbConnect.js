const mongoose = require("mongoose");

const dbConnect = async ()=>{
    try{
        await mongoose.connect(process.env.DBSTRING + process.env.DB_NAME);
        console.log("Connected to database");
    }
    catch(error){
        console.log(error);
        process.exit(1);
    }
}

module.exports = dbConnect