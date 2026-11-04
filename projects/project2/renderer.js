// renderer.js
// defines the rendering logic for the scene in WebGL

let gl = null;
let program = null;
let cubeMesh = null;
let instanceCount = 0;
const uniformLocations = {};

// Settings a level can change. Each frame they are copied to the shader.
const renderSettings = {
    useLighting: false,// false = flat vertex colors (Level 0)
    lightDir: [0.5, 1.0, 0.3], // direction pointing TOWARD the light (the "sun")
    ambient: 0.3 // minimum brightness on faces turned away from the light
};

function initRenderer(canvas) {
    gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error("WebGL2 is not available in this browser");
    }

    program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    for (const name of ["uViewProjection", "uUseLighting", "uLightDir", "uAmbient"]) {
        uniformLocations[name] = gl.getUniformLocation(program, name);
    }
    cubeMesh = createCubeMesh(gl);

    gl.enable(gl.DEPTH_TEST); // near surfaces hide far surfaces (depth buffer)
    gl.enable(gl.CULL_FACE); // cull back-facing triangles
    gl.clearColor(0.02, 0.02, 0.063, 1); // set the background color
}

function setCubeColorSet(name) {
    selectCubeColors(gl, cubeMesh, name);
}

// match the renderer size to the canvas size
function resizeRenderer(canvas) {
    const dpr = window.devicePixelRatio || 1; // get the device pixel ratio
    const width = Math.round(canvas.clientWidth * dpr);
    const height = Math.round(canvas.clientHeight * dpr);

    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height); // set the viewport to match the canvas size
}

// build instance list
// allocate room for `count` instances of the cube mesh
function createInstanceList(count) {
    return new Float32Array(count * INSTANCE_FLOATS);
}

// write cube number `index` into the instance list
function setInstance(list, index, modelMatrix, tintR = 1, tintG = 1, tintB = 1) {
    const offset = index * INSTANCE_FLOATS; // calculate the starting index for this instance in the list

    list.set(modelMatrix, offset); // write the model matrix into the instance list
    list[offset + 16] = tintR; // write the red tint value into the instance list
    list[offset + 17] = tintG; // write the green tint value into the instance list
    list[offset + 18] = tintB; // write the blue tint value into the instance list
}

// upload the instance list to the GPU for rendering
function uploadInstances(list) {
    instanceCount = list.length / INSTANCE_FLOATS; // calculate the number of instances from the list length
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeMesh.instanceBuffer); // bind the instance buffer
    gl.bufferData(gl.ARRAY_BUFFER, list, gl.DYNAMIC_DRAW); // upload the instance list to the GPU
}

// drawing the scene with WebGL
function renderScene(viewProjection) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear the color and depth buffers

    gl.useProgram(program); // use the shader program
    gl.uniformMatrix4fv(uniformLocations.uViewProjection, false, viewProjection); // set the view-projection matrix uniform in the shader
    gl.uniform1f(uniformLocations.uUseLighting, renderSettings.useLighting ? 1 : 0);
    gl.uniform3fv(uniformLocations.uLightDir, renderSettings.lightDir);
    gl.uniform1f(uniformLocations.uAmbient, renderSettings.ambient);

    // draw the instanced cubes
    gl.bindVertexArray(cubeMesh.vao); // bind the vertex array object for the cube mesh
    gl.drawElementsInstanced(gl.TRIANGLES, cubeMesh.indexCount, gl.UNSIGNED_SHORT, 0, instanceCount); // draw the instanced cubes
    gl.bindVertexArray(null); // unbind the vertex array object after drawing
}