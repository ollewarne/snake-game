import { Vector } from "./utils/Vector.js";
export const CONFIG = {
    // Grid
    cellSize: 20,
    gridCols: 60,
    gridRows: 50,

    playerLimit: 4,

    // Timing
    tickMS: 100,
    gameDurationMS: 90000, // 1,5 minutes

    // Snake
    initialLength: 3,
    growOnFood: 1,

    // Colors
    gridColor: "#071218",
    foodColor: "#941909",

    playerColors: [
        { hue: 0 },
        { hue: 45 },
        { hue: 120 },
        { hue: 220 }
    ],

    //spawns
    respawnTimer: 500,
    spawnPoints: [
        {
            startPos: new Vector(10, 15),
            dir: Vector.RIGHT,
        },
        {
            startPos: new Vector(10, 45),
            dir: Vector.RIGHT,
        },
        {
            startPos: new Vector(50, 45),
            dir: Vector.LEFT,
        },
        {
            startPos: new Vector(50, 15),
            dir: Vector.LEFT,
        },
        {
            startPos: new Vector(30, 5),
            dir: Vector.DOWN
        },
        {
            startPos: new Vector(30, 45),
            dir: Vector.UP
        }
    ]
};
