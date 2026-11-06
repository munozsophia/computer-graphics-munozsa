// level4.js
// Level 4: lighting, a skybox, atmosphere, and a realistic / colorful toggle
// needs level1.js (makeRandom, cellNoise, buildLandscape), level2.js (moon ground) and level3.js (sky objects)
// a cube with a negative red tint glows: the shader skips lighting and haze for it (sun and stars)

const LEVEL4_RESOLUTIONS = [32, 64, 128, 256];
const LEVEL4_WORLD_SIZE = 40;

// camera sweeps back and forth so the sun and earth stay in view
const LEVEL4_BASE_ANGLE = 0.9;
const LEVEL4_SWEEP = 0.5; // radians each way
const LEVEL4_SWEEP_SPEED = 0.4; // radians per second of the sweep's sine wave
const LEVEL4_ORBIT_RADIUS = 55;
const LEVEL4_EYE_HEIGHT = 18;
const LEVEL4_TARGET = [0, 11, 0];

const LEVEL4_STAR_COUNT = 700;
const LEVEL4_STAR_RADIUS = 280;
const LEVEL4_SUN_DISTANCE = 260;
const LEVEL4_EARTH_CELLS = 10; // Earth is a sphere of cubes, 10 cubes in radius
const LEVEL4_EARTH_CELL_SIZE = 3;
const LEVEL4_EARTH_POSITION = [
    230 * Math.cos(LEVEL4_BASE_ANGLE + Math.PI + 0.2),
    62,
    230 * Math.sin(LEVEL4_BASE_ANGLE + Math.PI + 0.2)
];

// the two looks
const LEVEL4_STYLES = {
    realistic: {
        clear: [0.02, 0.02, 0.063],
        fog: [0.1, 0.11, 0.2], fogAmount: 0.7,
        colorSteps: 0, ambient: 0.22,
        sunCore: [1.0, 0.97, 0.85], sunRays: [1.0, 0.82, 0.45],
        stars: [[1, 1, 1], [0.8, 0.88, 1], [1, 0.93, 0.8]], starSize: [0.35, 0.95],
        earth: { ocean: [0.08, 0.22, 0.6], land: [0.2, 0.5, 0.2], desert: [0.62, 0.52, 0.3], ice: [0.95, 0.97, 1.0], cloud: [1, 1, 1] }
    },
    colorful: {
        clear: [0.17, 0.1, 0.38],
        fog: [0.55, 0.3, 0.8], fogAmount: 0.8,
        colorSteps: 3, ambient: 0.4,
        sunCore: [1.0, 0.9, 0.25], sunRays: [1.0, 0.55, 0.2],
        stars: [[1, 0.5, 0.8], [1, 0.95, 0.4], [0.4, 0.95, 1], [1, 1, 1]], starSize: [0.8, 2.0],
        earth: { ocean: [0.15, 0.55, 1.0], land: [0.4, 0.95, 0.3], desert: [1.0, 0.8, 0.3], ice: [1, 1, 1], cloud: [1, 0.9, 1] }
    }
};

let level4Style = "realistic";
let level4GroundKind = "moon";
let level4Resolution = 64;
let level4Orbit = true;
let level4Haze = true;
let level4Shadows = true;
let level4SunAnimate = true;
let level4SunAzimuth = LEVEL4_BASE_ANGLE + Math.PI - 0.55; // radians
let level4SunElevation = 24 * Math.PI / 180; // radians
let level4Phase = 0;
let level4LastTime = null;
let level4Active = false;

let level4List = null;
let level4GroundCount = 0;
let level4GroundN = 0;
let level4Heights = null; // top height of every ground column
let level4BaseTints = null; // the ground's tints before shadows (3 floats per cube)
let level4Shadow = null; // 1 = lit, less than 1 = in shadow
let level4Stars = []; // { local: mat4, tint }
let level4EarthCubes = []; // { local: mat4, tint }
let level4CloudCubes = [];
let level4ShadowDirty = true;
let level4ShadowAz = 0;
let level4ShadowEl = 0;
let level4ShadowTime = 0;
const level4Random = makeRandom(4242);

function glowTint(color) {
    return [-Math.max(color[0], 0.01), color[1], color[2]]; // negative red = glow
}

