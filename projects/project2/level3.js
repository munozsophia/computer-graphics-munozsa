// level3.js
// Level 3: a skyscape built from cubes, moving on Bezier curves

const LEVEL3_RESOLUTIONS = [32, 64, 128, 256];
const LEVEL3_ORBIT_RADIUS = 56;
const LEVEL3_ORBIT_HEIGHT = 28;
const LEVEL3_ORBIT_SPEED = 0.1;
const LEVEL3_SPAWN_RADIUS = 75;

const LEVEL3_FAR_LIMIT = 115;
const LEVEL3_PATH_SAMPLES = 40;

let level3GroundKind = "moon"; // "moon" or "procedural"
let level3Resolution = 64;
let level3Orbit = true;
let level3ShowPaths = false;
let level3Angle = 0.9;
let level3LastTime = null;
let level3Active = false;

let level3GroundCount = 0;
let level3List = null;
let level3Objects = [];
let level3Random = makeRandom(1969);

// bezier function
function cubicBezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const w0 = u * u * u;
    const w1 = 3 * u * u * t;
    const w2 = 3 * u * t * t;
    const w3 = t * t * t;

    return [
        w0 * p0[0] + w1 * p1[0] + w2 * p2[0] + w3 * p3[0],
        w0 * p0[1] + w1 * p1[1] + w2 * p2[1] + w3 * p3[1],
        w0 * p0[2] + w1 * p1[2] + w2 * p2[2] + w3 * p3[2]
    ];
}

// the sky objects
const WHITE = [1.0, 1.0, 1.0];
const GRAY = [0.62, 0.64, 0.68];
const GOLD = [1.0, 0.78, 0.25];
const SOLAR_BLUE = [0.25, 0.4, 0.95];

const SATELLITE_PARTS = [
    { at: [0, 0, 0], size: [0.6, 0.4, 0.4], tint: GRAY }, // body
    { at: [0, 0, 0.42], size: [0.62, 0.42, 0.04], tint: GOLD }, // gold foil band
    { at: [-0.85, 0, 0], size: [0.25, 0.05, 0.05], tint: GRAY }, // left arm
    { at: [0.85, 0, 0], size: [0.25, 0.05, 0.05], tint: GRAY }, // right arm
    { at: [-1.75, 0, 0], size: [0.65, 0.04, 0.45], tint: SOLAR_BLUE }, // left solar panel
    { at: [1.75, 0, 0], size: [0.65, 0.04, 0.45], tint: SOLAR_BLUE }, // right solar panel
    { at: [0, 0.55, 0], size: [0.05, 0.15, 0.05], tint: GRAY }, // antenna mast
    { at: [0, 0.75, 0], size: [0.3, 0.05, 0.3], tint: WHITE } // dish
];

const ASTRONAUT_PARTS = [
    { at: [0, 0, 0], size: [0.35, 0.45, 0.25], tint: WHITE }, // torso
    { at: [0, 0.78, 0], size: [0.28, 0.28, 0.28], tint: WHITE }, // helmet
    { at: [0, 0.8, 0.25], size: [0.22, 0.17, 0.06], tint: GOLD }, // gold visor
    { at: [0, 0.05, -0.36], size: [0.27, 0.38, 0.12], tint: GRAY }, // life-support pack
    { at: [0, 0.15, 0.26], size: [0.1, 0.1, 0.03], tint: [1.0, 0.45, 0.2] }, // mission patch
    { at: [-0.5, 0.05, 0], size: [0.12, 0.38, 0.12], tint: WHITE }, // left arm
    { at: [0.5, 0.05, 0], size: [0.12, 0.38, 0.12], tint: WHITE }, // right arm
    { at: [-0.18, -0.85, 0], size: [0.14, 0.38, 0.14], tint: WHITE }, // left leg
    { at: [0.18, -0.85, 0], size: [0.14, 0.38, 0.14], tint: WHITE } // right leg
];
 
const ASTEROID_PARTS = [
    { at: [0, 0, 0], size: [0.7, 0.6, 0.65], tint: [0.7, 0.66, 0.6] },
    { at: [0.45, 0.3, -0.2], size: [0.4, 0.4, 0.4], tint: [0.58, 0.55, 0.52] },
    { at: [-0.4, -0.3, 0.25], size: [0.45, 0.35, 0.4], tint: [0.8, 0.75, 0.68] }
];

function randomBetween(a, b) {
    // returns a random number between a and b
    return a + (b - a) * level3Random();
}

function pointAt(angle, radius, y) {
    return [radius * Math.cos(angle), y, radius * Math.sin(angle)];
}

