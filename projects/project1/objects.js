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

const floorTriangles = [
    [0, 3, 1], [1, 3, 2]
];

const floorGridVertices = [
    { x: -1, y: 0, z: 0 }, // A, idx 0
    { x: 1, y: 0, z: 0 }   // B, idx 1
];

const floorGridEdges = [
    [0, 1] // AB
];

const cubeVertices = [
    { x: 1, y: 1, z: 1 },   // A, idx 0
    { x: -1, y: 1, z: 1 },  // B, idx 1
    { x: 1, y: -1, z: 1 },  // C, idx 2
    { x: -1, y: -1, z: 1 }, // D, idx 3
    { x: 1, y: 1, z: -1 },  // E, idx 4
    { x: -1, y: 1, z: -1 }, // F, idx 5
    { x: 1, y: -1, z: -1 }, // G, idx 6
    { x: -1, y: -1, z: -1 } // H, idx 7
];

const cubeEdges = [
    [0, 1], // AB
    [0, 2], // AC
    [0, 4], // AE
    [2, 3], // CD
    [1, 3], // BD
    [2, 6], // CG
    [4, 5], // EF
    [4, 6], // EG
    [1, 5], // BF
    [6, 7], // GH
    [5, 7], // FH
    [3, 7]  // DH
];

const cubeTriangles = [
    [0, 1, 3], [0, 3, 2], // front +z
    [4, 7, 5], [4, 6, 7], // back -z
    [0, 6, 4], [0, 2, 6], // right +x
    [1, 5, 7], [1, 7, 3], // left -x
    [0, 4, 5], [0, 5, 1], // top +y
    [2, 7, 6], [2, 3, 7]  // bottom -y
];

const octahedronVertices = [
    { x: 0, y: 1, z: 0 },  // A, idx 0
    { x: 0, y: -1, z: 0 }, // B, idx 1
    { x: 1, y: 0, z: 0 },  // C, idx 2
    { x: 0, y: 0, z: -1 }, // D, idx 3
    { x: -1, y: 0, z: 0 }, // E, idx 4
    { x: 0, y: 0, z: 1 },  // F, idx 5
];

const octahedronEdges = [
    [0, 2], // AC
    [0, 3], // AD
    [0, 4], // AE
    [0, 5], // AF
    [1, 2], // BC
    [1, 3], // BD
    [1, 4], // BE
    [1, 5], // BF
    [2, 3], // CD
    [3, 4], // DE
    [4, 5], // EF
    [5, 2]  // FC
];

const octahedronTriangles = [
    [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 2], // top 4 faces
    [1, 3, 2], [1, 4, 3], [1, 5, 4], [1, 2, 5]  // bottom 4 faces
];

const shotVertices = [
    { x: 0.05, y: 0.05, z: 1 },   // A, idx 0
    { x: -0.05, y: 0.05, z: 1 },  // B, idx 1
    { x: 0.05, y: -0.05, z: 1 },  // C, idx 2
    { x: -0.05, y: -0.05, z: 1 }, // D, idx 3
    { x: 0.05, y: 0.05, z: -1 },  // E, idx 4
    { x: -0.05, y: 0.05, z: -1 }, // F, idx 5
    { x: 0.05, y: -0.05, z: -1 }, // G, idx 6
    { x: -0.05, y: -0.05, z: -1 } // H, idx 7
];

const shotEdges = [
    [0, 1], // AB
    [0, 2], // AC
    [0, 4], // AE
    [2, 3], // CD
    [1, 3], // BD
    [2, 6], // CG
    [4, 5], // EF
    [4, 6], // EG
    [1, 5], // BF
    [6, 7], // GH
    [5, 7], // FH
    [3, 7]  // DH
];

const cubeColor = "#D85A30";
const floorColor = "#2FB8C4";
const octahedronColor = "#7CD957";
const shotColor = "#F2F2F2";
const buildingColor = "#5B4B9A";

let octahedrons = [
    {
        type: "octahedron",
        position: { x: 0, y: 0, z: 14 },
        scale: 0.5,
        color: octahedronColor,
        destroyed: false
    },
    {
        type: "octahedron",
        position: { x: -0.8, y: -1, z: 25 },
        scale: 0.5,
        color: octahedronColor,
        destroyed: false
    },
    {
        type: "octahedron",
        position: { x: 0.8, y: -1, z: 38 },
        scale: 0.5,
        color: octahedronColor,
        destroyed: false
    },
    {
        type: "octahedron",
        position: { x: -1.2, y: 0.5, z: 48 },
        scale: 0.5,
        color: octahedronColor,
        destroyed: false
    },
    {
        type: "octahedron",
        position: { x: 1.5, y: -0.5, z: 55 },
        scale: 0.5,
        color: octahedronColor,
        destroyed: false
    },
    {
        type: "octahedron",  
        position: { x: 0, y: 0.8, z: 62 },
        scale: 0.5,
        color: octahedronColor,
        destroyed: false
    },
    {
        type: "octahedron",
        position: { x: -0.5, y: -0.8, z: 70 },
        scale: 0.5,
        color: octahedronColor,
        destroyed: false
    }
];

