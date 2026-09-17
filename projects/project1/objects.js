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

// floor instance
let floor = {
    type: "floor",
    position: { x: 0,  y: -3, z: 15 },
    scale: { x: 3, y: 1, z: 15 },
    color: floorColor
};

let instances =  [floor];

const OBJECT_TYPES = {
    floor: { vertices: floorVertices, edges: floorEdges }
};