// linear interpolation
function lerpColor(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function sunDirection() {
    const c = Math.cos(level4SunElevation);
    return [c * Math.cos(level4SunAzimuth), Math.sin(level4SunElevation), c * Math.sin(level4SunAzimuth)];
}

// ground: built like levels 1 and 2, colorful style swaps in a banded candy gradient
const COLORFUL_GROUND_STOPS = [
    [0.3, 0.35, 0.95], [0.2, 0.85, 0.8], [0.55, 0.95, 0.4], [1.0, 0.85, 0.3], [1.0, 0.5, 0.6]
];

// colorful ground color
function colorfulGroundColor(t) {
    const band = Math.min(4, Math.floor(t * 5)) / 4; // snap to 5 flat bands
    const scaled = band * (COLORFUL_GROUND_STOPS.length - 1);
    const i = Math.min(COLORFUL_GROUND_STOPS.length - 2, Math.floor(scaled));
    return lerpColor(COLORFUL_GROUND_STOPS[i], COLORFUL_GROUND_STOPS[i + 1], scaled - i);
}

function buildLevel4Ground() {
    let ground;
    if (level4GroundKind === "moon" && level2Status === "ready") {
        ground = buildMoonLandscape(level4Resolution);
    } else {
        ground = buildLandscape(level4Resolution);
    }
    level4GroundN = level4Resolution;
    level4GroundCount = ground.length / INSTANCE_FLOATS;

    // pull each column's height, stored in its model matrix and tint back out
    level4Heights = new Float32Array(level4GroundCount);
    level4BaseTints = new Float32Array(level4GroundCount * 3);
    
    // initialize min and max heights for normalization
    let minH = Infinity, maxH = -Infinity;

    // extract heights and base tints from the ground data
    for (let i = 0; i < level4GroundCount; i++) {
        // calculate the offset for the current instance in the ground data array
        const o = i * INSTANCE_FLOATS;
        level4Heights[i] = ground[o + 5] * 2; // y scale = h/2
        // update the minimum and maximum heights
        minH = Math.min(minH, level4Heights[i]);
        maxH = Math.max(maxH, level4Heights[i]);

        // extract the base tint for the current instance
        level4BaseTints[i * 3] = ground[o + 16];
        level4BaseTints[i * 3 + 1] = ground[o + 17];
        level4BaseTints[i * 3 + 2] = ground[o + 18];
    }
    if (level4Style === "colorful") {
        for (let i = 0; i < level4GroundCount; i++) {
            // calculate the color based on the normalized height
            const c = colorfulGroundColor((level4Heights[i] - minH) / Math.max(0.001, maxH - minH));
            // update the base tint with the calculated color
            level4BaseTints.set(c, i * 3);
        }
    }
    // initialize all ground columns as lit
    level4Shadow = new Float32Array(level4GroundCount).fill(1);
    return ground;
}

// shadows: march from each ground column toward the sun, if a taller column blocks it the column is in shadow
function computeShadows() {
    const n = level4GroundN;
    const cell = LEVEL4_WORLD_SIZE / n; // calculate the size of each grid cell
    level4Shadow.fill(1);

    const sun = sunDirection(); // get the sun direction
    const horizontal = Math.hypot(sun[0], sun[2]); // calculate the horizontal distance from the sun direction
    
    if (!level4Shadows || sun[1] < 0.03 || horizontal < 0.0001) {
        return; // sun below the horizon or straight up
    }
    const dx = sun[0] / horizontal;
    const dz = sun[2] / horizontal;

    const slope = sun[1] / horizontal; // height gained per unit of horizontal travel
    const stride = Math.max(cell, 0.35); // set the minimum stride to avoid tiny steps
    const maxSteps = Math.min(90, Math.ceil(LEVEL4_WORLD_SIZE / stride)); // limit the number of steps to avoid excessive computation

    // iterate over each ground column to calculate its shadow
    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            const i = row * n + col; // calculate the index of the current ground column
            const x = (col + 0.5) * cell - LEVEL4_WORLD_SIZE / 2; // calculate the x coordinate of the current ground column
            const z = (row + 0.5) * cell - LEVEL4_WORLD_SIZE / 2; // calculate the z coordinate of the current ground column
            const h0 = level4Heights[i]; // get the height of the current ground column

            for (let k = 1; k <= maxSteps; k++) { // march toward the sun in steps
                const px = x + dx * stride * k; // calculate the x coordinate of the current step
                const pz = z + dz * stride * k; // calculate the z coordinate of the current step
                const c = Math.floor((px + LEVEL4_WORLD_SIZE / 2) / cell); // calculate the column index of the current step
                const r = Math.floor((pz + LEVEL4_WORLD_SIZE / 2) / cell); // calculate the row index of the current step
                if (c < 0 || c >= n || r < 0 || r >= n) { // check if the current step is outside the landscape
                    break; // left the landscape: nothing blocks the sun
                }
                // check if the terrain at the current step blocks the sun
                if (level4Heights[r * n + c] > h0 + slope * stride * k + 0.02) {
                    level4Shadow[i] = 0.35;
                    break;
                }
            }
        }
    }
}