// cube instances
let cubes = [
    {
        type: "cube",
        position: { x: 1.5, y: -1.2, z: 10 },
        scale: { x: 1, y: 1.8, z: 1 },
        color: cubeColor,
        destroyed: false,
        baseX: 1.5,
        moveRange: 1.5,
        moveSpeed: 0.02
    },
    {
        type: "cube",
        position: { x: -1.5, y: -1.2, z: 20 },
        scale: { x: 1, y: 1.8, z: 1 },
        color: cubeColor,
        destroyed: false,
        baseX: -1.5,
        moveRange: 1.5,
        moveSpeed: 0.025
    },
    {
        type: "cube",
        position: { x: 0, y: -0.8, z: 32 },
        scale: { x: 1.2, y: 2.2, z: 1.2 },
        color: cubeColor,
        destroyed: false,
        baseX: 0,
        moveRange: 2,
        moveSpeed: 0.018
    },
    {
        type: "cube",
        position: { x: -1, y: -1.5, z: 45 },
        scale: { x: 1, y: 1.5, z: 1 },
        color: cubeColor,
        destroyed: false,
        baseX: -1,
        moveRange: 2.2,
        moveSpeed: 0.03
    },
    {
        type: "cube",
        position: { x: 1, y: -1, z: 58 },
        scale: { x: 1.3, y: 2, z: 1.3 },
        color: cubeColor,
        destroyed: false,
        baseX: 1,
        moveRange: 1.8,
        moveSpeed: 0.022
    },
    {
        type: "cube",
        position: { x: -1.2, y: -1.2, z: 46 },
        scale: { x: 1, y: 1.8, z: 1 },
        color: cubeColor,
        destroyed: false,
        baseX: -1.2,
        moveRange: 2.8,
        moveSpeed: 0.02,
        movePhase: 0
    },
    {
        type: "cube",
        position: { x: 1.5, y: -1.2, z: 53 },
        scale: { x: 1, y: 1.8, z: 1 },
        color: cubeColor,
        destroyed: false,
        baseX: 1.5,
        moveRange: 2.8,
        moveSpeed: 0.02,
        movePhase: Math.PI
    }
];

const GRID_COUNT = 20;
const GRID_SPACE = 3;
const GRID_SPAN = GRID_COUNT * GRID_SPACE;

let floorGrids = [];
let buildings = [];

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

const BUILDING_COUNT = 18;
const BUILDING_SPAN = 150;
const BUILDING_BASE_Y = floor.position.y - 60;
const BUILDING_SLOT_SIZE = BUILDING_SPAN / BUILDING_COUNT;

// building instances
for (let i = 0; i < BUILDING_COUNT; i++) {
    let side = Math.random() < 0.5 ? -1 : 1;

    let footprint = 1.5 + Math.random() * 2.5;

    let topOffset = -10 + Math.random() * 30;
    let topY = floor.position.y + topOffset;

    let height = topY - BUILDING_BASE_Y;
    let centerY = (topY + BUILDING_BASE_Y) / 2;

    let x = side * (floor.scale.x + 15 + Math.random() * 30);
    let z = i * BUILDING_SLOT_SIZE + Math.random() * BUILDING_SLOT_SIZE * 0.6;

    buildings.push({
        type: "cube",
        position: { x: x, y: centerY, z: z },
        scale: { x: footprint, y: height / 2, z: footprint },
        color: buildingColor
    });
}

let instances =  [];

for (let i = 0; i < buildings.length; i++) {
    instances.push(buildings[i]);
}

instances.push(floor);

for (let i = 0; i < floorGrids.length; i++) {
    instances.push(floorGrids[i]);
}

for (let i = 0; i < cubes.length; i++) {
    instances.push(cubes[i]);
}

for (let i = 0; i < octahedrons.length; i++) {
    instances.push(octahedrons[i]);
}

const OBJECT_TYPES = {
    floor: { vertices: floorVertices, edges: floorEdges, triangles: floorTriangles },
    floorGrid: { vertices: floorGridVertices, edges: floorGridEdges },
    cube: { vertices: cubeVertices, edges: cubeEdges, triangles: cubeTriangles },
    octahedron: { vertices: octahedronVertices, edges: octahedronEdges, triangles: octahedronTriangles },
    shot: { vertices: shotVertices, edges: shotEdges }
};