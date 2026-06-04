import express from "express"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import {CreateUserSchema,SigninSchema, CreateRoomSchema} from "@repo/common/types"

const app = express();

app.post("/signup",(req, res) => {
    const data = CreateUserSchema.safeParse(req.body);
    if(!data.success){
       return res.status(401).json({
            "message": "Incorrect inputs"
        })
    }
    
    res.json({
        userId: "123"
    })

})

app.post("/signin", (req, res) =>{
    const userId = 1;

    const token = jwt.sign({
        userId
    }, JWT_SECRET)

    res.json({
        token
    })


})

app.post("/room" , middleware,(req, res) => {
    //db call
    res.json({
        roomId: 123
    })

})


app.listen(3001)