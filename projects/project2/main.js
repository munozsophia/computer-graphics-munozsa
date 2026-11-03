// main.js
// entry point for the WebGL project, initializes the scene and runs the main loop

const canvas = document.getElementById("glCanvas");

// each level is an object with same three parts:
// 1. setup function: initializes the level-specific scene and camera
// 2. update function: updates the level-specific scene each frame
// 3. info text: provides information about the level, such as controls or objectives

const levels = [
    {
        name: "Level 0: A Cube",
        info: "A single 2x2x2 cube.",
        setup: setupLevel0,
        update: updateLevel0
    }
];

let currentLevel = 0;

function setLevel(index) {
    currentLevel = index;
    levels[index].setup();
    document.getElementById("level-info").textContent = levels[index].info;

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

function frame(nowMs) {
    const t = nowMs / 1000; // convert milliseconds to seconds

    resizeRenderer(canvas);
    levels[currentLevel].update(t);

    const aspect = canvas.width / canvas.height;
    renderScene(getViewProjection(aspect));

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