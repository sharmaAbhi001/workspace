import { NextFunction, Request, Response } from "express"
import { ZodError ,ZodType } from "zod"


export interface CustomError extends Error {

    statusCode?: number,
errors?:Record<string , string[] | undefined>    

}

export  const validation = (Schema:ZodType) => {
    return async (req:Request , _res:Response , next :NextFunction) : Promise<void> => {
   
        try {
            req.body = await Schema.parseAsync(req.body);
            next()  
        } catch (error) {

          if(error instanceof ZodError) {
            const customError = error as CustomError

            customError.statusCode = 400;
            customError.errors = error.flatten().fieldErrors;

            return next(customError)
          }
          next(error) 
        }
    }


}