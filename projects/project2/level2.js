// level2.js
// Level 2: the landscape based on NASA Moon data

const LEVEL2_HEIGHT_FILE = "images/moon-height.png";
const LEVEL2_COLOR_FILE = "images/moon-color.png";

const LEVEL2_WORLD_SIZE = 40;
const LEVEL2_BASE_HEIGHT = 0.3;
const LEVEL2_HEIGHT_SCALE = 6;
const LEVEL2_COLOR_BOOST = 1.5;
const LEVEL2_RESOLUTIONS = [16, 32, 64, 128, 256, 512];
const LEVEL2_ORBIT_RADIUS = 38;
const LEVEL2_ORBIT_HEIGHT = 21;
const LEVEL2_ORBIT_SPEED = 0.15;

let level2Resolution = 128;
let level2Orbit = true;
let level2Angle = 0.6;
let level2LastTime = null;
let level2Active = false;

let level2Data = null; // { size, height: Float32Array, color: Float32Array }
let level2Status = "loading"; // "loading" | "ready" | "error"
let level2Error = "";

// load images and read their pixels
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not load " + url));
        image.src = url;
    });
}

function readPixels(image) {
    const hidden = document.createElement("canvas");

    hidden.width = image.width;
    hidden.height = image.height;

    const context = hidden.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, image.width, image.height); // rgba bytes
}

function loadLevel2Images() {
    if (level2Status === "ready") {
        return Promise.resolve();
    }

    level2Status = "loading";

    return Promise.all([loadImage(LEVEL2_HEIGHT_FILE), loadImage(LEVEL2_COLOR_FILE)])
        .then(([heightImage, colorImage]) => {
            const heightPixels = readPixels(heightImage);
            const colorPixels = readPixels(colorImage);

            if (heightPixels.width !== colorPixels.width || heightPixels.height !== colorPixels.height) {
                throw new Error("moon-height.png and moon-color.png must be the same size.");
            }

            const w = heightPixels.width;
            const h = heightPixels.height;

            const height = new Float32Array(w * h);
            const color = new Float32Array(w * h * 3);

            for (let i = 0; i < w * h; i++) {
                height[i] = heightPixels.data[i * 4] / 255;
                color[i * 3 + 0] = colorPixels.data[i * 4 + 0] / 255;
                color[i * 3 + 1] = colorPixels.data[i * 4 + 1] / 255;
                color[i * 3 + 2] = colorPixels.data[i * 4 + 2] / 255;
            }

            level2Data = { width: w, height: h, heights: height, colors: color };
            level2Status = "ready";
        })
        .catch((error) => {
            level2Status = "error";
            level2Error = error.message;
        });
}

// sample images for one cube
function sampleBlock(data, col, row, n) {
    // Calculate the starting and ending coordinates for the current block based on the column, row, and number of blocks (n)
    const x0 = Math.floor(col * data.width / n);
    const x1 = Math.max(x0 + 1, Math.floor((col + 1) * data.width / n));
    const y0 = Math.floor(row * data.height / n);
    const y1 = Math.max(y0 + 1, Math.floor((row + 1) * data.height / n));

    let h = 0, r = 0, g = 0, b = 0, count = 0;

    for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
            const p = y * data.width + x;

            // accumulate height and color values for the current block
            h += data.heights[p];
            r += data.colors[p * 3 + 0];
            g += data.colors[p * 3 + 1];
            b += data.colors[p * 3 + 2];
            count++;
        }
    }
    return { height: h / count, r: r / count, g: g / count, b: b / count };
}

function buildMoonLandscape(n) {
    const list = createInstanceList(n * n);
    const cell = LEVEL2_WORLD_SIZE / n;

    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            const sample = sampleBlock(level2Data, col, row, n);
            const h = LEVEL2_BASE_HEIGHT + sample.height * LEVEL2_HEIGHT_SCALE;

            const x = (col + 0.5) * cell - LEVEL2_WORLD_SIZE / 2;
            const z = (row + 0.5) * cell - LEVEL2_WORLD_SIZE / 2;

            // Calculate the model matrix for the current block
            const model = mat4.multiply(
                mat4.translation(x, h / 2, z),
                mat4.scaling(cell / 2, h / 2, cell / 2)
            );

            // Apply color boost to the sample colors
            const tr = Math.min(1, sample.r * LEVEL2_COLOR_BOOST);
            const tg = Math.min(1, sample.g * LEVEL2_COLOR_BOOST);
            const tb = Math.min(1, sample.b * LEVEL2_COLOR_BOOST);

            setInstance(list, (row * n + col), model, tr, tg, tb);
        }
    }
    return list;
}

