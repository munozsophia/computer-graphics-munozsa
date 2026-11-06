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
out float vGlow; // 1 = this cube glows (sun, stars): no lighting, no haze
out float vWorldY; // height of this point in the world (for ground haze)
out float vDepth; // distance in front of the camera (for haze)

void main() {
    // transform the vertex position into world space, then into clip space
    vec4 world = aModel * vec4(aPosition, 1.0);
    gl_Position = uViewProjection * world;

    // a negative red tint is the flag for a glowing cube (Level 4)
    // the real color is the absolute value of the tint
    float glow = aTint.r < 0.0 ? 1.0 : 0.0;
    vec3 tint = abs(aTint);

    // glowing cubes use the flat tint color, other cubes blend vertex colors * tint
    vColor = mix(aColor * tint, tint, glow);
    vGlow = glow;
    vWorldY = world.y;
    vDepth = gl_Position.w; // after the projection w = distance from the camera
    vNormal = normalize(mat3(aModel) * aNormal);
}
`;

// FRAGMENT SHADER
const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec3 vColor;
in vec3 vNormal;
in float vGlow;
in float vWorldY;
in float vDepth;

uniform float uUseLighting; // 0 = flat vertex colors, 1 = lit
uniform vec3 uLightDir; // direction pointing toward the light
uniform float uAmbient; // ambient light component
uniform float uColorSteps; // 0 = smooth lighting, 3 = colorful bands of light
uniform float uFogAmount; // 0 = no haze, 1 = full haze (Level 4 atmosphere)
uniform vec3 uFogColor;

out vec4 outColor;

void main() {
    // lambertian diffuse lighting
    float diffuse = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);

    // colorful bands of light: snap the smooth 0-1 brightness up to a few flat bands
    if (uColorSteps > 0.5) {
        diffuse = ceil(diffuse * uColorSteps) / uColorSteps;
    }
    float light = uAmbient + (1.0 - uAmbient) * diffuse;

    // apply lighting only when enabled
    vec3 color = mix(vColor, vColor * light, uUseLighting);

    // atmosphere: haze that thickens with distance and thins out with height
    float haze = uFogAmount * (1.0 - exp(-vDepth * 0.012)) * exp(-max(vWorldY, 0.0) * 0.06);
    color = mix(color, uFogColor, haze);

    // glowing cubes ignore lighting and haze completely
    color = mix(color, vColor, vGlow);

    outColor = vec4(color, 1.0);
}
`;