// write base tint * shadow into the ground part of the list
function applyGroundTints() {
    for (let i = 0; i < level4GroundCount; i++) {
        const o = i * INSTANCE_FLOATS; // calculate the offset of the current ground instance
        const s = level4Shadow[i]; // get the shadow of the current ground instance

        level4List[o + 16] = level4BaseTints[i * 3 + 0] * s; // apply the shadow to the red component of the ground instance
        level4List[o + 17] = level4BaseTints[i * 3 + 1] * s; // apply the shadow to the green component of the ground instance
        level4List[o + 18] = level4BaseTints[i * 3 + 2] * s; // apply the shadow to the blue component of the ground instance
    }
}

// skybox: tiny glowing star cubes on a big sphere that follows the camera
function buildStars() {
    const style = LEVEL4_STYLES[level4Style];
    level4Stars = [];
    for (let i = 0; i < LEVEL4_STAR_COUNT; i++) {
        // uniform random direction on a sphere
        const y = level4Random() * 2 - 1;
        const angle = level4Random() * Math.PI * 2;
        const ring = Math.sqrt(1 - y * y);
        const size = style.starSize[0] + (style.starSize[1] - style.starSize[0]) * level4Random() * level4Random();
        const color = style.stars[Math.floor(level4Random() * style.stars.length)];
        const bright = 0.55 + 0.45 * level4Random();

        // create the local transformation matrix for the star
        const local = mat4.multiply(
            mat4.translation(ring * Math.cos(angle) * LEVEL4_STAR_RADIUS, y * LEVEL4_STAR_RADIUS, ring * Math.sin(angle) * LEVEL4_STAR_RADIUS),
            mat4.multiply(
                mat4.rotationY(level4Random() * 6.28),
                mat4.multiply(mat4.rotationX(level4Random() * 6.28), mat4.scaling(size, size, size))
            )
        );
        level4Stars.push({ local, tint: glowTint([color[0] * bright, color[1] * bright, color[2] * bright]) });
    }
}

