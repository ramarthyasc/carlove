import { WebSocketServer, WebSocket as WebSocketWS } from 'ws';
import http from 'http';
import express from 'express';
const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });
interface Room {
    sockets: Set<WebSocketWS>;
}

const rooms: Record<string, Room> = {

}

interface IRoomCreate {
    type: "join-room";
    room: string;
}
interface IMessage {
    type: "chat";
    room: string;
    message: string;
}

const RELAY_HOST = "ws://localhost:5001";
const wsRelay = new WebSocket(RELAY_HOST);

wsRelay.onmessage = ({ data }) => {
    const parsedData: IMessage = JSON.parse(data);
    const room = parsedData.room;
    if (!rooms[room]) return; // room will always be there bcs client had connected before messaging right/
    rooms[room].sockets.forEach((socket) => socket.send(parsedData.message));
}


wss.on('connection', function connection(ws) {
    console.log("websocket client connected");
    ws.on('error', console.error);

    // ws only accepts string or binary
    ws.on('message', function message(data: string) {
        const parsedData: IRoomCreate | IMessage = JSON.parse(data);
        const room = parsedData.room;
        if (parsedData.type === "join-room") {
            console.log("JOINING ROOM");
            if (!rooms[room]) {
                rooms[room] = {
                    sockets: new Set(),
                }
            }
            rooms[room].sockets.add(ws);
            (ws as any).room = parsedData.room;
            ws.send(`Joined ${parsedData.room}`);
        }

        if (parsedData.type === "chat") {
            wsRelay.send(data);
        }
    });

    ws.on("close", (code, reason) => {
        console.log("WS object closed with code: %d, reason: %s", code, reason);
        rooms[(ws as any).room]?.sockets.delete(ws);
    })

});

app.get("/", (req, res) => {
    console.log("helooo");
    return res.send("heyy");
})

server.listen(5000, () => {
    console.log("server running on ", 5000);
});
