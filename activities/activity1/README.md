# Activity 1 - Practice Line Drawing

My task was to complete the 'makePixelatedLine' function, and test on different lines by specifying u,v coordinates. My implementation is below:

```javascript
function makePixelatedLine(u1, v1, u2, v2, color){

    u1 = Math.round(u1);
    v1 = Math.round(v1);
    u2 = Math.round(u2);
    v2 = Math.round(v2);

    // CASE: slope > 1
    const steepSlope = Math.abs(v2 - v1) > Math.abs(u2 - u1);
    if (steepSlope) {
        [u1, v1] = [v1, u1];
        [u2, v2] = [v2, u2];
    }

    // CASE: u1 > u2
    if (u1 > u2) {
        [u1, u2] = [u2, u1];
        [v1, v2] = [v2, v1];
    }

    const du = u2 - u1;
    const dv = v2 - v1;
    const m = (du === 0) ? 0 : dv / du;

    let v = v1;
    for (let u = u1; u <= u2; u++) {
        const vRound = Math.round(v);

        if (steepSlope) {
            setPixelColor(vRound, u, color);
        } else {
            setPixelColor(u, vRound, color);
        }
        v += m;
    }
}
```

![Pixelated Line Drawings](images/activity1-line-drawing.png>)
*Pixelated Line Drawings*