import {z } from "zod" 


export const registerUser = z.object({
    name:z.string().min(4).max(20),
    email:z.email(),
    password:z.string().min(8)

});

export const loginUser = z.object({
  email:z.email(),
  password:z.string().min(8)
})


export type LoginUser = z.infer<typeof loginUser>;


