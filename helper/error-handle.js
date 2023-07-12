function errorHandler(err,req,res,next) {
    // jwt token error handle
    if(err.name === 'UnauthorizedError') {
        return res.status(401).json({message: "The user is not authorised"});
    }

    // validation error handling
    if(err.name === 'ValidationError') {
        return res.status(401).json({message: err});
    }

    // any other errors
    return res.status(500).json(err);
}

module.exports = errorHandler;