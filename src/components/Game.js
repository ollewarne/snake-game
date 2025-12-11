import { Vector } from "../utils/Vector.js";
import { Snake } from "./Snake.js";
import { Pickup } from "./Pickup.js";
import { CONFIG } from "../config.js";

export class Game {
    constructor(opts = {}) {

        this.gridCols = opts.gridCols ?? CONFIG.gridCols;
        this.gridRows = opts.gridRows ?? CONFIG.gridRows;
        this.tickMS = opts.tickMS ?? CONFIG.tickMS;

        // game state
        this.snakes = [];
        this.pickups = [];
        this.tickTimer = null;
        this.isRunning = false;

        this.onStateChange = opts.onStateChange ?? (() => { });
        this.onGameOver = opts.onGameOver ?? (() => { });
    }

    init() {
        console.log("game init called");
        this.stop();
        this.snakes = [];
        this.pickups = [];

    }

    addSnake(opts = {}) {
        const snake = new Snake({ initialLength: CONFIG.initialLength, ...opts });
        this.snakes.push(snake);
        return snake;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.tickTimer = setInterval(() => this.tick(), this.tickMS);
    }

    stop() {
        if (this.tickTimer) {
            clearInterval(this.tickTimer);
            this.tickTimer = null;
        }
        this.isRunning = false;
    }


    //spawning snakes and items

    findFreePosition() {
        const occupied = new Set();

        for (const snake of this.snakes) {
            for (const seg of snake.body) {
                occupied.add(seg.toString());
            }
        }

        for (const pickup of this.pickups) {
            occupied.add(pickup.position.toString());
        }

        let tries = 0;
        while (tries++ < 10000) {
            const x = Math.floor(Math.random() * this.gridCols);
            const y = Math.floor(Math.random() * this.gridRows);
            const pos = new Vector(x, y);
            if (!occupied.has(pos.toString())) return pos;
        }

        return new Vector(0, 0);
    }

    spawnPickup(type = "food") {
        const pos = this.findFreePosition();
        const pickup = new Pickup(pos, type);
        this.pickups.push(pickup);
        return pickup;
    }

    // game loop

    tick() {
        if (!this.snakes.some(s => s.alive)) {
            this.onGameOver(this.getState());
            return;
        }

        this.moveSnakes();

        this.checkSnakeCollisions();

        this.checkPickups();

        this.maintainPickups();

        this.onStateChange(this.getState());
    }


    moveSnakes() {
        for (const snake of this.snakes) {
            if (!snake.alive) continue;
            snake.move();
            snake.checkBorderDeath(this.gridCols, this.gridRows);
        }
    }

    checkSnakeCollisions() {
        for (const snake of this.snakes) {
            if (snake.alive) snake.checkSelfCollision();
        }

        for (let i = 0; i < this.snakes.length; i++) {
            const snake = this.snakes[i];
            if (!snake.alive) continue;

            for (let j = 0; j < this.snakes.length; j++) {
                if (i === j) continue;
                if (snake.checkCollisionWithOther(this.snakes[j])) break;
            }
        }

        const heads = new Map();
        for (const snake of this.snakes) {
            if (!snake.alive) continue;
            const key = snake.head.toString();
            if (!heads.has(key)) heads.set(key, []);
            heads.get(key).push(snake);
        }

        for (const [, snakesAtPos] of heads) {
            if (snakesAtPos.length > 1) {
                for (const snake of snakesAtPos) {
                    snake.alive = false;
                }
            }
        }
    }

    checkPickups() {
        for (const snake of this.snakes) {
            if (!snake.alive) continue;

            for (let i = this.pickups.length - 1; i >= 0; i--) {
                const pickup = this.pickups[i];
                if (pickup.isAt(snake.head)) {
                    pickup.applyTo(snake);
                    this.pickups.splice(i, 1);
                }
            }
        }
    }

    maintainPickups() {
        //make sure there is always three pickups on the grid
        while (this.pickups.length < 3) {
            this.spawnPickup("food");
        }
    }


    // handling inputs
    handleKeyPress(key, playerId = null) {
        for (const snake of this.snakes) {
            if (playerId && snake.id !== playerId) continue;

            if (snake.alive && snake.keyMap[key]) {
                snake.setDirectionFromName(snake.keyMap[key]);
                return true;
            }
        }
        return false;
    }

    // handling state for the game
    getState() {
        return {
            snakes: this.snakes,
            pickups: this.pickups,
            isGameOver: this.snakes.every(s => !s.alive)
        };
    }

    toJSON() {
        return {
            snakes: this.snakes.map(s => s.toJSON()),
            pickups: this.pickups.map(p => p.toJSON()),
        };
    }

    //get state from server and apply locally for clients that are not the host
    applyState(data) {
        for (const snakeData of data.snakes) {
            const existing = this.snakes.find(s => s.id === snakeData.id);
            if (existing) {
                existing.updateFromJSON(snakeData);
            } else {
                this.snakes.push(Snake.fromJSON(snakeData));
            }
        }

        const serverIds = new Set(data.snakes.map(s => s.id));
        this.snakes = this.snakes.filter(s => serverIds.has(s.id));

        this.pickups = data.pickups.map(p => Pickup.fromJSON(p));
    }
}
