// math.js
// 4x4 matrix library

const mat4 = {

    identity() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },

    // matrix multiplication
    // returns a * b
    multiply(a, b) {
        const result = new Float32Array(16);
        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 4; row++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += a[k * 4 + row] * b[col * 4 + k];
                }
                result[col * 4 + row] = sum;
            }
        }
        return result;
    },

    // matrix translation
    // move a point by (x, y, z)
    translation(x, y, z) {
        const m = mat4.identity();
        m[12] = x;
        m[13] = y;
        m[14] = z;
        return m;
    },

    // matrix scaling
    // scale a point by (x, y, z)
    scaling(x, y, z) {
        const m = mat4.identity();
        m[0] = x;
        m[5] = y;
        m[10] = z;
        return m;
    },

    // matrix rotation
    // rotate a point by an angle (in radians) around the x, y, or z axis
    rotationX(angle) {
        const m = mat4.identity();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        m[5] = c;
        m[6] = s;
        m[9] = -s;
        m[10] = c;
        return m;
    },

    rotationY(angle) {
        const m = mat4.identity();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        m[0] = c;
        m[2] = -s;
        m[8] = s;
        m[10] = c;
        return m;
    },

    rotationZ(angle) {
        const m = mat4.identity();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        m[0] = c;
        m[1] = s;
        m[4] = -s;
        m[5] = c;
        return m;
    },

    // perspective projection: creates a 4x4 matrix for a perspective camera view
    //  fieldOfView - how wide the camera sees, in radians
    //  aspect - canvas width / canvas height, so things aren't stretched
    //  near, far - nothing closer than near or farther than far is drawn
    perspective(fieldOfView, aspect, near, far) {
        const f = 1 / Math.tan(fieldOfView / 2)
        const m = new Float32Array(16);
        m[0] = f / aspect;
        m[5] = f;
        m[10] = (far + near) / (near - far);
        m[11] = -1;
        m[14] = (2 * far * near) / (near - far);
        return m;
    },

    // lookAt: creates a 4x4 matrix for a camera looking at a target point
    //  eye - position of the camera
    //  target - point the camera is looking at
    //  up - vector indicating the camera's up direction
    lookAt(eye, target, up) {
        const subtract = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        const cross = (a, b) => [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];

        const normalize = (a) => {
            const length = Math.hypot(a[0], a[1], a[2]);
            return [a[0] / length, a[1] / length, a[2] / length];
        };

        // build camera's own three axes
        const zAxis = normalize(subtract(eye, target)); // points backward, away from the target
        const xAxis = normalize(cross(up, zAxis)); // points to the camera's right
        const yAxis = cross(zAxis, xAxis); // points to the camera's up direction

        return [
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1
        ];
    }
}