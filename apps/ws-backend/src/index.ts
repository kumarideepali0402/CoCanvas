import { WebSocketServer, WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

interface User {
  ws: WebSocket,
  userId: string,
  rooms: string[]
}
const users :User[] = [];


const wss = new WebSocketServer({ port: 8080 });

function checkUser(token: string) : string | null {
  const decoded = jwt.verify(token, JWT_SECRET);

  if(typeof decoded == "string") {
    return null;
  }
  if(!decoded || !decoded.userId) {
    return null;
  }
  return decoded.userId;
}

wss.on('connection', async function connection(ws, request) {
  const url = request.url;

  if(!url) return;

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || '';
  const userId = checkUser(token);

  if(!userId) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms:[],
    ws: ws
  })

  

  

  ws.on('message', async function message(data) {
    const parsedData = JSON.parse(data as unknown as string);

    if(parsedData.type == "join_room") {
      const user = users.find((x)=> x.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }

    if(parsedData.type == "leave_room") {
      const user = users.find((x) => x.ws == ws);
      if(!user) return;
      user.rooms = user?.rooms.filter((x) => x != parsedData.room);
    }

    await prismaClient.create({
      data: {
        roomId: parsedData.roomId,
        userId: parsedData.userId,
        message: parsedData.message 
        
      }
    })

    if(parsedData.type == "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      users.forEach(user => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(JSON.stringify({
            type: "chat",
            message: message,
            roomId
          }))
        }
      })
    }
  })
})