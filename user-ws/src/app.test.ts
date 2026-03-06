const hostname = "ws://localhost:5000";

describe("Chat application", () => {
    test('Message from Room 1 reaches another participant in Room 1', async () => {
        // CREATING WS CONNECTIONS
        let ws1 = new WebSocket(hostname);
        let ws2 = new WebSocket(hostname);

        function onOpenPromiseGen(ws: WebSocket) {
            return new Promise<void>((res, rej) => {
                ws.onopen = () => {
                    res();
                }
                ws.onerror = (event) => {
                    rej(event);
                }
            })
        }

        await Promise.all([onOpenPromiseGen(ws1), onOpenPromiseGen(ws2)]);

        // JOINING ROOMS

        function onmessagePromiseGen(ws: WebSocket, receivedMsg: string) {
            return new Promise<void>((res, rej) => {
                ws.onmessage = ({ data }: MessageEvent) => {
                    expect(data).toBe(receivedMsg);
                    res();
                }
                ws.onerror = (event) => {
                    rej(event);
                }
            })
        }
        //// register the message handlers
        const p1join = onmessagePromiseGen(ws1, "Joined Room 1");
        const p2join = onmessagePromiseGen(ws2, "Joined Room 1");

        ws1.send(JSON.stringify({ type: "join-room", room: "Room 1" }));
        ws2.send(JSON.stringify({ type: "join-room", room: "Room 1" }));

        await Promise.all([p1join, p2join]);
        //

        // SENDING MESSAGE (Register the async op as a promise, then only after all the sync operation that you need to
        // do, you can await that promise)
        const p1msg = onmessagePromiseGen(ws1, "hello ws2");
        const p2msg = onmessagePromiseGen(ws2, "hello ws2");

        ws1.send(JSON.stringify({ type: "chat", room: "Room 1", message: "hello ws2" }));

        await Promise.all([p1msg, p2msg]);
        ws1.close(1000, "test ws1 is closed");
        ws2.close(1000, "test ws2 is closed");

    })
})





