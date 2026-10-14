const http = require("node:http");

// Client error responses (400 – 499)
// Server error responses (500 – 599)
class ErrorResponse extends Error {
    constructor({ statusCode, message } = {}, options) {
        super(message, options);
        this.name = this.constructor.name;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.statusCode = statusCode;
    }

    static status(statusCode, options) {
        return new ErrorResponse(
            {
                statusCode,
                message: http.STATUS_CODES[statusCode],
            },
            options,
        );
    }
}

exports.ErrorResponse = ErrorResponse;
