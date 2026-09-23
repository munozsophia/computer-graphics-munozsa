function drawLevel0(ctx, canvas) {
    // here we set up and clear the canvas, every draw frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // here we will store u,v coordinates for the vertices,
    // projected onto our 2d plane
    let projectedVertices = [];

    // loop through the original vertices (X, Y, Z), determine their
    // position relative to the camera, then project onto the 2D plane
    for (let v = 0; v < level0Vertices.length; v++) {
        let canvasPos = projectVertex(level0Vertices[v], canvas.width, canvas.height);
        projectedVertices.push(canvasPos);
    }

    // loop through the edges, find the projected vertices - 2 per edge -
    // and draw the line
    for (let e = 0; e < level0Edges.length; e++) {
        let e1 = level0Edges[e][0];
        let u1 = projectedVertices[e1].u;
        // canvas.height is subtracted from v since increasing y goes
        // down the canvas, matching the expected orientation
        let v1 = canvas.height - projectedVertices[e1].v;

        let e2 = level0Edges[e][1];
        let u2 = projectedVertices[e2].u;
        let v2 = canvas.height - projectedVertices[e2].v;

        drawLine(ctx, u1, v1, u2, v2, "#33FF33");
    }
}