function computeFaceShade(vertices, tri) {
    let a = vertices[tri[0]];
    let b = vertices[tri[1]];
    let c = vertices[tri[2]];

    // two edges of the triangle, in the object's own local space
    let e1 = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    let e2 = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };

    // cross product gives the face's normal direction
    let nx = e1.y * e2.z - e1.z * e2.y;
    let ny = e1.z * e2.x - e1.x * e2.z;
    let nz = e1.x * e2.y - e1.y * e2.x;

    let len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= len; ny /= len; nz /= len;

    // a fixed light direction, coming from above and slightly ahead
    let lx = 0.3, ly = 0.8, lz = -0.5;
    let llen = Math.sqrt(lx * lx + ly * ly + lz * lz);
    lx /= llen; ly /= llen; lz /= llen;

    let dot = nx * lx + ny * ly + nz * lz;
    return 0.5 + Math.max(0, dot) * 0.6; // ranges roughly 0.5 (dark) to 1.1 (bright)
}

function hexToRgb(hex) {
    hex = hex.replace("#", "");
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

function shadeColorToString(hex, factor) {
    let rgb = hexToRgb(hex);
    let r = Math.min(255, Math.round(rgb.r * factor));
    let g = Math.min(255, Math.round(rgb.g * factor));
    let b = Math.min(255, Math.round(rgb.b * factor));
    return "rgb(" + r + "," + g + "," + b + ")";
}

// used Rasterizing Triangle code from
// https://jtsorlinis.github.io/rendering-tutorial/
// for edgeFunction() and drawTriangle() functions
function edgeFunction(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
};

let depthBuffer = Array.from({ length: PIXEL_COLS }, () => Array(PIXEL_ROWS).fill(0));

function clearDepthBuffer() {
    for (let u = 0; u < PIXEL_COLS; u++) {
        for (let v = 0; v < PIXEL_ROWS; v++) {
            depthBuffer[u][v] = 0;
        }
    }
}

function drawTriangle(A, B, C, color) {
    let ABC = edgeFunction(A, B, C);

    // if triangle is back-facing, it isn't drawn
    if (ABC < 0) {
        return;
    }
    
    // store 1/z per pixel : the higher it is the closer it is to the camera (so basically distance)
    // provides linearity in screen space under perspective projections instead of just z
    let inverseA = 1 / A.z;
    let inverseB = 1 / B.z;
    let inverseC = 1 / C.z;

    // initialize point
    let P = { x: 0, y: 0 };

    // get bounding box of the triangle
    let minX = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x)));
    let minY = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y)));
    let maxX = Math.min(PIXEL_COLS - 1, Math.ceil(Math.max(A.x, B.x, C.x)));
    let maxY = Math.min(PIXEL_ROWS - 1, Math.ceil(Math.max(A.y, B.y, C.y)));

    // loop through all the pixels of the bounding box
    for (P.y = minY; P.y <= maxY; P.y++) {
        for (P.x = minX; P.x <= maxX; P.x++) {
            // calculate edge functions
            let ABP = edgeFunction(A, B, P);
            let BCP = edgeFunction(B, C, P);
            let CAP = edgeFunction(C, A, P);

            // if all the edge functions are positive, the point is inside the triangle
            if (ABP >= 0 && BCP >= 0  && CAP >= 0) {
                // normalize the edge functions by dividing by the total area to get the barycentric coordinates
                let weightA = BCP / ABC;
                let weightB = CAP / ABC;
                let weightC = ABP / ABC;

                // interpolate 1/z
                let inverseDepth = inverseA * weightA + inverseB * weightB + inverseC * weightC;

                // if 1/z is bigger, then object is nearer
                if (inverseDepth > depthBuffer[P.x][P.y]) {
                    depthBuffer[P.x][P.y] = inverseDepth;

                    // draw the pixel
                    setPixelColor(P.x, P.y, color);
                }

                
            }
        }
    }
}

const NEAR_PLANE = 0.1;

function intersectNearPlane(a, b) {
    let t = (NEAR_PLANE - a.z) / (b.z - a.z);
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: NEAR_PLANE
    };
}

function clipTriangleAgainstNearPlane(points) {
    let outputPoints = [];

    for (let i = 0; i < 3; i++) {
        let current = points[i];
        let next = points[(i + 1) % 3];
        let currentInside = current.z > NEAR_PLANE;
        let nextInside = next.z > NEAR_PLANE;

        if (currentInside) {
            outputPoints.push(current);
            if (!nextInside) {
                outputPoints.push(intersectNearPlane(current, next));
            }
        } else if (nextInside) {
            outputPoints.push(intersectNearPlane(current, next));
        }
    }

    if (outputPoints.length === 3) return [outputPoints];
    if (outputPoints.length === 4) {
        return [
            [outputPoints[0], outputPoints[1], outputPoints[2]],
            [outputPoints[0], outputPoints[2], outputPoints[3]]
        ];
    }
    return []; // fully behind the near plane
}

function drawLevel3(ctx, canvas) {
    clearPixelGrid();
    clearDepthBuffer();

    for (let i = 0; i < instances.length; i++) {
        let instance = instances[i];
        let objectType = OBJECT_TYPES[instance.type];

        if (!objectType) continue;
        if (!objectType.triangles) continue;
        if (instance.destroyed) continue;

        let vertices = objectType.vertices;
        let triangles = objectType.triangles;

        let scaleX = typeof instance.scale === "number" ? instance.scale : instance.scale.x;
        let scaleY = typeof instance.scale === "number" ? instance.scale : instance.scale.y;
        let scaleZ = typeof instance.scale === "number" ? instance.scale : instance.scale.z;

        // camera-space vertices, NOT clamped - clipping handles the near plane properly now
        let camVertices = [];
        for (let v = 0; v < vertices.length; v++) {
            let transformed = {
                x: vertices[v].x * scaleX + instance.position.x,
                y: vertices[v].y * scaleY + instance.position.y,
                z: vertices[v].z * scaleZ + instance.position.z
            };
            camVertices.push(toCameraSpace(transformed));
        }

        for (let t = 0; t < triangles.length; t++) {
            let tri = triangles[t];
            let shade = computeFaceShade(vertices, tri);
            let color = shadeColorToString(instance.color, shade);

            let camPoints = [camVertices[tri[0]], camVertices[tri[1]], camVertices[tri[2]]];
            let clipped = clipTriangleAgainstNearPlane(camPoints);

            for (let c = 0; c < clipped.length; c++) {
                let a = projectCameraSpace(clipped[c][0], PIXEL_COLS, PIXEL_ROWS);
                let b = projectCameraSpace(clipped[c][1], PIXEL_COLS, PIXEL_ROWS);
                let cc = projectCameraSpace(clipped[c][2], PIXEL_COLS, PIXEL_ROWS);

                drawTriangle(
                    { x: a.u, y: PIXEL_ROWS - a.v, z: a.z },
                    { x: b.u, y: PIXEL_ROWS - b.v, z: b.z },
                    { x: cc.u, y: PIXEL_ROWS - cc.v, z: cc.z },
                    color
                );
            }
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let v = 0; v < PIXEL_ROWS; v++) {
        for (let u = 0; u < PIXEL_COLS; u++) {
            if (pixelGrid[u][v] === "#050510") continue;
            ctx.fillStyle = pixelGrid[u][v];
            ctx.fillRect(u * PIXEL_SIZE, v * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
    }
}