// based on pixel-grid-test.html
const PIXEL_ROWS = 200;
const PIXEL_COLS = 320;
const PIXEL_SIZE = 5;
const pixelGrid = Array.from({ length: PIXEL_COLS }, () => Array(PIXEL_ROWS).fill("#050510"));

let seePixelOutline = false;

function setPixelColor(u, v, color) {
    u = Math.round(u);
    v = Math.round(v);
    if (u < 0 || u >= PIXEL_COLS || v < 0 || v >= PIXEL_ROWS) return;
    pixelGrid[u][v] = color;
}

function clearPixelGrid() {
    for (let v = 0; v < PIXEL_ROWS; v++) {
        for (let u = 0; u < PIXEL_COLS; u++) {
            pixelGrid[u][v] = "#050510";
        }
    }
}

function drawPixelLine(u1, v1, u2, v2, color) {
    let du = u2 - u1;
    let dv = v2 - v1;
    let steps = Math.max(Math.abs(du), Math.abs(dv));

    if (steps === 0) {
        setPixelColor(u1, v1, color);
        return;
    }

    let uStep = du / steps;
    let vStep = dv / steps;

    let u = u1;
    let v = v1;

    for (let i = 0; i <= steps; i++) {
        setPixelColor(u, v, color);
        u = u + uStep;
        v = v + vStep;
    }
}

function drawLevel2(ctx, canvas) {
    clearPixelGrid();
    
    // loop through every instance in the scene, same pattern as
    // drawLevel1() in render-level1.js
    for (let i = 0; i < instances.length; i++) {
        let instance = instances[i];
        let objectType = OBJECT_TYPES[instance.type];

        if (!objectType) continue;
        if (instance.destroyed) continue;

        let vertices = objectType.vertices;
        let edges = objectType.edges;

        // loop through object's base vertices (X, Y, Z)
        // apply the instance postion and scale to each one
        let scaleX = typeof instance.scale === "number" ? instance.scale : instance.scale.x;
        let scaleY = typeof instance.scale === "number" ? instance.scale : instance.scale.y;
        let scaleZ = typeof instance.scale === "number" ? instance.scale : instance.scale.z;

        let transformedVertices = [];

        for (let v = 0; v < vertices.length; v++) {
            let transformed = {};
            transformed.x = vertices[v].x * scaleX + instance.position.x;
            transformed.y = vertices[v].y * scaleY + instance.position.y;
            transformed.z = vertices[v].z * scaleZ + instance.position.z;

            transformedVertices.push(transformed);
        }

        // here we will store u,v coordinates for the vertices,
        // projected onto our 2d plane
        let projectedVertices = [];

        // loop through transformed vertices (X, Y, Z)
        // determines the position in 3D space relative to camera (x, y, z)
        // then project them onto the 2D plane
        for (let v = 0; v < transformedVertices.length; v++) {
            projectedVertices.push(toCameraSpace(transformedVertices[v]));
        }

        const NEAR_PLANE = 0.1;

        // loop through the edges
        // find the newly computerd projected vertices - 2 per edge
        // draw the line
        for (let e = 0; e < edges.length; e++) {
            // first vertex
            let e1 = edges[e][0]; // idx
            let camA = projectedVertices[ e1 ];

            // second vertex
            let e2 = edges[e][1]; // idx
            let camB = projectedVertices[ e2 ];
            
            if (camA.z <= NEAR_PLANE && camB.z <= NEAR_PLANE) { continue; }

            // used linear interpolation to fix disappearing edges adter certain camera position
            let pointA = camA;
            let pointB = camB;

            if (pointA.z <= NEAR_PLANE) {
                let t = (NEAR_PLANE - pointA.z) / (pointB.z - pointA.z);

                pointA = {
                    x: pointA.x + (pointB.x - pointA.x) * t,
                    y: pointA.y + (pointB.y - pointA.y) * t,
                    z: NEAR_PLANE
                };

            } else if (pointB.z <= NEAR_PLANE) {
                let t = (NEAR_PLANE - pointB.z) / (pointA.z - pointB.z);

                pointB = {
                    x: pointB.x + (pointA.x - pointB.x) * t,
                    y: pointB.y + (pointA.y - pointB.y) * t,
                    z: NEAR_PLANE
                };
            }

            let p1 = projectCameraSpace(pointA, PIXEL_COLS, PIXEL_ROWS);
            let p2 = projectCameraSpace(pointB, PIXEL_COLS, PIXEL_ROWS);

            let u1 = p1.u;
            let u2 = p2.u;

            // in some graphics systems, the y-coordinate increases downwards
            // that is why the canvas.height is subtracted from the v-coordinate,
            // matching the expected orientation
            let v1 = PIXEL_ROWS - p1.v;
            let v2 = PIXEL_ROWS - p2.v;

            drawPixelLine(u1, v1, u2, v2, instance.color);
        }
    }

    // here we set up and clear the canvas, every draw frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // skip recoloring background cells
    for (let v = 0; v < PIXEL_ROWS; v++) {
        for (let u = 0; u < PIXEL_COLS; u++) {
            if (pixelGrid[u][v] === "#050510") continue;

            ctx.fillStyle = pixelGrid[u][v];
            ctx.fillRect(u * PIXEL_SIZE, v * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
    }

    if (seePixelOutline) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#444444";
        ctx.beginPath();

        for (let u = 0; u <= PIXEL_COLS; u++) {
            let x = u * PIXEL_SIZE;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, PIXEL_ROWS * PIXEL_SIZE);
        }

        for (let v = 0; v <= PIXEL_ROWS; v++) {
            let y = v * PIXEL_SIZE;
            ctx.moveTo(0, y);
            ctx.lineTo(PIXEL_COLS * PIXEL_SIZE, y);
        }

        ctx.stroke();
    }
}