// earth: a sphere of cubes colored by latitude and longitude, plus a cloud shell
// used AI for earth model generation
function buildEarth() {
    const palette = LEVEL4_STYLES[level4Style].earth;
    const R = LEVEL4_EARTH_CELLS; // number of earth cells
    const size = LEVEL4_EARTH_CELL_SIZE; // size of each earth cell
    level4EarthCubes = [];
    level4CloudCubes = [];

    // iterate through the grid to build the earth and cloud shells
    for (let i = -R - 1; i <= R + 1; i++) {
        // iterate through the y dimension of the grid
        for (let j = -R - 1; j <= R + 1; j++) {
            // iterate through the z dimension of the grid
            for (let k = -R - 1; k <= R + 1; k++) {
                // calculate the distance from the center of the grid
                const r = Math.sqrt(i * i + j * j + k * k);
                // skip the center of the grid
                if (r < 0.5) {
                    continue;
                }

                // calculate the latitude and longitude of the grid cell
                const lat = Math.asin(j / r);
                const lon = Math.atan2(k, i);

                // check if the grid cell is on the earth shell
                if (r >= R - 0.5 && r < R + 0.5) {
                    // continents from a few overlapping sine waves
                    const f = Math.sin(lon * 2 + 1.2) * Math.cos(lat * 2.5)
                        + 0.6 * Math.sin(lon * 3.7 - lat * 2 + 0.5)
                        + 0.4 * Math.sin(lon * 6 + lat * 5);
                    
                    // start with the ocean color
                    let color = palette.ocean;

                    // check if the grid cell is on land
                    if (f > 0.35) {
                        color = (Math.abs(lat) < 0.5 && f > 0.9) ? palette.desert : palette.land;
                    }
                    // check if the grid cell is in a polar region
                    if (Math.abs(lat) > 1.15) {
                        color = palette.ice;
                    }
                    const shade = 0.9 + 0.2 * cellNoise(i * 7 + k, j * 3 + k); // calculate the shade for the earth cell

                    level4EarthCubes.push({
                        local: mat4.multiply(mat4.translation(i * size, j * size, k * size), mat4.scaling(size / 2, size / 2, size / 2)),
                        tint: [color[0] * shade, color[1] * shade, color[2] * shade]
                    });
                } else if (r >= R + 0.5 && r < R + 1.5) {
                    // calculate the cloud density
                    const c = Math.sin(lon * 5 + lat * 3 + 1) * Math.sin(lon * 2 - lat * 6);
                    // check if the grid cell is on a cloud
                    if (c > 0.45) {
                        level4CloudCubes.push({
                            local: mat4.multiply(mat4.translation(i * size, j * size, k * size), mat4.scaling(size / 2 * 0.9, size / 2 * 0.9, size / 2 * 0.9)),
                            tint: palette.cloud
                        });
                    }
                }
            }
        }
    }
}

// COLORFUL recoloring for the Level 3 sky objects, see skyTintHook in level3.js
function colorfulSkyTint(tint, kind) {
    // apply colorful recoloring based on the tint and kind of the sky object
    if (tint === GRAY) {
        return kind === "satellite" ? [0.45, 0.9, 0.95] : [1.0, 0.55, 0.3];
    }
    // check if the sky object is an asteroid
    if (kind === "asteroid") {
        if (tint[0] < 0.6) { return [1.0, 0.5, 0.7]; }
        if (tint[0] < 0.75) { return [0.8, 0.5, 1.0]; }
        return [1.0, 0.75, 0.35];
    }
    return tint;
}

// building the whole scene, and applying a style
function applyLevel4Style() {
    const style = LEVEL4_STYLES[level4Style];
    setClearColor(style.clear);

    renderSettings.colorSteps = style.colorSteps;
    renderSettings.ambient = style.ambient;
    renderSettings.fogColor = style.fog;
    renderSettings.fogAmount = level4Haze ? style.fogAmount : 0;
    skyTintHook = level4Style === "colorful" ? colorfulSkyTint : null;
}

function rebuildLevel4() {
    applyLevel4Style();
    const ground = buildLevel4Ground();
    buildStars();
    buildEarth();

    const skyCubes = level3Objects.reduce((n, o) => n + o.parts.length, 0);
    const total = level4GroundCount + skyCubes + level4Stars.length + 3 + level4EarthCubes.length + level4CloudCubes.length;

    level4List = createInstanceList(total);
    level4List.set(ground, 0);
    level4ShadowDirty = true;
    updateLevel4Readout();
}

function updateLevel4Readout() {
    const readout = document.getElementById("level4-count");
    if (!readout || !level4List) {
        return;
    }
    let text = (level4List.length / INSTANCE_FLOATS).toLocaleString() + " Cubes";
    if (level4GroundKind === "moon" && level2Status === "loading") {
        text += " (loading Moon images...)";
    } else if (level4GroundKind === "moon" && level2Status === "error") {
        text += " (Moon images not found, showing procedural ground)";
    }
    readout.textContent = text;
}

function loadMoonThenRebuild() {
    if (level4GroundKind === "moon" && level2Status !== "ready") {
        loadLevel2Images().then(() => {
            if (level4Active) {
                rebuildLevel4();
            }
        });
    }
}

function setupLevel4() {
    level4Active = true;
    camera.up = [0, 1, 0];
    camera.target = LEVEL4_TARGET.slice();
    // the field of view is left as Level 0 set it, 45 degrees

    setCubeColorSet("terrain");
    renderSettings.useLighting = true;
    level4LastTime = null;

    buildSkyObjects(); // the satellites, astronauts and asteroids from Level 3
    rebuildLevel4();
    loadMoonThenRebuild();
}

