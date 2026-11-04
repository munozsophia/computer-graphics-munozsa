// main.js
// entry point for the WebGL project, initializes the scene and runs the main loop

const canvas = document.getElementById("glCanvas");

// each level is an object with same three parts:
// 1. setup function: initializes the level-specific scene and camera
// 2. update function: updates the level-specific scene each frame
// 3. info text: provides information about the level, such as controls or objectives

const levels = [
    {
        name: "Level 0: A Single Cube",
        info: "A single 2x2x2 cube. Its vertex colors come from its corner positions, and the fragment shader blends between them across each face.",
        setup: setupLevel0,
        update: updateLevel0
    },
    {
        name: "Level 1: Procedural Landscape",
        info: "A grid of cubes: translated into place, stretched in y by a crater procedure, colored by vertex colors (dark base, light top) plus a height tint, and viewed by an orbiting camera.",
        setup: setupLevel1,
        update: updateLevel1,
        buildOptions: buildLevel1Options
    }
];

let currentLevel = 0;

function setLevel(index) {
    currentLevel = index;
    levels[index].setup();
    document.getElementById("level-info").textContent = levels[index].info;

    const options  = document.getElementById("level-options");
    options.innerHTML = "";
    if (levels[index].buildOptions) {
        levels[index].buildOptions(options);
    }

    const buttons = document.querySelectorAll("#level-controls button");
    buttons.forEach((button, i) => button.classList.toggle("active", i === index));
}

function buildLevelButtons() {
    const container = document.getElementById("level-controls");

    levels.forEach((level, index) => {
        const button = document.createElement("button");
        button.textContent = level.name;
        button.addEventListener("click", () => setLevel(index));
        container.appendChild(button);
    });
}

// fps readout to check performance
let fpsFrames = 0;
let fpsLastTime = 0;

function updateFps(nowMs) {
    fpsFrames++;

    if (nowMs - fpsLastTime >= 500) {
        const fps = Math.round(fpsFrames * 1000 / (nowMs - fpsLastTime));
        document.getElementById("fps").textContent = fps + " fps";
        fpsFrames = 0;
        fpsLastTime = nowMs;
    }
}

function frame(nowMs) {
    const t = nowMs / 1000; // convert milliseconds to seconds

    resizeRenderer(canvas);
    levels[currentLevel].update(t);

    const aspect = canvas.width / canvas.height;
    renderScene(getViewProjection(aspect));
    updateFps(nowMs);

    // used MDN article for requestAnimationFrame()
    // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    requestAnimationFrame(frame);
}

function main() {
    initRenderer(canvas);
    buildLevelButtons();
    setLevel(0);
    requestAnimationFrame(frame);
}

window.addEventListener("DOMContentLoaded", main);