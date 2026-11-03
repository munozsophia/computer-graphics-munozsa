// cube.js
// defines the geometry and rendering for a cube in WebGL

const CUBE_POSITIONS = new Float32Array([
    -1, -1, -1, // 0
    1, -1, -1,  // 1
    1, 1, -1,   // 2
    -1, 1, -1,  // 3
    -1, -1, 1,  // 4
    1, -1, 1,   // 5
    1, 1, 1,    // 6
    -1, 1, 1,   // 7
]);

const CUBE_COLORS = (() => {
    const colors = new Float32Array(CUBE_POSITIONS.length);

    for (let i = 0; i < CUBE_POSITIONS.length; i++) {
        colors[i] = (CUBE_POSITIONS[i] + 1) / 2; // normalize to 0-1 range
    }
    return colors;
})();

const CUBE_INDICES = new Uint16Array([
    4, 5, 6,  4, 6, 7,  // front (+z)
    1, 0, 3,  1, 3, 2,  // back (-z)
    5, 1, 2,  5, 2, 6,  // right (+x)
    0, 4, 7,  0, 7, 3,  // left (-x)
    7, 6, 2,  7, 2, 3,  // top (+y)
    0, 1, 5,  0, 5, 4   // bottom (-y)
]);

// per-instance data layout: 16 for model matrix + 3 for color (RGB)
const INSTANCE_FLOATS = 19;

// vertex array object for cube
const createCubeMesh = (gl) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // per-vertex buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_POSITIONS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_COLORS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    // index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, CUBE_INDICES, gl.STATIC_DRAW);

    // per-instance buffer
    const instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    
    const stride = INSTANCE_FLOATS * 4; // 4 bytes

    for (let column = 0; column < 4; column++) {
        const location = 2 + column; // aModel uses locations 2-5

        gl.enableVertexAttribArray(location); // enable the attribute for the column of model matrix
        gl.vertexAttribPointer(location, 4, gl.FLOAT, false, stride, column * 16); // 16 bytes per column
        gl.vertexAttribDivisor(location, 1); // 1 instance per attribute
    }
    gl.enableVertexAttribArray(6); // enable the attribute for the instance color aTint
    gl.vertexAttribPointer(6, 3, gl.FLOAT, false, stride, 16 * 4); // 16 bytes per column, offset to the color part
    gl.vertexAttribDivisor(6, 1); // 1 instance per attribute

    gl.bindVertexArray(null); // unbind the vao
    return { vao, instanceBuffer, indexCount: CUBE_INDICES.length };
};