// every frame: camera, sun, shadows
function updateLevel4(timeSeconds) {
    // calculate the time difference since the last frame
    const dt = level4LastTime === null ? 0 : Math.min(timeSeconds - level4LastTime, 0.1);
    level4LastTime = timeSeconds;

    // camera sweeps back and forth, always looking at the landscape
    if (level4Orbit) {
        level4Phase += dt * LEVEL4_SWEEP_SPEED;
    }

    // calculate the camera angle based on the sweep phase
    const angle = LEVEL4_BASE_ANGLE + LEVEL4_SWEEP * Math.sin(level4Phase);
    camera.eye = [
        camera.target[0] + LEVEL4_ORBIT_RADIUS * Math.cos(angle),
        LEVEL4_EYE_HEIGHT,
        camera.target[2] + LEVEL4_ORBIT_RADIUS * Math.sin(angle)
    ];

    // the sun: day cycle moves it around the horizon; it is the light
    if (level4SunAnimate) {
        level4SunAzimuth += dt * 0.12;
        const slider = document.getElementById("level4-azimuth");
        // update the azimuth slider to match the sun's position
        if (slider) {
            slider.value = Math.round((((level4SunAzimuth * 180 / Math.PI) % 360) + 360) % 360);
        }
    }
    const sun = sunDirection();
    renderSettings.lightDir = sun;

    // shadows only need recomputing when the sun has moved a little
    const moved = Math.abs(level4SunAzimuth - level4ShadowAz) > 0.03 || Math.abs(level4SunElevation - level4ShadowEl) > 0.02;

    // recompute shadows when they are dirty or the sun has moved enough
    if (level4ShadowDirty || (level4Shadows && moved && timeSeconds - level4ShadowTime > 0.15)) {
        computeShadows();
        applyGroundTints();
        level4ShadowDirty = false;
        level4ShadowAz = level4SunAzimuth;
        level4ShadowEl = level4SunElevation;
        level4ShadowTime = timeSeconds;
    }

    let index = level4GroundCount;

    // level 3's Bezier sky objects
    index = updateSkyObjects(dt, timeSeconds, index, level4List);

    // skybox stars: follow the camera, turn very slowly
    const skyBase = mat4.multiply(
        mat4.translation(camera.eye[0], camera.eye[1], camera.eye[2]),
        mat4.rotationY(timeSeconds * 0.004)
    );
    // update each star's position relative to the camera
    for (const star of level4Stars) {
        setInstance(level4List, index++, mat4.multiply(skyBase, star.local), star.tint[0], star.tint[1], star.tint[2]);
    }

    // the sun: three cubes at different angles make a spiky star, all glowing
    const style = LEVEL4_STYLES[level4Style];
    // calculate the sun's position based on the current sun direction
    const sunPos = [sun[0] * LEVEL4_SUN_DISTANCE, sun[1] * LEVEL4_SUN_DISTANCE, sun[2] * LEVEL4_SUN_DISTANCE];
    const spin = timeSeconds * 0.3;
    const sunBase = mat4.translation(sunPos[0], sunPos[1], sunPos[2]); // translate the sun to its calculated position
    const sunCubes = [
        [mat4.rotationY(spin), style.sunCore], // rotate the sun core around the y-axis
        [mat4.multiply(mat4.rotationX(Math.PI / 4), mat4.rotationY(spin * 0.8)), style.sunRays], // rotate the sun rays around the x-axis and y-axis
        [mat4.multiply(mat4.rotationZ(Math.PI / 4), mat4.rotationY(-spin * 0.6)), style.sunRays]
    ];
    // render each sun cube with its rotation and color
    for (const [rotation, color] of sunCubes) {
        const model = mat4.multiply(sunBase, mat4.multiply(rotation, mat4.scaling(9, 9, 9)));
        const t = glowTint(color);
        setInstance(level4List, index++, model, t[0], t[1], t[2]);
    }

    // the Earth: tilted, spinning; its cloud layer spins a little faster
    const earthBase = (turn) => mat4.multiply(
        mat4.translation(LEVEL4_EARTH_POSITION[0], LEVEL4_EARTH_POSITION[1], LEVEL4_EARTH_POSITION[2]),
        mat4.multiply(mat4.rotationZ(0.41), mat4.rotationY(turn))
    );
    const earthMatrix = earthBase(timeSeconds * 0.15); // calculate the Earth's rotation matrix
    for (const cube of level4EarthCubes) { // render each Earth cube with its rotation and color
        setInstance(level4List, index++, mat4.multiply(earthMatrix, cube.local), cube.tint[0], cube.tint[1], cube.tint[2]);
    }
    const cloudMatrix = earthBase(timeSeconds * 0.19); // calculate the cloud layer's rotation matrix
    for (const cube of level4CloudCubes) { // render each cloud cube with its rotation and color
        setInstance(level4List, index++, mat4.multiply(cloudMatrix, cube.local), cube.tint[0], cube.tint[1], cube.tint[2]);
    }

    uploadInstances(level4List.subarray(0, index * INSTANCE_FLOATS));
}