function updateLevel2Readout() {
    // Update the readout element with the current level 2 status
    const readout = document.getElementById("level2-count");
    if (!readout) return;

    if (level2Status === "ready") {
        readout.textContent = (level2Resolution * level2Resolution).toLocaleString() + " cubes";
    } else if (level2Status === "loading") {
        readout.textContent = "Loading images...";
    } else {
        readout.textContent = level2Error + " Serve the folder with a local server and check the file names."
    }
}

// Rebuild the level 2 landscape based on the current status and resolution
function rebuildLevel2() {
    if (level2Status !== "ready") {
        uploadInstances(createInstanceList(0));
        updateLevel2Readout();
        return;
    }
    uploadInstances(buildMoonLandscape(level2Resolution));
    updateLevel2Readout();
}

function setupLevel2() {
    level2Active = true;

    camera.target = [0, 1.5, 0];
    camera.up = [0, 1, 0];

    setCubeColorSet("terrain");
    renderSettings.useLighting = true;
    level2LastTime = null;

    rebuildLevel2();
    loadLevel2Images().then(() => {
        if (level2Active) {
            rebuildLevel2();
        }
    });
}

function updateLevel2(timeSeconds) {
    // Calculate the time delta since the last update
    const dt = level2LastTime === null ? 0 : Math.min(timeSeconds - level2LastTime, 0.1);
    level2LastTime = timeSeconds;

    // Update the camera position based on the orbit angle
    if (level2Orbit) {
        level2Angle += dt * LEVEL2_ORBIT_SPEED;
    }

    // Update the camera eye position based on the orbit angle and radius
    camera.eye = [
        camera.target[0] + LEVEL2_ORBIT_RADIUS * Math.cos(level2Angle),
        LEVEL2_ORBIT_HEIGHT,
        camera.target[2] + LEVEL2_ORBIT_RADIUS * Math.sin(level2Angle)
    ];
}

// Leave the level 2 landscape and deactivate it
function leaveLevel2() {
    level2Active = false;
}

function buildLevel2Options(container) {
    // Create a label and select element for choosing the level 2 resolution
    const label = document.createElement("label");
    label.textContent = "Resolution: ";
    const select = document.createElement("select");

    // Populate the select element with the available resolutions
    for (const n of LEVEL2_RESOLUTIONS) {
        const option = document.createElement("option");

        option.value = n;
        option.textContent = n + " x " + n;
        option.selected = n === level2Resolution;
        select.appendChild(option);
    }

    // Add an event listener to update the level 2 resolution when the select element changes
    select.addEventListener("change", () => {
        level2Resolution = Number(select.value);
        rebuildLevel2();
    });

    // Append the select element to the label and the label to the container
    label.appendChild(select);
    container.appendChild(label);

    const orbitLabel = document.createElement("label");
    const orbitBox = document.createElement("input");

    // Create a checkbox for enabling or disabling the orbit camera
    orbitBox.type = "checkbox";
    orbitBox.checked = level2Orbit;
    orbitBox.addEventListener("change", () => { level2Orbit = orbitBox.checked; });
    
    // Append the checkbox and label to the container
    orbitLabel.appendChild(orbitBox);
    orbitLabel.appendChild(document.createTextNode(" Orbit camera"));
    container.appendChild(orbitLabel);
    
    const count = document.createElement("span");
    count.id = "level2-count";
    container.appendChild(count);

    // Append the count span to the container
    const note = document.createElement("span");
    note.className = "note";
    note.textContent = "Source: NASA SVG CGI Moon Kit. Larger grids need a performant computer.";
    container.appendChild(note);

    updateLevel2Readout();
}