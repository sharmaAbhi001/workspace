import { RequestHandler , Request , Response , NextFunction } from "express";



export const asyncHandler = (handler:(req:Request,res:Response,next:NextFunction)=> Promise<unknown>) :RequestHandler => (req,res,next) =>{
   Promise.resolve(handler(req,res,next)).catch(next)
}


