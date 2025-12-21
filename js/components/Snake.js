import { CONFIG } from "../config.js";
import { defaultKeyMap } from "../utils/keymap.js";
import { Vector } from "../utils/Vector.js";

export class Snake {
    constructor(opts = {}) {
        this.id = opts.id ?? Math.random().toString(36).slice(2, 8);

        this.color = opts.color;
        this.alive = true;

        const start = opts.startPos ?? { x: 20, y: 15 };
        const dir = opts.dir ?? Vector.RIGHT;
        this.dir = dir.clone();
        this.lastMoveDir = dir.clone();

        this.body = [];
        for (let i = 0; i < opts.initialLength ?? 3; i++) {
            this.body.push(new Vector(
                start.x - i * dir.x,
                start.y - i * dir.y
            ));
        }

        this.pendingGrow = 0;
        this.keyMap = opts.keyMap ?? defaultKeyMap();

        this.respawning = false;
        this.respawnTime = 0;
    }

    setDirection(newDir) {
        if (!this.alive || !newDir) return;
        if (this.lastMoveDir.isOpposite(newDir)) return;
        this.dir = newDir.clone();
    }

    setDirectionFromName(name) {
        const dir = Vector.fromName(name);
        if (dir) this.setDirection(dir);
    }

    get head() {
        return this.body[0];
    }

    move() {
        if (!this.alive) return null;

        const newHead = this.head.add(this.dir);
        this.body.unshift(newHead);

        if (this.pendingGrow > 0) {
            this.pendingGrow--;
        } else {
            this.body.pop();
        }

        this.lastMoveDir = this.dir.clone();
        return newHead;
    }

    grow(n = 1) {
        this.pendingGrow += n;
    }

    checkBorderDeath(maxCols, maxRows) {
        const h = this.head;
        if (h.x < 0 || h.x >= maxCols || h.y < 0 || h.y >= maxRows) {
            this.alive = false;
            return true;
        }
        return false;
    }

    checkSelfCollision() {
        const h = this.head;
        for (let i = 1; i < this.body.length; i++) {
            if (h.equals(this.body[i])) {
                return true;
            }
        }
        return false;
    }

    respawn(length, position, dir) {
        this.body = [position.clone()],
            this.dir = dir.clone();
        this.lastMoveDir = dir.clone();
        this.pendingGrow = CONFIG.initialLength - 1;
        this.alive = true;
    }

    // for multiplayer

    toNetworkState() {
        return {
            id: this.id,
            color: this.color,
            head: this.body.length > 0 ? this.head.toJSON() : null,
            dir: this.dir.toJSON(),
            length: this.body.length,
            alive: this.alive,
            respawning: this.respawning,
            score: this.body.length,
            pendingGrow: this.pendingGrow
        }
    }

    updateFromNetworkState(data) {
        this.respawning = data.respawning || false;
        this.color = data.color || this.color;

        if (data.respawning || data.head === null) {
            this.body = [];
            this.alive = data.alive;
            return;
        }

        const headX = data.head.x;
        const headY = data.head.y;
        const dirX = data.dir.x;
        const dirY = data.dir.y;

        const headMoved = !this.head || this.head.x !== headX || this.head.y !== headY;
        const dirChanged = this.dir.x !== dirX || this.dir.y !== dirY;

        if (dirChanged) {
            this.dir.set(dirX, dirY);
        }

        if (!this.alive && data.alive) {
            this.body = [new Vector(headX, headY)];
            this.pendingGrow = data.length - 1;
        } else if (headMoved && data.alive) {
            this.body.unshift(new Vector(headX, headY));

            while (this.body.length > data.length) {
                this.body.pop();
            }

            while (this.body.length < data.length) {
                this.body.push(this.body[this.body.length - 1].clone());
            }
        }

        this.alive = data.alive;
        this.pendingGrow = data.pendingGrow || 0;
    }

    toJSON() {
        return {
            id: this.id,
            color: this.color,
            alive: this.alive,
            score: this.body.length,
            body: this.body.map(v => v.toJSON()),
            dir: this.dir.toJSON(),
        };
    }

    static fromJSON(data) {
        const snake = new Snake({
            id: data.id,
            color: data.color,
            startPos: Vector.fromJSON(data.body[0]),
            dir: Vector.fromJSON(data.dir)
        });
        snake.alive = data.alive;
        snake.body = data.body.map(v => Vector.fromJSON(v));
        return snake;
    }

    // Update from host player?
    updateFromJSON(data) {
        this.alive = data.alive;
        this.body = data.body.map(v => Vector.fromJSON(v));
        this.dir = Vector.fromJSON(data.dir);
    }

}
