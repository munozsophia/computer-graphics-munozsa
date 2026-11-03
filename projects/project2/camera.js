// camera.js
// defines the camera logic for the scene in WebGL

const camera = {
    eye: [4, 3, 7],
    target: [0, 0, 0],
    up: [0, 1, 0],
    fov: 45 * Math.PI / 180, // field of view in radians
    near: 0.1, // near clipping plane
    far: 500 // far clipping plane
};

// projection * view matrix: world space => clip space
function getViewProjection(aspect) {
    const view = mat4.lookAt(camera.eye, camera.target, camera.up);
    const projection = mat4.perspective(camera.fov, aspect, camera.near, camera.far);
    return mat4.multiply(projection, view);
}