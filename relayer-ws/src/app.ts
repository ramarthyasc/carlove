import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const servers: WebSocket[] = [];
wss.on("connection", (ws) => {
    servers.push(ws);

    ws.on("message", (message: string) => {
        servers.forEach((server) => {
            server.send(message);
        })
    })

    ws.on("error", (error) => {
        console.log(error);
    })

})

server.listen(5001, () => {
    console.log("Relayer open @Port: ", 5001);
})
