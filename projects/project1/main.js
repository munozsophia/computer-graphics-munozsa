// we add shapes (like lines) to this canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let level = 1;
let health = 3;
let score = 0;
let shots = [];
let frameCount = 0;
let cubeCollision = 0;
let gameOver = false;
let gameWon = false;
let startTime = Date.now();
let noDamageBonus = true;
let finalScore = 0;
let shotCooldown = 0;

const SHOT_COOLDOWN_TIME = 75;
const SHOT_SPEED = 0.3;
const SHOT_RANGE = 40;
const BUILDING_MIN_DISTANCE = 15;

function winCondition() {
    for (let i = 0; i < octahedrons.length; i++) {
        // at least a diamond left (game is not won yet)
        if (!octahedrons[i].destroyed) return;
    }

    gameWon = true;

    let elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    let baseScore = score * 100;

    finalScore = baseScore - elapsedSeconds;
    if (finalScore < 0) finalScore = 0;

    if (noDamageBonus) {
        finalScore *= 2;
    }

    console.log("You collected all the diamonds! You win!");
}

function loseCondition() {
    if (health <= 0) {
        gameOver = true;
        console.log("Game Over! Out of health.");
    }
}

function resetGame() {
    camera.x = 0;
    camera.y = 0;
    camera.z = -10;

    health = 3;
    score = 0;
    gameOver = false;
    gameWon = false;
    cubeCollision = 0;
    startTime = Date.now();
    noDamageBonus = true;
    finalScore = 0;

    for (let i = 0; i < cubes.length; i++) {
        cubes[i].destroyed = false;
    }

    for (let i = 0; i < octahedrons.length; i++) {
        octahedrons[i].destroyed = false;
    }

    for (let i = shots.length - 1; i >= 0; i--) {
        let idx = instances.indexOf(shots[i]);
        if (idx !== -1) instances.splice(idx, 1);
    }
    shots = [];
    draw();
}

function moveCube() {
    frameCount += 1;

    for (let i = 0; i < cubes.length; i++) {
        let cube = cubes[i];
        if (cube.destroyed) continue;

        let phase = cube.movePhase || 0;
        cube.position.x = cube.baseX + Math.sin(frameCount * cube.moveSpeed + phase) * cube.moveRange;
    }
}

function shoot() {
    if (shotCooldown > 0) return;

    let shot = {
        type: "shot",
        position: { x: camera.x, y: camera.y, z: camera.z },
        startZ: camera.z,
        scale: 0.8,
        color: shotColor
    };

    shots.push(shot);
    instances.push(shot);

    shotCooldown = SHOT_COOLDOWN_TIME;
}

function updateShot() {
    for (let i = shots.length - 1; i >= 0; i--) {
        let shot = shots[i];
        shot.position.z += SHOT_SPEED;

        let hit = false;

        for (let j = 0; j < cubes.length; j++) {
            let cube = cubes[j];
            if (cube.destroyed) continue;

            let halfX = typeof cube.scale === "number" ? cube.scale : cube.scale.x;
            let halfZ = typeof cube.scale === "number" ? cube.scale : cube.scale.z;

            if (
                shot.position.x > cube.position.x - halfX && shot.position.x < cube.position.x + halfX &&
                shot.position.z > cube.position.z - halfZ && shot.position.z < cube.position.z + halfZ
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
    if (cubeCollision > 0) cubeCollision -= 1;
    if (shotCooldown > 0) shotCooldown -= 1;

    // user collides with block, loses 1 health
    for (let i = 0; i < cubes.length; i++) {
        let cube = cubes[i];
        if (cube.destroyed) continue;

        let halfX = typeof cube.scale === "number" ? cube.scale : cube.scale.x;
        let halfZ = typeof cube.scale === "number" ? cube.scale : cube.scale.z;

        if (
            camera.x > cube.position.x - halfX && camera.x < cube.position.x + halfX &&
            camera.z > cube.position.z - halfZ && camera.z < cube.position.z + halfZ
        ) {
            let overlapX = halfX - Math.abs(camera.x - cube.position.x);
            let overlapZ = halfZ - Math.abs(camera.z - cube.position.z);

            if (overlapX < overlapZ) {
                camera.x += camera.x < cube.position.x ? -overlapX : overlapX;
            } else {
                camera.z += camera.z < cube.position.z ? -overlapZ : overlapZ;
            }

            if (cubeCollision <= 0) {
                health -= 1;
                noDamageBonus = false;
                cubeCollision = 30;
                console.log("Hit a block! Health: ", health);
            }           
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

function regenerateBuildings() {
    for (let i = 0; i < buildings.length; i++) {
        let building = buildings[i];

        while (building.position.z < camera.z + BUILDING_MIN_DISTANCE) {
            building.position.z += BUILDING_SPAN;
        }
        while (building.position.z > camera.z + BUILDING_MIN_DISTANCE + BUILDING_SPAN) {
            building.position.z -= BUILDING_SPAN;
        }
    }
}

function checkEdge() {
    let halfWidth = floor.scale.x;

    if (camera.x < -halfWidth || camera.x > halfWidth) {
        gameOver = true;
        console.log("Game Over! You fell off the floor!");
    }
}

function drawGameOver() {
    ctx.fillStyle = "#240404";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "Red";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    ctx.font = "20px Arial";
    ctx.fillText("Press R to Try Again", canvas.width / 2, canvas.height / 2 + 40);
}

function drawWin() {
    ctx.fillStyle = "#041d08";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#7CD957";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = "20px Arial";
    ctx.fillText("Final Score: " + finalScore, canvas.width / 2, canvas.height / 2 + 20);
    if (noDamageBonus) {
        ctx.fillText("No Damage Taken - 2x Bonus!", canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText("Press R to Play Again", canvas.width / 2, canvas.height / 2 + 80);
    } else {
        ctx.fillText("Press R to Play Again", canvas.width / 2, canvas.height / 2 + 50);
    }
}

function drawHUD() {
    let collected = 0;
    for (let i = 0; i < octahedrons.length; i++) {
        if (octahedrons[i].destroyed) collected += 1;
    }

    let elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    ctx.fillStyle = "#F2F2F2";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";

    ctx.fillText("Health: " + health, 20, canvas.height - 60);
    ctx.fillText("Diamonds: " + collected + " / " + octahedrons.length, 20, canvas.height - 40);
    ctx.fillText("Time: " + elapsedSeconds + "s", 20, canvas.height - 20);
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
    if (gameOver) {
        drawGameOver();
        return;
    }

    if (gameWon) {
        drawWin();
        return;
    }

    floor.position.z = camera.z;
    regenerateFloorGrids();
    regenerateBuildings();
    moveCube();
    collisionDetection();
    checkEdge();
    loseCondition();
    winCondition();
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

    drawHUD();
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