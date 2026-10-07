import { NextFunction, Request , Response , ErrorRequestHandler} from "express";
import { ApiError } from "./ApiError.js";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";


export const errorHandler :ErrorRequestHandler = (error:unknown,_req:Request,res:Response,_next:NextFunction) =>{

     if (error instanceof ApiError) {

        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errors: error.errors ?? null
        });
    }


     if (error instanceof ZodError) {

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.flatten().fieldErrors
        });
    }

     if (error instanceof Prisma.PrismaClientKnownRequestError) {

        if (error.code === "P2002") {

            return res.status(409).json({
                success: false,
                message: "Resource already exists"
            });
        }

        console.log(error)

        return res.status(400).json({
            success: false,
            message: "Database request failed"
        });
    }

     console.error(error);

    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });

}