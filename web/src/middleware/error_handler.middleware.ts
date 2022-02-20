import { Request, Response, NextFunction } from "express";
import { errorHandlerUtil, BaseError, BaseResponse } from "../utils/index";


export const error_handler_middleware = () => {
   return  async (err:Error, req:Request, res:Response, next:NextFunction) => {
        await errorHandlerUtil.handleError(err)
        if(!errorHandlerUtil.isTrustedError(err)){
            res.status(500).send("Something Broke")
        } else {
            // That means error type is BaseError
            
            const error:BaseError = err as BaseError

            BaseResponse(error.httpCode, {
                status: "failed",
                err: error.message
            }, res, error.message)
        }
      
    }
}