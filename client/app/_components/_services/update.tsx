// Add event listeners globally
let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;

export function setupHandles() {
    document.addEventListener("keydown", (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable) {
            return;
        }

        switch (e.code) {
            case "KeyW":
                upPressed = true;
                break;
            case "KeyS":
                downPressed = true;
                break;
            case "KeyA":
                leftPressed = true;
                break;
            case "KeyD":
                rightPressed = true;
                break;
        }
    })
    document.addEventListener("keyup", (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable) {
            return;
        }
        switch (e.code) {
            case "KeyW":
                upPressed = false;
                break;
            case "KeyS":
                downPressed = false;
                break;
            case "KeyA":
                leftPressed = false;
                break;
            case "KeyD":
                rightPressed = false;
                break;
        }
    })
};


// State at Global scope
let lastTime = 0;
// export let game: IGame = {
//     player: {
//         x: 50,
//         y: 50,
//         vx: 0.1, // constant speed
//         vy: 0.1, // constant speed
//     }
// };


export interface IPlayerBin {
    room: string;
    playerid: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}


export default function update(tFrame: DOMHighResTimeStamp) {
    const player: IPlayerBin = {
        room: "",
        playerid: 0,
        x: 50,
        y: 50,
        vx: 0.1,
        vy: 0.1,
    }
    const dt = tFrame - lastTime;
    lastTime = tFrame;

    if (rightPressed) {
        player.x += player.vx * dt;
    }
    if (leftPressed) {
        player.x -= player.vx * dt;
    }
    if (upPressed) {
        player.y -= player.vy * dt;
    }
    if (downPressed) {
        player.y += player.vy * dt;
    }

    return player;

}
