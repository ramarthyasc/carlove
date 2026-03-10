import { WebSocketServer, WebSocket as WebSocketWS } from 'ws';
import http, { Server } from 'http';
import express from 'express';
import { createClient } from "redis";


interface IRoomCreate {
    type: "join-room";
    room: string;
}
interface IDeleteRoom {
    type: "delete-room";
    room: string;
}
interface IMessage {
    type: "chat";
    room: string;
    message: string;
}
export type ClientMessage =
    | IRoomCreate
    | IDeleteRoom
    | IMessage

// use Map with Set as the value - the next time 
interface Room {
    sockets: WebSocketWS[];
}
type ClientType = ReturnType<typeof createClient>;

export default async function createServer(port: number) {
    const app = express();
    const server = http.createServer(app);

    const wss = new WebSocketServer({ server });

    const rooms: Record<string, Room | undefined> = {
    }

    const client = await createClient()
        .on("error", (err) => console.log("Redis Client Error", err))
        .connect();

    const clientSub = client.duplicate();
    await clientSub.connect();
    // const RELAY_HOST = relayHost;
    // const wsRelay = new WebSocket(RELAY_HOST);
    //
    // wsRelay.onmessage = ({ data }) => {
    //     const parsedData: ClientMessage = JSON.parse(data);
    //     const room = parsedData.room;
    //     if (parsedData.type === "chat") {
    //         rooms[room]?.sockets.forEach((socket) => socket.send(JSON.stringify(parsedData)));
    //     }
    // }

    function subscriptionHandler<T extends string>(message: T) {
        const parsedData: ClientMessage = JSON.parse(message);

        const room = parsedData.room;
        rooms[room]?.sockets.forEach((socket) => socket.send(JSON.stringify(parsedData)));
    }


    wss.on('connection', function connection(ws) {
        console.log("websocket client connected");
        ws.on('error', console.error);

        // ws only accepts string or binary - and receives at onmessage @server as arrayBuffer ie Binary and @client as 
        // EventObject with data property as string automatically
        ws.on('message', async function message(data) {
            const parsedData: ClientMessage = JSON.parse(data.toString());
            const room = parsedData.room;

            if (parsedData.type === "join-room") {
                console.log("JOINING ROOM", room);
                if (rooms[room] === undefined) {
                    rooms[room] = {
                        sockets: [],
                    }
                    // only when the room is created, only then send the join-room message to Relayer from
                    // this server. Because after that, even if there are clients joining the same room, then
                    // I don't need to tell relayer that this room is in this server again and again.
                    console.log("Created Room");
                    // wsRelay.send(JSON.stringify(parsedData));
                    await clientSub.subscribe(room, subscriptionHandler);

                }
                rooms[room].sockets.push(ws);
                (ws as any).room = parsedData.room;

                ws.send(JSON.stringify(parsedData));
            }

            if (parsedData.type === "chat") {
                // wsRelay.send(data.toString());
                await client.publish(room, JSON.stringify(parsedData));
            }
        });

        // When close event happens due to abrupt TCP disconnection due to Browser or the client being terminated
        // or when client closes the tcp connection gracefully
        ws.on("close", async (code, reason) => {
            console.log("WS client closed with code: %d, reason: %s", code, reason);
            const room: string = (ws as any).room;
            if (!rooms[room]) { return; }
            rooms[room].sockets = rooms[room].sockets.filter((socket: WebSocketWS) => socket !== ws);

            if (!rooms[room].sockets.length) {
                rooms[room] = undefined;
                console.log("Rooms room1 is undefined right now");
                // send message to relay server that room A is no longer in this server
                // const deleteRoom: IDeleteRoom = {
                //     type: "delete-room",
                //     room: room
                // }
                // wsRelay.send(JSON.stringify(deleteRoom));
                await clientSub.unsubscribe(room);
            }
        })

    });

    app.get("/", (_, res) => {
        console.log("helooo");
        return res.send("heyy");
    })


    return new Promise<[Server, WebSocketServer, ClientType, ClientType]>((res, _) => {
        const serverinstance = server.listen(port, () => {
            console.log("server running on ", port);
            res([serverinstance, wss, client, clientSub]);
        });
    })


}
