// shaders.js
// GLSL shader source code for the project

// VERTEX SHADER
const VERTEX_SHADER_SOURCE = `#version 300 es
// per-vertex data
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aColor;
layout(location = 2) in vec3 aNormal;

// per-instance data
layout(location = 3) in mat4 aModel; // translation, rotation, and scaling of the instance
layout(location = 7) in vec3 aTint; // color multiplied onto the cube's vertex colors

// camera: projection and view matrices, computed once per frame
uniform mat4 uViewProjection;

out vec3 vColor;
out vec3 vNormal;

void main() {
    gl_Position = uViewProjection * aModel * vec4(aPosition, 1.0);
    vColor = aColor * aTint;
    vNormal = normalize(mat3(aModel) * aNormal);
}
`;

// FRAGMENT SHADER
const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec3 vColor;
in vec3 vNormal;

uniform float uUseLighting; // 0 = flat vertex colors, 1 = lit
uniform vec3 uLightDir; // direction pointing toward the light
uniform float uAmbient; // ambient light component

out vec4 outColor;

void main() {
    // lambertian diffuse lighting
    float diffuse = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
    float light = uAmbient + (1.0 - uAmbient) * diffuse;

    vec3 color = mix(vColor, vColor * light, uUseLighting);
    outColor = vec4(color, 1.0);
}
`;