function newCurve(object) {
    const startAngle = randomBetween(0, Math.PI * 2);
    const endAngle = startAngle + Math.PI + randomBetween(-0.7, 0.7);
    const bend = randomBetween(-1.0, 1.0);

    object.p0 = pointAt(startAngle, LEVEL3_SPAWN_RADIUS, randomBetween(10, 32));
    object.p3 = pointAt(endAngle, LEVEL3_SPAWN_RADIUS, randomBetween(10, 32));
    object.p1 = pointAt(startAngle + 0.9 * bend + 0.5, randomBetween(18, 55), randomBetween(14, 40));
    object.p2 = pointAt(endAngle - 0.9 * bend - 0.5, randomBetween(18, 55), randomBetween(14, 40));
    object.t = 0;
    object.duration = randomBetween(object.minDuration, object.maxDuration);
}

function makeObject(kind, parts, baseScale, minDuration, maxDuration, tumble) {
    const object = {
        kind, parts, baseScale, minDuration, maxDuration,
        tumble: [
            randomBetween(-tumble, tumble),
            randomBetween(-tumble, tumble),
            randomBetween(-tumble, tumble)
        ],
        pulseSpeed: randomBetween(0.8, 2.0),
        pulsePhase: randomBetween(0, 6.28),
        scale: baseScale * (kind === "asteroid" ? randomBetween(0.7, 1.8) : 1),
        spin: randomBetween(0, 6.28),
        position: [0, 0, 0]
    };
    newCurve(object);
    object.t = level3Random();
    return object;
}

function buildSkyObjects() {
    level3Objects = [];
    
    for (let i = 0; i < 2; i++) {
        level3Objects.push(makeObject("satellite", SATELLITE_PARTS, 1.6, 26, 40, 0.15));
    }
    for (let i = 0; i < 2; i++) {
        level3Objects.push(makeObject("astronaut", ASTRONAUT_PARTS, 1.5, 30, 44, 0.35));
    }
    for (let i = 0; i < 9; i++) {
        level3Objects.push(makeObject("asteroid", ASTEROID_PARTS, 1.5, 16, 30, 1.1));
    }
}

function skyCapacity() {
    let parts = 0;

    for (const object of level3Objects) {
        parts += object.parts.length;
    }
    // curve samples + 4 control points
    return parts + level3Objects.length * (LEVEL3_PATH_SAMPLES + 1 + 4);
}

// move, rotate, scale every object
function smoothstep(x) {
    const c = Math.min(1, Math.max(0, x));
    return c * c * (3 - 2 * c);
}

function updateSkyObjects(dt, timeSeconds, index) {
    for (const object of level3Objects) {
        object.t += dt / object.duration;

        // respawn whe curve is finished or object has drifted too far away
        const distance = Math.hypot(object.position[0], object.position[2]);
        if (object.t >= 1 || distance > LEVEL3_FAR_LIMIT) {
            newCurve(object);
        }

        object.position = cubicBezier(object.p0, object.p1, object.p2, object.p3, object.t);
        object.spin += dt;

        const fade = smoothstep(object.t / 0.06) * smoothstep((1 - object.t) / 0.06);
        const pulse = 1 + 0.12 * Math.sin(timeSeconds * object.pulseSpeed + object.pulsePhase);
        const s = object.scale * pulse * fade;

        const placement = mat4.multiply(
            mat4.translation(object.position[0], object.position[1], object.position[2]),
            mat4.multiply(
                mat4.rotationY(object.spin * object.tumble[1]),
                mat4.multiply(
                    mat4.rotationX(object.spin * object.tumble[0]),
                    mat4.multiply(
                        mat4.rotationZ(object.spin * object.tumble[2]),
                        mat4.scaling(s, s, s)
                    )
                )
            )
        );

        for (const part of object.parts) {
            const partMatrix = mat4.multiply(
                mat4.translation(part.at[0], part.at[1], part.at[2]),
                mat4.scaling(part.size[0], part.size[1], part.size[2])
            );

            setInstance(level3List, index++, mat4.multiply(placement, partMatrix),
                part.tint[0], part.tint[1], part.tint[2]);
        }
    }
    return index;
}

// Draw the paths of the sky objects for debugging purposes
function drawPaths(index) {
    const marker = (p, size, tint) => {
        const model = mat4.multiply(
            mat4.translation(p[0], p[1], p[2]),
            mat4.scaling(size, size, size)
        );
        setInstance(level3List, index++, model, tint[0], tint[1], tint[2]);
    };
    
    for (const object of level3Objects) {
        for (let i = 0; i <= LEVEL3_PATH_SAMPLES; i++) {
            const p = cubicBezier(object.p0, object.p1, object.p2, object.p3, i / LEVEL3_PATH_SAMPLES);
            marker(p, 0.18, [1, 1, 0.6]);
        }
        marker(object.p0, 0.6, [0.3, 1, 0.3]);
        marker(object.p1, 0.6, [1, 0.3, 0.3]);
        marker(object.p2, 0.6, [1, 0.3, 0.3]);
        marker(object.p3, 0.6, [0.3, 0.5, 1]);
    }
    return index;
}

