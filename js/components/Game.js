import { Vector } from "../utils/Vector.js";
import { Snake } from "./Snake.js";
import { Pickup } from "./Pickup.js";
import { CONFIG } from "../config.js";

export class Game {
    constructor(opts = {}) {
        this.gridCols = opts.gridCols ?? CONFIG.gridCols;
        this.gridRows = opts.gridRows ?? CONFIG.gridRows;
        this.tickMS = opts.tickMS ?? CONFIG.tickMS;

        this.snakes = [];
        this.pickups = [];
        this.tickTimer = null;
        this.isRunning = false;

        this.timeRemainingMS = null;

        this.onStateChange = opts.onStateChange ?? (() => { });
        this.onGameOver = opts.onGameOver ?? (() => { });
    }

    init() {
        this.stop();
        this.snakes = [];
        this.pickups = [];
        this.timeRemainingMS = CONFIG.gameDurationMS;
    }

    addSnake(opts = {}) {
        const snake = new Snake({ initialLength: CONFIG.initialLength, ...opts });
        this.snakes.push(snake);
        return snake;
    }

    removeSnake(id) {
        console.log('removeSnake called:', id);
        const index = this.snakes.findIndex(s => s.id === id);
        console.log('Found at index:', index);
        if (index !== -1) {
            this.snakes.splice(index, 1);
            console.log('Snake removed, remaining:', this.snakes.map(s => s.id));
        }
    }

    getSnake(id) {
        return this.snakes.find(s => s.id === id);
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

    // Spawning items

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

        const isEdge = pos.x === 0 || pos.x === this.gridCols - 1 || pos.y === 0 || pos.y === this.gridRows - 1;
        const pickupType = isEdge ? "special" : type;
        const pickup = new Pickup(pos, pickupType);
        this.pickups.push(pickup);
        return pickup;
    }

    // Game loop

    tick() {
        this.timeRemainingMS -= this.tickMS;
        if (this.timeRemainingMS <= 0) {
            this.timeRemainingMS = 0;
            this.onGameOver(this.getState());
            this.stop();
            return;
        }

        this.checkSnakeCollisions();
        this.moveSnakes();
        this.checkPickups();
        this.maintainPickups();

        this.onStateChange(this.getState());
    }

    respawnSnake(snake) {
        const spawn = CONFIG.spawnPoints[Math.floor(Math.random() * CONFIG.spawnPoints.length)];
        let length = snake.body.length;
        snake.alive = false;
        snake.respawning = true;
        snake.body = [];
        setTimeout(() => {
            snake.respawning = false;
            snake.respawn(length, spawn.startPos, spawn.dir);
        }, CONFIG.respawnTimer);
    }

    moveSnakes() {
        for (const snake of this.snakes) {
            if (!snake.alive) continue;
            snake.move();
            if (snake.checkBorderDeath(this.gridCols, this.gridRows)) {
                this.respawnSnake(snake);
            }
        }
    }

    checkSnakeCollisions() {
        const toRespawn = new Set();

        for (const snake of this.snakes) {
            if (!snake.alive) continue;
            if (snake.checkSelfCollision()) toRespawn.add(snake);
        }

        for (const snake of toRespawn) {
            snake.alive = true;
        }


        for (let i = 0; i < this.snakes.length; i++) {
            const snake = this.snakes[i];
            if (!snake.alive || snake.body.length === 0) continue;

            for (let j = 0; j < this.snakes.length; j++) {
                if (i === j) continue;
                const other = this.snakes[j];
                if (!other.alive || other.body.length === 0) continue;

                const head = snake.head;
                for (let k = 1; k < other.body.length; k++) {
                    if (head.equals(other.body[k])) {
                        toRespawn.add(snake);
                        break;
                    }
                }
            }
        }

        const heads = new Map();
        for (const snake of this.snakes) {
            if (!snake.alive || snake.body.length === 0) continue;
            const key = snake.head.toString();
            if (!heads.has(key)) heads.set(key, []);
            heads.get(key).push(snake);
        }

        for (const [, snakesAtPos] of heads) {
            if (snakesAtPos.length > 1) {
                for (const snake of snakesAtPos) {
                    toRespawn.add(snake);
                }
            }
        }

        for (const snake of toRespawn) {
            this.respawnSnake(snake);
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
        while (this.pickups.length < 3) {
            this.spawnPickup("food");
        }
    }

    // Handling inputs
    isValidInput(key, playerId = null) {
        for (const snake of this.snakes) {
            if (playerId && snake.id !== playerId) continue;
            if (snake.alive && snake.keyMap[key]) {
                return true;
            }
        }
        return false;
    }

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

    getWinner() {
        if (this.snakes.length === 0) return null;

        let winner = this.snakes[0];
        for (const snake of this.snakes) {
            if (snake.body.length > winner.body.length) {
                winner = snake;
            }
        }
        return winner;
    }

    getState() {
        return {
            snakes: this.snakes,
            pickups: this.pickups,
            timeRemaining: Math.round(this.timeRemainingMS / 1000),
            timeRemainingMS: this.timeRemainingMS,
            isGameOver: this.timeRemainingMS <= 0
        };
    }

    getNetworkState() {
        return {
            snakes: this.snakes.map(s => s.toNetworkState()),
            pickups: this.pickups.map(p => p.toJSON()),
            timeRemainingMS: this.timeRemainingMS
        }
    }

    applyNetworkState(data) {
        for (const snakeData of data.snakes) {
            const existing = this.snakes.find(s => s.id === snakeData.id);
            if (existing) {
                if (snakeData.head === null) {
                    existing.alive = snakeData.alive;
                    existing.longestLength = snakeData.score;
                    continue;
                }
                existing.updateFromNetworkState(snakeData);
            } else {
                if (snakeData.head === null) continue;
                const newSnake = new Snake({
                    id: snakeData.id,
                    color: snakeData.color,
                    startPos: Vector.fromJSON(snakeData.head),
                    dir: Vector.fromJSON(snakeData.dir),
                    initialLength: 1
                });
                newSnake.alive = snakeData.alive;
                newSnake.longestLength = snakeData.score;
                newSnake.pendingGrow = snakeData.pendingGrow || 0;
                this.snakes.push(newSnake);
            }
        }

        const serverIds = new Set(data.snakes.map(s => s.id));
        this.snakes = this.snakes.filter(s => serverIds.has(s.id));

        this.pickups = data.pickups.map(p => Pickup.fromJSON(p));

        if (typeof data.timeRemainingMS === 'number') {
            this.timeRemainingMS = data.timeRemainingMS;
        }
    }
}
