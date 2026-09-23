// used Rasterizing Triangle code from
// https://jtsorlinis.github.io/rendering-tutorial/
// for edgeFunction() and drawTriangle() functions
function edgeFunction(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
};

function drawTriangle(A, B, C) {
    let ABC = edgeFunction(A, B, C);

    // if triangle is back-facing, don't draw it
    if (ABC < 0) {
        return;
    }

    // initialize point
    let P = {x: 0, y: 0};

    // get bounding box of the triangle
    let minX = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x)));
    let minY = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y)));
    let maxX = Math.min(PIXEL_WIDTH - 1, Math.ceil(Math.max(A.x, B.x, C.x)));
    let maxY = Math.min(PIXEL_HEIGHT - 1, Math.ceil(Math.max(A.y, B.y, C.y)));

    // loop through all the pixels of the bounding box
    for (P.y = minY; P.y <= maxY; P.y++) {
        for (P.x = minX; P.x <= maxX; P.x++) {
            // calculate edge functions
            let ABP = edgeFunction(A, B, P);
            let BCP = edgeFunction(B, C, P);
            let CAP = edgeFunction(C, A, P);

            // normalize the edge functions by dividing by the total area to get the barycentric coordinates
            let weightA = BCP / ABC;
            let weightB = CAP / ABC;
            let weightC = ABP / ABC;

            // ig all the edge functions are positive, the point is inside the triangle
            if (ABP >= 0 && BCP >= 0  && CAP >= 0) {
                // TODO:  resolve occlusion

                // interpolate the colors at point P
                let r = A.color.r * weightA + B.color.r * weightB + C.color.r * weightC;
                let g = A.color.g * weightA + B.color.g * weightB + C.color.g * weightC;
                let b = A.color.b * weightA + B.color.b * weightB + C.color.b * weightC;
                let color = "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";

                // draw the pixel
                setPixel(P.x, P.y, color);
            }
        }
    }
}

function drawLevel3(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // TODO: draw triangles using drawTriangle function
}