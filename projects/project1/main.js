// we add shapes (like lines) to this canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let level = 1;
let health = 3;
let score = 0;
let shots = [];

const SHOT_SPEED = 0.3;
const SHOT_RANGE = 40;

function shoot() {
    let shot = {
        type: "shot",
        position: { x: camera.x, y: camera.y, z: camera.z },
        startZ: camera.z,
        scale: 0.8,
        color: shotColor
    };

    shots.push(shot);
    instances.push(shot);
}

function updateShot() {
    for (let i = shots.length - 1; i >= 0; i--) {
        let shot = shots[i];
        shot.position.z += SHOT_SPEED;

        let hit = false;

        for (let j = 0; j < cubes.length; j++) {
            let cube = cubes[j];
            if (cube.destroyed) continue;

            let half = cube.scale;

            if (
                shot.position.x > cube.position.x - half && shot.position.x < cube.position.x + half &&
                shot.position.z > cube.position.z - half && shot.position.z < cube.position.z + half
            ) {
                cube.destroyed = true;
                hit = true;
                console.log("Shot destroyed a block!");
                break;
            }
        }

        if (hit || shot.position.z - shot.startZ > SHOT_RANGE) { 
            shots.splice(i, 1);

            let idx = instances.indexOf(shot);
            if (idx !== -1) instances.splice(idx, 1);
        }
    }
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

function gameLoop() {
    draw();
    // used MDN article for requestAnimationFrame() function
    // https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/requestAnimationFrame
    requestAnimationFrame(gameLoop);
}

function setLevel(change) {
    level = change;
    draw();
}

function draw() {
    floor.position.z = camera.z;
    regenerateFloorGrids();
    collisionDetection();
    updateShot();

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

requestAnimationFrame(gameLoop);