import express from "express"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware.js";
import {CreateUserSchema,SigninSchema, CreateRoomSchema} from "@repo/common/types"
import prismaClient from "@repo/db/client"
import bcrypt from "bcrypt"



const app = express();

app.use(express.json());

app.post("/signup",async(req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success){
       return res.status(401).json({
            message: "Incorrect inputs"
        })
    }

    const hashedPassword =  await bcrypt.hash(parsedData.data?.password, 10)

    const user = await prismaClient.user.create({
        data:{
            name: parsedData.data?.name,
            email: parsedData.data?.email,
            password: hashedPassword
        }
        
    })

    const token = jwt.sign({
        userId: user?.id,

    }, JWT_SECRET)
    
    res.status(201).json({
        message:"Signup successfully!",
        token
    })

})

app.post("/signin", async(req, res) =>{
    const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success) {
        return res.status(401).json({
            msg : "Invalid inputs"
        })
    }

    const user =  await prismaClient.user.findFirst({
        where: {
            email: parsedData.data?.username,
            
        },
        select: {
            id: true,
            password: true
        }


    })


    if(!user) {
        return res.status(401).send({
            msg: "User doesn't exist"
        })
    }

    const isValid = await bcrypt.compare(parsedData.data?.password, user.password );

    if (!isValid) {
        return res.status(403).json({
            message: "Invalid credentials"
        })
    }


    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET);

    

    res.json({
       token
    })


})

app.post("/room" , middleware,async(req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.json({
            message: "IncorrectInputs"

        })
        return;
    }

    

    const userId = req.userId;

    try{
        const room =await prismaClient.room.create({
        data: {
            slug: parsedData.data.roomName,
            adminId: userId!
        }

    })

    res.json({
        roomId: room.id
    })
    } catch(error) {
        console.log(error);
        
        res.status(409).json({
            message: "Room already exists with this name"
        })

    }

})


app.get("/chats/:roomId",async (req, res) => {
    const roomId = Number(req.params.roomId);
    const messages = await prismaClient.chat.findMany({
        where: { roomId : roomId },
        orderBy: {id : "desc"},
        take: 50
    })

    res.json({
        messages
    })
})


app.listen(3001)