let camera = {x: 0, y: 0, z: -10};

function resetCamera() {
    camera.x = 0;
    camera.y = 0;
    camera.z = -10;
    console.log("Reset");
}

function projectVertex(vertex, canvasWidth, canvasHeight) {
    const camVert = {
        x: vertex.x - camera.x,
        y: vertex.y - camera.y,
        z: vertex.z - camera.z
    };

    const canvasPos = {
        u: camVert.x / camVert.z,
        v: camVert.y / camVert.z,
        // z-buffer value for depth
        z: camVert.z
    };

    canvasPos.u = canvasPos.u * canvasWidth + canvasWidth / 2;
    canvasPos.v = canvasPos.v * canvasHeight + canvasHeight / 2;
    return canvasPos;
}