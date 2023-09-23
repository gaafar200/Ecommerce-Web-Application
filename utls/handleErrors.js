const handleErrors = (error)=>{
    let errors = {};
    const errorMessages = error.split(', ');
    errorMessages.forEach((error)=>{
        if(error.indexOf(': ') === -1){
            errors.error = error;
        }
        else{
            const errorParts = error.split(': ');
            errors[errorParts[0]] = errorParts[1];
        }
    })
    return errors;
}

const removeErrorMessageStart = (error,errorMessageStart)=>{
    return error.replace(new RegExp(`^${errorMessageStart}`), '');
}


module.exports ={
    handleErrors,
    removeErrorMessageStart
}