// put the shared renderer settings back so Levels 0-3 look the way they did
function leaveLevel4() {
    level4Active = false;
    skyTintHook = null;
    setClearColor(DEFAULT_CLEAR_COLOR);
    renderSettings.colorSteps = 0;
    renderSettings.fogAmount = 0;
    renderSettings.ambient = 0.3;
    renderSettings.lightDir = [0.5, 1.0, 0.3];
}

// add a select control to the options container
function addSelect(container, text, choices, current, onChange) {
    const label = document.createElement("label");
    label.textContent = text + " ";
    const select = document.createElement("select");
    for (const [value, name] of choices) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = name;
        option.selected = String(value) === String(current);
        select.appendChild(option);
    }
    select.addEventListener("change", () => onChange(select.value));
    label.appendChild(select);
    container.appendChild(label);
}

// add a checkbox control to the options container
function addCheckbox(container, text, checked, onChange) {
    const label = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = checked;
    box.addEventListener("change", () => onChange(box.checked));
    label.appendChild(box);
    label.appendChild(document.createTextNode(" " + text));
    container.appendChild(label);
}

// add a slider control to the options container
function addSlider(container, text, id, min, max, value, onInput) {
    const label = document.createElement("label");
    label.textContent = text + " ";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = id;
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.addEventListener("input", () => onInput(Number(slider.value)));
    label.appendChild(slider);
    container.appendChild(label);
}

function buildLevel4Options(container) {
    addSelect(container, "Style:", [["realistic", "Realistic"], ["colorful", "Colorful"]], level4Style, (v) => {
        level4Style = v;
        rebuildLevel4();
    });
    addSelect(container, "Ground:", [["moon", "NASA Moon"], ["procedural", "Procedural Landscape"]], level4GroundKind, (v) => {
        level4GroundKind = v;
        rebuildLevel4();
        loadMoonThenRebuild();
    });
    addSelect(container, "Grid:", LEVEL4_RESOLUTIONS.map((n) => [n, n + " x " + n]), level4Resolution, (v) => {
        level4Resolution = Number(v);
        rebuildLevel4();
    });
    // add checkbox controls to the options container
    addCheckbox(container, "Orbit Camera", level4Orbit, (v) => { level4Orbit = v; });
    addCheckbox(container, "Shadows", level4Shadows, (v) => { level4Shadows = v; level4ShadowDirty = true; });
    addCheckbox(container, "Haze", level4Haze, (v) => { level4Haze = v; applyLevel4Style(); });
    addCheckbox(container, "Sun Day Cycle", level4SunAnimate, (v) => { level4SunAnimate = v; });
    
    // add slider controls to the options container
    addSlider(container, "Sun Direction", "level4-azimuth", 0, 360,
        Math.round((((level4SunAzimuth * 180 / Math.PI) % 360) + 360) % 360), (deg) => {
            level4SunAzimuth = deg * Math.PI / 180;
        });
    addSlider(container, "Sun Height", "level4-elevation", -10, 80, Math.round(level4SunElevation * 180 / Math.PI), (deg) => {
        level4SunElevation = deg * Math.PI / 180;
    });

    const count = document.createElement("span");
    count.id = "level4-count";
    container.appendChild(count);

    updateLevel4Readout();
}