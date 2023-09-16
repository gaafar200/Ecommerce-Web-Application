const path = require("path");
const fileController = require("../controllers/fileController");
const MB = 5;
const FILE_SIZE_LIMIT_IN_BYTES = MB * 1024 * 1024;

const filesUploadedSuccessfully = (fileKeyInput)=>{
    return (req,res,next)=>{
        let errors = {};
        if(!req?.files ||
        !Object.keys(req.files).length ||
        !req.files[fileKeyInput] ||
        !Object.keys(req.files[fileKeyInput]).length){
            errors.error = "no files were uploaded";
            res.status(422).json({errors,data: {},message: ""});
        }
        else if(!req?.body?.destination){
            errors.destination = "destination field is required";
            res.status(422).json({errors,data: {},message: ""});
        }
        else if(!fileController.DESTINATIONS.hasOwnProperty(req.body.destination)){
            errors.destination = "destination is not valid";
            res.status(422).json({errors,data: {},message: ""});
        }
        else{
            next();
        }
    }
}

const fileSizeLimiter = (fileKeyInput)=>{
    return (req,res,next)=>{
        let errors = {};
        const filesAboveTheSizeLimit = [];
        const files = getFilesAsArray(req.files,fileKeyInput);
        files.forEach((file)=>{
            if(file.size > FILE_SIZE_LIMIT_IN_BYTES){
                filesAboveTheSizeLimit.push(file.name);
            }
        });
        if(filesAboveTheSizeLimit.length > 0){
            errors.error = generateFileSizeLimiterErrorMessage(filesAboveTheSizeLimit);
            res.status(422).json({errors,data: {},message: ""});
        }
        else{
            next();
        }
    }
}


const limitAllowedFileTypes = (fileKeyInput,allowedFileExtentions)=>{
    return (req,res,next)=>{
        let errors = {};
        const NotAllowedFiles = [];
        const files = getFilesAsArray(req.files,fileKeyInput);
        files.forEach((file)=>{
            if(!allowedFileExtentions.includes(path.extname(file.name))){
                NotAllowedFiles.push(file.name);
            }
        });
        if(NotAllowedFiles.length){
            errors.error = generateNotAllowedFileTypesErrorMessage(NotAllowedFiles,allowedFileExtentions);
            res.status(422).json({errors,data: {},message: ""});
        }
        else{
            next();
        }
    }

}

const numberOfUploadedFileLimiter = (fileKeyInput,numberOfFilesAllowed)=>{
    return (req,res,next)=>{
        let errors = {};
        const files = getFilesAsArray(req.files,fileKeyInput);
        if(files.length > numberOfFilesAllowed){
            const properWord = numberOfFilesAllowed === 1 ? "file" : "files";
            errors.error = `Maxium number of ${properWord} allowed is ${numberOfFilesAllowed}`;
            res.status(422).json({errors,data: {},message: ""});
        }
        else{
            next();
        }
    }

}

/**Additional Functions */
const formatProperMessageForArrayOfFiles = (files)=>{
    const properVerb = files.length > 1 ? "are" : "is";
    let filesString = files.toString();
    const fileNames = filesString.replace(',',', ');
    return `${fileNames} ${properVerb}`;
}

const generateFileSizeLimiterErrorMessage = (filesAboveTheSizeLimit)=>{
    const baseErrorMessage = formatProperMessageForArrayOfFiles(filesAboveTheSizeLimit);
    return baseErrorMessage + ` above the allowed file limit ${MB} MB`;
}

const generateNotAllowedFileTypesErrorMessage = (NotAllowedFiles,AllowedFileExtention)=>{
    const baseErrorMessage = formatProperMessageForArrayOfFiles(NotAllowedFiles);
    const allowedExtensionMessage = formatProperMessageForArrayOfFiles(AllowedFileExtention);
    return baseErrorMessage + ` not allowed file type, only ${allowedExtensionMessage} allowed`;
}

const getFilesAsArray = (files,fileKeyInput)=>{
    return Array.isArray(files[fileKeyInput]) ? files[fileKeyInput] : [files[fileKeyInput]];
}

module.exports = {
    filesUploadedSuccessfully,
    fileSizeLimiter,
    limitAllowedFileTypes,
    numberOfUploadedFileLimiter
}