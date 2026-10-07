import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .email("Enter a valid email")
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(4, "Name must be at least 4 characters")
      .max(20, "Name must be at most 20 characters"),
    email: z
      .email("Enter a valid email")
      .transform((value) => value.trim().toLowerCase()),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type LoginFormValues = z.input<typeof loginSchema>
export type LoginInput = z.output<typeof loginSchema>
export type SignupFormValues = z.input<typeof signupSchema>
export type SignupInput = Omit<z.output<typeof signupSchema>, "confirmPassword">
