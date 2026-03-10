"use client"

import { useEffect, useRef, useState } from "react"

interface IRoomCreate {
    type: "join-room";
    room: string;
}
interface IMessage {
    type: "chat";
    room: string;
    message: string;
    userid: number;
}
export type ClientMessage =
    | IRoomCreate
    | IMessage

const ROOM = "Room 1";
export default function Chatbar() {
    const [chat, setChat] = useState<string>("");
    const [input, setInput] = useState<string>("");
    const [error, setError] = useState<boolean>();
    const useridRef = useRef<number>(0);
    const ws1Ref = useRef<WebSocket>(null);

    useEffect(() => {
        const HOST_PORT = "8080";
        const HOST_NAME = `ws://localhost:${HOST_PORT}`;
        let ws1: WebSocket;

        async function establishWs() {
            ws1Ref.current = new WebSocket(HOST_NAME);
            ws1 = ws1Ref.current;
            try {
                await new Promise<void>((res, rej) => {
                    ws1.onopen = () => {
                        res();
                    }
                    ws1.onerror = (e) => {
                        console.log(e);
                        rej(e);
                    }
                })

            } catch (err) {
                setError(true);
            }
            ws1.onmessage = ({ data }) => {
                const parsedData: ClientMessage = JSON.parse(data);

                if (parsedData.type === "chat") {
                const usermessage = `${parsedData.userid}: ${parsedData.message}`
                    setChat(chat => (chat + "\n" + usermessage));
                }
                if (parsedData.type === "join-room") {
                    setChat(chat => (
                        chat ? chat + "\n" + "Anonymous joined the chat !!" : "Anonymous joined the chat !!"
                    ));
                }
            }
            const joinroom: IRoomCreate = {
                type: "join-room",
                room: ROOM
            }
            ws1?.send(JSON.stringify(joinroom));

        }
        establishWs();


        return () => {
            ws1.close();
        }
    }, []);

    function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        const ws1 = ws1Ref.current;

        useridRef.current = useridRef.current || 1000 + Math.floor(Math.random() * 9000);

        const chatmessage: IMessage = {
            type: "chat",
            room: ROOM,
            message: input,
            userid: useridRef.current,
        }
        ws1?.send(JSON.stringify(chatmessage));

        setInput("");

    }
    return (
        <form onSubmit={onSubmit}
            className="flex flex-col w-100 justify-end bg-gray-200 text-center p-2 gap-2 border border-black h-full">
            <textarea readOnly name="chatarea" id="chatarea" value={chat}
                className="p-2 resize-none bg-white h-full">
            </textarea>

            <input type="text" id="chat" name="chat"
                onChange={(e) => setInput(e.target.value)}
                value={input}
                className=" p-2 bg-white border border-black w-full h-10 " />
        </form>
    )
}
