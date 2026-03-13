"use client"

import { useContext, useRef, useState } from "react"
import { PlayerContext } from "./_context/playerContext";

export interface IRoomCreate {
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

export default function Chatbar() {
    const [input, setInput] = useState<string>("");
    const useridRef = useRef<number>(0);

    const ctx = useContext(PlayerContext);
    if (!ctx) {
        throw new Error("Chatbar must be used inside PlayerProvider");
    }
    const { room, ws1, chat } = ctx;

    function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!ws1) {
            return;
        }

        useridRef.current = useridRef.current || 1000 + Math.floor(Math.random() * 9000);

        const chatmessage: IMessage = {
            type: "chat",
            room: room,
            message: input,
            userid: useridRef.current,
        }
        ws1.send(JSON.stringify(chatmessage));

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
