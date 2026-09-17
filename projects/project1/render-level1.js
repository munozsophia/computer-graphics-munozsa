function drawLevel1(ctx, canvas) {
    // here we set up and clear the canvas, every draw frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // loop through every instance in the scene
    for (let i = 0; i < instances.length; i++) {
        let instance = instances[i];
        let objectType = OBJECT_TYPES[instance.type];

        if (!objectType) continue;

        let vertices = objectType.vertices;
        let edges = objectType.edges;

        // loop through object's base vertices (X, Y, Z)
        // and apply the instance position and scale to each one
        let scaleX = typeof instance.scale === "number" ? instance.scale : instance.scale.x;
        let scaleY = typeof instance.scale === "number" ? instance.scale : instance.scale.y;
        let scaleZ = typeof instance.scale === "number" ? instance.scale : instance.scale.z;

        let transformedVertices = [];

        for (let v = 0; v < vertices.length; v++) {
            let transformed = {};
            transformed.x = vertices[v].x * scaleX + instance.position.x;
            transformed.y = vertices[v].y * scaleY + instance.position.y;
            transformed.z = vertices[v].z * scaleZ + instance.position.z;

            transformedVertices.push(transformed);
        }

        // here we will store u,v coordinates for the vertices,
        // projected onto our 2d plane
        let projectedVertices = [];

        // loop through transformed vertices (X, Y, z)
        // determines the position in 3D space relative to camera (x, y, z)
        // then project them onto the 2D plane
        for (let v = 0; v < transformedVertices.length; v++) {
            let canvasPos = projectVertex(transformedVertices[v], canvas.width, canvas.height);
            projectedVertices.push(canvasPos);
        }

        // loop through the edges
        // find the newly computed projected vertices - 2 per edge
        // draw the line
        for (let e = 0; e < edges.length; e++) {
            // first vertex
            let e1 = edges[e][0]; // idx
            let p1 = projectedVertices[ e1 ];

            // second vertex
            let e2 = edges[e][1]; // idx
            let p2 = projectedVertices[ e2 ];

            // p#.z is the vertex depth relative to camera
            // if not positive, the vertex is behind camera
            // skip drawing the edge
            if (p1.z <= 0 || p2.z <= 0) { continue; }

            let u1 = p1.u;
            let u2 = p2.u;

            // in some graphics systems, the y-coordinate increases downwards
            // that is why the canvas.height is subtracted from the v-coordinate,
            // matching the expected orientation
            let v1 = canvas.height - p1.v;
            let v2 = canvas.height - p2.v;

            drawLine(ctx, u1, v1, u2, v2, instance.color);
        }
    }
}

// This uses a built in 'drawLine' function, provided by the javascript canvas
function drawLine(ctx, x1, y1, x2, y2, color) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = color || "#33FF33";

    // this is how you draw a line on the canvas
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}