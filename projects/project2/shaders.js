// shaders.js
// GLSL shader source code for the project

// VERTEX SHADER
const VERTEX_SHADER_SOURCE = `#version 300 es
// per-vertex data
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

// per-instance data
layout(location = 2) in mat4 aModelMatrix; // translation, rotation, and scaling of the instance
layout(location = 6) in vec3 aTint; // color multiplied onto the cube's vertex colors

// camera: projection and view matrices, computed once per frame
uniform mat4 uViewProjection;

out vec3 vColor;

void main() {
    gl_Position = uViewProjection * aModelMatrix * vec4(aPosition, 1.0);
    vColor = aNormal * aTint;
}
`;

// FRAGMENT SHADER
const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec3 vColor;
out vec4 fragColor;

void main() {
    fragColor = vec4(vColor, 1.0);
}
`;