// The ground, then the level's setup / update / options.
function rebuildLevel3Ground() {
    let ground;
    if (level3GroundKind === "moon" && level2Status === "ready") {
        ground = buildMoonLandscape(level3Resolution);
    } else {
        ground = buildLandscape(level3Resolution); // procedural ground from Level 1
    }
    level3GroundCount = ground.length / INSTANCE_FLOATS;
    level3List = createInstanceList(level3GroundCount + skyCapacity());
    level3List.set(ground, 0);
    updateLevel3Readout();
}
 
function updateLevel3Readout() {
    const readout = document.getElementById("level3-count");
    if (!readout) {
        return;
    }

    let text = (level3GroundCount + level3Objects.reduce((n, o) => n + o.parts.length, 0)).toLocaleString() + " cubes";
    if (level3GroundKind === "moon" && level2Status === "loading") {
        text += " (loading Moon images...)";
    } else if (level3GroundKind === "moon" && level2Status === "error") {
        text += " (Moon images not found, showing procedural ground)";
    }
    readout.textContent = text;
}
 
function setupLevel3() {
    level3Active = true;
    camera.target = [0, 6, 0];
    camera.up = [0, 1, 0];
 
    setCubeColorSet("terrain");
    renderSettings.useLighting = true;
    level3LastTime = null;
 
    buildSkyObjects();
    rebuildLevel3Ground();
 
    if (level3GroundKind === "moon" && level2Status !== "ready") {
        loadLevel2Images().then(() => {
        if (level3Active) {
            rebuildLevel3Ground();
        }
        });
    }
}
 
function updateLevel3(timeSeconds) {
    const dt = level3LastTime === null ? 0 : Math.min(timeSeconds - level3LastTime, 0.1);
    level3LastTime = timeSeconds;
 
    if (level3Orbit) {
        level3Angle += dt * LEVEL3_ORBIT_SPEED;
    }
    camera.eye = [
        camera.target[0] + LEVEL3_ORBIT_RADIUS * Math.cos(level3Angle),
        LEVEL3_ORBIT_HEIGHT,
        camera.target[2] + LEVEL3_ORBIT_RADIUS * Math.sin(level3Angle)
    ];
 
    let index = level3GroundCount; // sky cubes go after the ground cubes
    index = updateSkyObjects(dt, timeSeconds, index);
    if (level3ShowPaths) {
        index = drawPaths(index);
    }
    uploadInstances(level3List.subarray(0, index * INSTANCE_FLOATS));
}
 
function leaveLevel3() {
    level3Active = false;
}
 
function buildLevel3Options(container) {
    const groundLabel = document.createElement("label");
    groundLabel.textContent = "Ground: ";
    const groundSelect = document.createElement("select");
    for (const [value, text] of [["moon", "NASA Moon"], ["procedural", "Procedural craters"]]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        option.selected = value === level3GroundKind;
        groundSelect.appendChild(option);
    }
    groundSelect.addEventListener("change", () => {
        level3GroundKind = groundSelect.value;
        rebuildLevel3Ground();
        if (level3GroundKind === "moon" && level2Status !== "ready") {
            loadLevel2Images().then(() => {
                if (level3Active) {
                    rebuildLevel3Ground();
                }
            });
        }
    });
    groundLabel.appendChild(groundSelect);
    container.appendChild(groundLabel);
 
    const gridLabel = document.createElement("label");
    gridLabel.textContent = "Grid: ";
    const gridSelect = document.createElement("select");
    for (const n of LEVEL3_RESOLUTIONS) {
        const option = document.createElement("option");
        option.value = n;
        option.textContent = n + " x " + n;
        option.selected = n === level3Resolution;
        gridSelect.appendChild(option);
    }

    gridSelect.addEventListener("change", () => {
        level3Resolution = Number(gridSelect.value);
        rebuildLevel3Ground();
    });

    gridLabel.appendChild(gridSelect);
    container.appendChild(gridLabel);
 
    const orbitLabel = document.createElement("label");
    const orbitBox = document.createElement("input");
    orbitBox.type = "checkbox";
    orbitBox.checked = level3Orbit;
    orbitBox.addEventListener("change", () => { level3Orbit = orbitBox.checked; });

    orbitLabel.appendChild(orbitBox);
    orbitLabel.appendChild(document.createTextNode(" Orbit camera"));
    container.appendChild(orbitLabel);
 
    const pathsLabel = document.createElement("label");
    const pathsBox = document.createElement("input");

    pathsBox.type = "checkbox";
    pathsBox.checked = level3ShowPaths;
    pathsBox.addEventListener("change", () => { level3ShowPaths = pathsBox.checked; });

    pathsLabel.appendChild(pathsBox);
    pathsLabel.appendChild(document.createTextNode(" Show Bezier paths"));
    container.appendChild(pathsLabel);
 
    const count = document.createElement("span");
    count.id = "level3-count";
    container.appendChild(count);
 
    updateLevel3Readout();
}