import express from "express";
import cookieParsar from "cookie-parser";
import cors from 'cors'
import authRouter from "./modules/auth/auth.route.js"
import integrationRouter from "./modules/integrations/integration.route.js"
import mailRouter from "./modules/mail/mail.route.js"
import webhookRouter from "./webhook/route.js"
import { errorHandler } from "./utils/ErrorHandler.js";
import session from "express-session";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { functions } from "./inngest/Functions/index.js";
import {redis} from "./utils/redis.js"

export const createApp = () =>{

    const app = express()

    app.set("trust proxy", 1);

    app.use(cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    credentials:true,
    }))

    app.use(cookieParsar());
    app.use(express.json())
    app.use(express.urlencoded({ extended: true })); 

    app.use(
        session({
          name: "workspace.sid",
          secret: process.env.SESSION_SECRET!,
          resave: false,
          saveUninitialized: false,
          cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000,
          },
        })
      );


    app.get("/",async (_req,res)=>{
      

     await  redis.set("status","connected")

        res.status(200).json({status:"ok"})

    })

    app.get("/get",async (_req,res)=>{

    const resdis =   await  redis.get("status")

      console.log(resdis)
 
         res.status(200).json({status:"ok"})
 
     })


    app.use("/api/v1/webhook", webhookRouter)

    app.use("/api/v1/auth",authRouter)

    app.use("/api/v1/integrations", integrationRouter)

    app.use("/api/v1/mail", mailRouter)

    app.use("/api/inngest", serve({ client: inngest, functions }));


    
app.use(errorHandler)
    return app;
}
