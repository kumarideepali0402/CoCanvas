import { email, z } from "zod"

export const CreateUserSchema = z.object({
    userName: z.string().min(3),
    password: z.string(),
    name: z.string(),
    email: z.email()
}) 

export const SigninSchema = z.object({
    username: z.string().min(3),
    password: z.string()

})

export const CreateRoomSchema = z.object({
    roomName: z.string().min(2)

})