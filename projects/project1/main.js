// we add shapes (like lines) to this canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// const rows = 200;
// const cols = 320;
// const pixelGrid = Array.from({ length: cols }, () => Array(rows).fill("#050510"));

// let seePixelOutline = true;

// // light up a couple of pixels
// setPixelColor(100, 100, "#FFFFFF");
// setPixelColor(100, 101, "#FFFFFF");
// setPixelColor(101, 100, "#FFFFFF");
// setPixelColor(101, 101, "#FFFFFF");
// setPixelColor(102, 101, "#FFFFFF");

// function draw() {
//     // here we set up and clear the canvas, every draw frame
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.fillStyle = "#050510";
//     ctx.fillRect(0, 0, canvas.width, canvas.height);

//     ctx.lineWidth = 1;
//     ctx.strokeStyle = "#444444";

//     for (v = 0; v < 200; v++) {
//         for (u = 0; u < 320; u++) {
//             console.log(u);
//             console.log(v);
//             console.log(pixelGrid[u][v]);
//             console.log("----");

//             ctx.fillStyle = pixelGrid[u][v];
//             ctx.fillRect(u*5, v*5, 5, 5);

//             if (seePixelOutline) {
//                 ctx.strokeRect(u*5, v*5, 5, 5);
//             }
//         }
//     }
// }

// function setPixelColor(u, v, color) {
//     pixelGrid[u][v] = color;
// }

// TODO: add button to toggle between levels
let level = 1;

function setLevel(change) {
    level = change;
    draw();
}

function draw() {
    floor.position.z = camera.z;

    // used AI to implement this solution
    // regenerate floor grid foward/backward
    for (let i = 0; i < floorGrids.length; i++) {
        let grid = floorGrids[i];

        while (grid.position.z < camera.z - GRID_SPACE) {
            grid.position.z += GRID_SPAN;
        }
        while (grid.position.z > camera.z + GRID_SPAN - GRID_SPACE) {
            grid.position.z -= GRID_SPAN;
        }
    }

    if (level === 0) {
        drawLevel0(ctx, canvas);
    } else if (level === 1) {
        drawLevel1(ctx, canvas);
    } else if (level === 2) {
        drawLevel2(ctx, canvas);
    } else if (level === 3) {
        drawLevel3(ctx, canvas);
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}

handleInput(draw);

window.addEventListener("resize", resizeCanvas);
resizeCanvas();