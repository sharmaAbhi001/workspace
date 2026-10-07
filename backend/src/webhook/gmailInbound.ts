import { Request,Response } from "express"
import { gmailNotificationReceived, inngest } from "../inngest/client.js";
import { verifyPubSubRequest } from "./validate.js";


export const gmailInboundController = async (req:Request,res:Response)=>{

    const auth = await verifyPubSubRequest(req);
    if (!auth.ok) {
      console.warn("Pub/Sub verify failed:", auth.reason); 
      return res.status(401).end();
    }

    const msg = req.body?.msg;

    if(!msg.data) return res.status(400).end();

    // Decode 

    const payload = JSON.parse(Buffer.from(msg.data,"base64").toString("utf-8"));
    const emailAddress: string = payload.emailAddress;
  const  historyId = String(payload.historyId);

  await inngest.send(
    gmailNotificationReceived.create({
        emailAddress:emailAddress,
        historyId:historyId,
    })
  );


res.status(204).end();
}