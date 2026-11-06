// cube.js
// defines the geometry and rendering for a cube in WebGL

const CUBE_CORNERS = [
    [-1, -1, -1],   // 0
    [ 1, -1, -1],   // 1
    [ 1,  1, -1],   // 2
    [-1,  1, -1],   // 3
    [-1, -1,  1],   // 4
    [ 1, -1,  1],   // 5
    [ 1,  1,  1],   // 6
    [-1,  1,  1]    // 7
];

const CUBE_FACES = [
    { normal: [ 0,  0,  1], corners: [4, 5, 6, 7] },   // front  (+z)
    { normal: [ 0,  0, -1], corners: [1, 0, 3, 2] },   // back   (-z)
    { normal: [ 1,  0,  0], corners: [5, 1, 2, 6] },   // right  (+x)
    { normal: [-1,  0,  0], corners: [0, 4, 7, 3] },   // left   (-x)
    { normal: [ 0,  1,  0], corners: [7, 6, 2, 3] },   // top    (+y)
    { normal: [ 0, -1,  0], corners: [0, 1, 5, 4] }    // bottom (-y)
];

// build flat vertex arrays from the corner and face tables above
const CUBE_POSITIONS = new Float32Array(24 * 3);
const CUBE_NORMALS = new Float32Array(24 * 3);
const CUBE_INDICES = new Uint16Array(36);

(function buildCubeArrays() {
    CUBE_FACES.forEach((face, f) => {
        face.corners.forEach((cornerIndex, c) => {
            const v = f * 4 + c;

            CUBE_POSITIONS.set(CUBE_CORNERS[cornerIndex], v * 3);
            CUBE_NORMALS.set(face.normal, v * 3);
        });
        // each face = 2 triangles: (0, 1, 2) and (0, 2, 3) of its 4 vertices
        const base = f * 4;
        CUBE_INDICES.set([base, base + 1, base + 2, base, base + 2, base + 3], f * 6);
    });
})();

// vertex color procedures: level 1c
const CUBE_COLOR_PROCEDURES = {
    // color = position. corner (-1,-1,-1) is black, (1,1,1) is white,
    rainbow: (x, y, z) => [(x + 1) / 2, (y + 1) / 2, (z + 1) / 2],

    // gray that gets lighter with height: the bottom vertices, y = -1 are dark,
    // the top vertices, y = +1, are bright
    terrain: (x, y, z) => {
        const shade = 0.3 + 0.7 * ((y + 1) / 2);
        return [shade, shade, shade];
  }
};

function makeCubeColors(procedure) {
    const colors = new Float32Array(24 * 3);
    for (let v = 0; v < 24; v++) {
        const x = CUBE_POSITIONS[v * 3 + 0];
        const y = CUBE_POSITIONS[v * 3 + 1];
        const z = CUBE_POSITIONS[v * 3 + 2];
        colors.set(procedure(x, y, z), v * 3);
    }
    return colors;
}

// per-instance data layout: 16 for model matrix, 3 for tint color
const INSTANCE_FLOATS = 19;

// vertex array object for cube
function createCubeMesh(gl) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // per-vertex buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_POSITIONS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const colorBuffers = {};
    for (const name in CUBE_COLOR_PROCEDURES) {
        colorBuffers[name] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffers[name]);
        gl.bufferData(gl.ARRAY_BUFFER, makeCubeColors(CUBE_COLOR_PROCEDURES[name]), gl.STATIC_DRAW);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffers.rainbow);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_NORMALS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

    // index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, CUBE_INDICES, gl.STATIC_DRAW);

    // per-instance buffer
    const instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    const stride = INSTANCE_FLOATS * 4; // bytes
    for (let column = 0; column < 4; column++) {
        const location = 3 + column;      // aModel uses locations 3, 4, 5, 6
       gl.enableVertexAttribArray(location);
       gl.vertexAttribPointer(location, 4, gl.FLOAT, false, stride, column * 16);
       gl.vertexAttribDivisor(location, 1);
    }
    gl.enableVertexAttribArray(7);      // aTint
    gl.vertexAttribPointer(7, 3, gl.FLOAT, false, stride, 16 * 4);
    gl.vertexAttribDivisor(7, 1);
 
    gl.bindVertexArray(null);
 
   return { vao, instanceBuffer, colorBuffers, indexCount: CUBE_INDICES.length };
}

// connect a different vertex-color buffer to the shader's color input.
function selectCubeColors(gl, mesh, name) {
    gl.bindVertexArray(mesh.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.colorBuffers[name]);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
}