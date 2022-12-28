
class AppError extends Error {

    message : string;
    statusCode: number;
    status: string
    isOperational: Boolean;

    constructor(message: string, statusCode: number){
        super(message)
        this.message = message;
        this.statusCode = statusCode;
        this.status = '' + statusCode + ''.startsWith('4') ? 'Fail' : 'Error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
} 

// export interface AppError = AppError
export default  AppError;