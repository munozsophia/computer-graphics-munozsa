const floorVertices = [
    { x: -1, y: 0, z: -1 }, // A, idx 0
    { x: 1, y: 0, z: -1 },  // B, idx 1
    { x: 1, y: 0, z: 1 },   // C, idx 2
    { x: -1, y: 0, z: 1 }   // D, idx 3
];

const floorEdges = [
    [0, 1], // AB
    [1, 2], // BC
    [2, 3], // CD
    [3, 0]  // DA
];

const floorColor = "#2FB8C4";

const floorGridVertices = [
    { x: -1, y: 0, z: 0 }, // A, idx 0
    { x: 1, y: 0, z: 0 }   // B, idx 1
];

const floorGridEdges = [
    [0, 1] // AB
];

const GRID_COUNT = 20;
const GRID_SPACE = 3;
const GRID_SPAN = GRID_COUNT * GRID_SPACE;

let floorGrids = [];

// floor grid instances
for (let i = 0; i < GRID_COUNT; i++) {
    let grid = {
        type: "floorGrid",
        position: { x: 0, y: -3, z: i * GRID_SPACE },
        scale: { x: 3, y: 1, z: 1 },
        color: floorColor
    };
    floorGrids.push(grid);
}

// floor instance
let floor = {
    type: "floor",
    position: { x: 0,  y: -3, z: 0 },
    scale: { x: 3, y: 1, z: 1000 },
    color: floorColor
};

let instances =  [floor];

for (let i = 0; i < floorGrids.length; i++) {
    instances.push(floorGrids[i]);
}

const OBJECT_TYPES = {
    floor: { vertices: floorVertices, edges: floorEdges },
    floorGrid: { vertices: floorGridVertices, edges: floorGridEdges }
};