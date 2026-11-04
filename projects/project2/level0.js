// level0.js
// Level 0: Project Preliminaries

const level0Instances = createInstanceList(1);

function setupLevel0() {
    camera.eye = [4, 3, 7];
    camera.target = [0, 0, 0];
    camera.up = [0, 1, 0];
    camera.fov = 45 * Math.PI / 180;

    setCubeColorSet("rainbow"); // corner colors = corner positions
    renderSettings.useLighting = false; // show pure color blending
}

function updateLevel0(timeSeconds) {
    // model matrix: rotate cube around y-axis
    const model = mat4.rotationY(timeSeconds * 0.6);

    setInstance(level0Instances, 0, model); // default tint (1, 1, 1)
    uploadInstances(level0Instances);
}