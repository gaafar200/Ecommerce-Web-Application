const path = require("path");
const DESTINATIONS = {
    'blog':'blog/',
}

const uploadImage = (req,res)=>{
    let data = {};
    let errors = {};
    let message = "";
    const image = req.files.image;
    const destination = req.body.destination;
    const uniqueImageName = createUniqueFileName(image.name);
    console.log(uniqueImageName);
    const destinationPath = getFileDestination(destination,uniqueImageName);
    image.mv(destinationPath,(err)=>{
        if(err){
            errors.error = err.message;
            res.status(500);
        }
        else{
            data.path = "images/" + DESTINATIONS[destination] + uniqueImageName;
            message = "image uploaded successfully";
        }
        res.json({errors,data,message});
    });
}

const getFileDestination = (destination,uniqueImageName)=>{
    const partialDestination = "../uploads/images/" + DESTINATIONS[destination];
    return path.join(__dirname,partialDestination,uniqueImageName);
}
const createUniqueFileName = (fileName)=>{
    return Date.now() + fileName;
}
module.exports = {
    uploadImage,
    DESTINATIONS
}
