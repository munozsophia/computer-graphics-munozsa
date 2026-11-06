// level1.js
// Level 1: Procedural Cube Landscape
//   1a a grid of cubes laid out on the x-z plane
//   1b each cube stretched in y by a procedure
//   1c vertex colors from a procedure, blended by the fragment shader
//   1d a camera that orbits the landscape, looking at the center

const LEVEL1_WORLD_SIZE = 40; // Landscape size in units
const LEVEL1_HEIGHT_SCALE = 2.5; // Scale factor for cube heights
const LEVEL1_RESOLUTIONS = [32, 64, 128, 256]; // Available resolutions for the landscape grid
const LEVEL1_ORBIT_RADIUS = 38;
const LEVEL1_ORBIT_HEIGHT = 21;
const LEVEL1_ORBIT_SPEED = 0.15;

let level1Resolution = 128;
let level1Orbit = true;
let level1Angle = 0.6;
let level1LastTime = null;
let level1Instances = null;

// random number
function makeRandom(seed) {
    return function () {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const level1Random = makeRandom(2024);
const LEVEL1_CRATERS = [];

for (let i = 0; i < 9; i++) {
    LEVEL1_CRATERS.push({
        x: (level1Random() - 0.5) * LEVEL1_WORLD_SIZE * 0.8,
        z: (level1Random() - 0.5) * LEVEL1_WORLD_SIZE * 0.8,
        radius: 2.5 + level1Random() * 4.5,
        depth: 0.5 + level1Random() * 0.7,
        rim: 0.2 + level1Random() * 0.3
    });
}

function cellNoise(col, row) {
    const s = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
    return s - Math.floor(s);
}

// 1b: the height procedure
// given a world position (x, z), return the height (y) of the landscape at that point
function proceduralHeight(x, z) {
    // rolling ground made of two sine waves
    let h = 1.6;
    h += 0.35 * Math.sin(x * 0.22 + 1.0) * Math.cos(z * 0.19 + 0.5);
    h += 0.18 * Math.sin(x * 0.61 + z * 0.47);

    // craters
    for (const c of LEVEL1_CRATERS) {
        const d = Math.hypot(x - c.x, z - c.z) / c.radius; // 0 at center, 1 at the rim

        if (d < 1) {
            h -= c.depth * (1 - d * d); // smooth crater depth
        }
        const rimOffset = (d - 1.05) * 3;
        h += c.rim * Math.exp(-rimOffset * rimOffset); // bump around the edge
    }
    return Math.max(0.15, h);
}

// 1c: the tint procedure
function terrainTint(t) {
    const low = [0.55, 0.55, 0.65];
    const high = [1.0, 0.94, 0.82];
    return [
        low[0] + (high[0] - low[0]) * t,
        low[1] + (high[1] - low[1]) * t,
        low[2] + (high[2] - low[2]) * t
    ];
}

// 1a + 1b: build a cube instance per grid cell
function buildLandscape(n) {
    const list = createInstanceList(n * n);
    const cell = LEVEL1_WORLD_SIZE / n; // size of each grid cell

    // pass 1: heights (and their range for coloring)
    const heights = new Float32Array(n * n);
    let minH = Infinity;
    let maxH = -Infinity;

    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            const x = (col + 0.5) * cell - LEVEL1_WORLD_SIZE / 2;
            const z = (row + 0.5) * cell - LEVEL1_WORLD_SIZE / 2;
            const h = (proceduralHeight(x, z) + cellNoise(col, row) * 0.08) * LEVEL1_HEIGHT_SCALE;

            heights[row * n + col] = h;
            minH = Math.min(minH, h);
            maxH = Math.max(maxH, h);
        }
    }

    // pass 2: one mode matrix + tint per cube
    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            const i = row * n + col;
            const h = heights[i];
            const x = (col + 0.5) * cell - LEVEL1_WORLD_SIZE / 2;
            const z = (row + 0.5) * cell - LEVEL1_WORLD_SIZE / 2;

            // cube model is 2x2x2
            //     SCALE: cell / 2 wide in x and z, h /2 in y -> column cell wide and h tall
            //     TRANSLATE: x, z place it in the grid, y = h / 2 lifts it so its bottom sits at y = 0
            const model = mat4.multiply(
                mat4.translation(x, h / 2, z),
                mat4.scaling(cell / 2, h / 2, cell / 2)
            );

            const tint = terrainTint((h - minH) / (maxH - minH));
            setInstance(list, i, model, tint[0], tint[1], tint[2]);
        }
    }
    return list;
}

function updateLevel1Readout() {
    const readout = document.getElementById("level1-count");
    if (readout) {
        readout.textContent = (level1Resolution * level1Resolution).toLocaleString() + " Cubes";
    }
}

function rebuildLevel1() {
    level1Instances = buildLandscape(level1Resolution);
    uploadInstances(level1Instances);
    updateLevel1Readout();
}

function setupLevel1() {
    camera.target = [0, 1.5, 0]; // look at center of landscape
    camera.up = [0, 1, 0];
    camera.fov = 45 * Math.PI / 180;

    setCubeColorSet("terrain");
    renderSettings.useLighting = true;

    level1LastTime = null;
    rebuildLevel1();
}

// 1d: orbit camera
function updateLevel1(timeSeconds) {
    const dt = level1LastTime === null ? 0 : Math.min(timeSeconds - level1LastTime, 0.1);
    level1LastTime = timeSeconds;

    if (level1Orbit) {
        level1Angle += dt * LEVEL1_ORBIT_SPEED;
    }

    camera.eye = [
        camera.target[0] + LEVEL1_ORBIT_RADIUS * Math.cos(level1Angle),
        LEVEL1_ORBIT_HEIGHT,
        camera.target[2] + LEVEL1_ORBIT_RADIUS * Math.sin(level1Angle)
    ];
}

// controls shown under the header while level is selected
function buildLevel1Options(container) {
    const label = document.createElement("label");
    label.textContent = "Grid: ";
    const select = document.createElement("select");

    for (const n of LEVEL1_RESOLUTIONS) {
        const option = document.createElement("option");
        option.value = n;
        option.textContent = n + " x " + n;
        option.selected = n === level1Resolution;
        select.appendChild(option);
    }
    select.addEventListener("change", () => {
        level1Resolution = Number(select.value);
        rebuildLevel1();
    });
    label.appendChild(select);
    container.appendChild(label);

    const orbitLabel = document.createElement("label");
    const orbitBox = document.createElement("input");

    orbitBox.type = "checkbox";
    orbitBox.checked = level1Orbit;
    orbitBox.addEventListener("change", () => { level1Orbit = orbitBox.checked; });

    orbitLabel.appendChild(orbitBox);
    orbitLabel.appendChild(document.createTextNode(" Orbit Camera"));
    container.appendChild(orbitLabel);

    const count = document.createElement("span");
    count.id = "level1-count";
    container.appendChild(count);

    const note = document.createElement("span");
    note.className = "note";
    note.textContent = "Larger grids need a performant computer";
    container.appendChild(note);

    updateLevel1Readout();
}