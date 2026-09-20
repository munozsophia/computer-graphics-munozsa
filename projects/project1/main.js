// we add shapes (like lines) to this canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let level = 1;
let health = 3;
let score = 0;

function setLevel(change) {
    level = change;
    draw();
}

// used MDN article for collisionDetection() function
// https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript/Collision_detection
function collisionDetection() {
    // user collides with block, loses 1 health
    for (let i = 0; i < cubes.length; i++) {
        let cube = cubes[i];
        if (cube.destroyed) continue;

        let half = cube.scale;

        if (
            camera.x > cube.position.x - half && camera.x < cube.position.x + half &&
            camera.z > cube.position.z - half && camera.z < cube.position.z + half
        ) {
            health -= 1;
            cube.destroyed = true;
            console.log("Hit a block! Health: ", health);
        }
    }

    // user collides with diamond, score increases 1
    for (let i = 0; i < octahedrons.length; i++) {
        let diamond = octahedrons[i];
        if (diamond.destroyed) continue;

        let half = diamond.scale;

        if (
            camera.x > diamond.position.x - half && camera.x < diamond.position.x + half &&
            camera.z > diamond.position.z - half && camera.z < diamond.position.z + half
        ) {
            score += 1;
            diamond.destroyed = true;
            console.log("Collected a diamond!", score);
        }
    }
}

function regenerateFloorGrids() {
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
}

function draw() {
    floor.position.z = camera.z;
    regenerateFloorGrids();
    collisionDetection();

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