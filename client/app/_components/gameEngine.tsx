"use client"

import { useContext, useEffect, useRef } from "react"
import update, { IPlayerBin } from "./_services/update";
import render from "./_services/render";
import { setupHandles } from "./_services/update";
import { PlayerContext } from "./_context/playerContext";


export default function GameEngine() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D>(null);
    const initTime = useRef<DOMHighResTimeStamp>(0);
    const dataRef = useRef<ArrayBuffer>(null);

    const ctx = useContext(PlayerContext);
    if (!ctx) {
        throw new Error("GameEngine should be used inside PlayerProvider");
    }
    const { room, playeridRef, ws1 } = ctx;

    useEffect(() => {
        console.log("2 useEffect")
        if (!ws1) {
            return;
        }
        const canvas = canvasRef.current!;
        ctxRef.current = canvas.getContext("2d");
        // const dpr = window.devicePixelRatio;
        // const style = window.getComputedStyle(canvas);
        // canvas.width = parseFloat(style.width)*dpr;
        // canvas.height = parseFloat(style.height)*dpr;
        ws1.addEventListener("message", ({ data }) => {
            if (data instanceof ArrayBuffer) {
                //binaryframe
                dataRef.current = data;
            }
        })
        setupHandles();
        // document.addEventListener("keydown", drawRectangle);
        main(0);
    }, [ws1])

    function main(tFrame: DOMHighResTimeStamp) {
        requestAnimationFrame(main);

        const player = update(tFrame);

        player.playerid = playeridRef.current;
        player.room = room;

        // client player props sent to server

        const buffer = binaryConverter(player);
        ws1!.send(buffer);

        // the flow from the ws1.onmessage binary should be the one that should be given here. Until then
        // it should be the client initial one. All the others are server given
        if (dataRef.current) {
            //mutates player
            binaryDecoder(player, dataRef.current);
        }

        render(player, ctxRef.current!);
        dataRef.current = null; // make it null after each ws message arrives - so that client can move in any
        // direction without lag until the packet arrives again

        // IN THE ABOVE CODE, the player moves instantaneously, but goes back to previous position once the 
        // data packet arrives from the server - Reproducing the fundamental bug of NETCODE

    }

    return (
        <canvas ref={canvasRef} width={320} height={180} className="bg-gray-400 h-full w-full pixelated">
        </canvas>
    )

}

function binaryConverter(player: IPlayerBin) {
    // Length of string, Encode the string 'Room' and embed into Arraybuffer
    const arrayBuffer = new ArrayBuffer(18);
    // Room string Length
    let uint16bufferView = new Uint16Array(arrayBuffer, 0, 2);
    uint16bufferView[0] = player.room.length;
    //Room
    const uint8bufferView = new Uint8Array(arrayBuffer, 2);
    const encoder = new TextEncoder();
    const strTypedArray = encoder.encode(player.room);
    uint8bufferView.set(strTypedArray, 0);

    uint16bufferView = new Uint16Array(arrayBuffer, 2 + strTypedArray.length, 2);
    uint16bufferView[0] = player.playerid;
    // Embed playerid, x, y, vx, vy in the same order
    const int16bufferView = new Int16Array(arrayBuffer, 4 + strTypedArray.length);
    int16bufferView[0] = player.x;
    int16bufferView[1] = player.y;
    int16bufferView[2] = player.vx;
    int16bufferView[3] = player.vy;

    console.log("Arraybuffer as it is ",arrayBuffer)
    const view = new DataView(arrayBuffer);
    console.log(view.getUint16(0, true));
    return arrayBuffer;
}
function binaryDecoder(player: IPlayerBin, data: ArrayBuffer) {
    //((I use Dataview instead of TypedArrays to get a view of ArrayBuffer bcs I need to
    // store different datatypes inside the ArrayBuffer))
    const view = new DataView(data);

    // string would be encoded like this : 12encodedstring where 12 is the length of encoded bytes (same 
    // as the number of chars - which would be stored in a fixed memory like int8 or int16)

    // ArrayBuffer is of 11 bytes + 6 bytes
    const strlength = view.getUint16(0, true); // endianness should be little endian - as it's written in the 
    // arraybuffer as littleendian when written by using views
    const typedArray = new Uint8Array(data, 2, strlength); //strlength would be 6 chars ie; 6 bytes: Room 1, Room 2 ,etc..
    const decoder = new TextDecoder();
    player.room = decoder.decode(typedArray);
    player.playerid = view.getUint16(strlength + 2, true)
    player.x = view.getInt16(strlength + 4, true);
    player.y = view.getInt16(strlength + 6, true);
    player.vx = view.getInt16(strlength + 8, true);
    player.vy = view.getInt16(strlength + 10, true);
}
