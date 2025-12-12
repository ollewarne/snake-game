import { CONFIG } from "../config.js";
import { defaultKeyMap } from "../utils/keymap.js";
import { Vector } from "../utils/Vector.js";

function generateSnakeColors() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70;

    return {
        color: `hsl(${hue}, ${saturation}%, 45%)`,
        alternateColor: `hsl(${hue}, ${saturation}%, 35%)`
    }
}

export class Snake {
    constructor(opts = {}) {
        this.id = opts.id ?? Math.random().toString(36).slice(2, 8);

        const colors = opts.color ? null : generateSnakeColors();
        this.color = opts.color ?? colors.color;
        this.alternateColor = opts.alternateColor ?? colors.alternateColor;
        this.alive = true;

        const start = opts.startPos ?? { x: 20, y: 15 };
        const dir = opts.dir ?? Vector.RIGHT;
        this.dir = dir.clone();
        this.lastMoveDir = dir.clone();

        this.longestLength = CONFIG.initialLength;

        this.body = [];
        for (let i = 0; i < opts.initialLength ?? 2; i++) {
            this.body.push(new Vector(
                start.x - i * dir.x,
                start.y - i * dir.y
            ));
        }

        this.pendingGrow = 0;
        this.keyMap = opts.keyMap ?? defaultKeyMap();
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
        if (this.body.length >= this.longestLength) this.longestLength += n;
    }

    get score() {
        return this.longestLength;
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
                this.alive = false;
                return true;
            }
        }
        return false;
    }

    checkCollisionWithOther(other) {
        const h = this.body[0];
        for (const seg of other.body) {
            if (h.equals(seg)) {
                this.alive = false;
                return true;
            }
        }
        return false;
    }

    occupies(pos) {
        return this.body.some(seg => seg.equals(pos));
    }

    respawn(length, position, dir) {
        if (this.longestLength < length) this.longestLength = length;
        this.body = [position.clone()],
        this.dir = dir.clone();
        this.lastMoveDir = dir.clone();
        this.pendingGrow = CONFIG.initialLength - 1;
        this.alive = true;
    }

    // for multiplayer
    toJSON() {
        return {
            id: this.id,
            color: this.color,
            alternateColor: this.alternateColor,
            alive: this.alive,
            score: this.score,
            body: this.body.map(v => v.toJSON()),
            dir: this.dir.toJSON(),
        };
    }

    static fromJSON(data) {
        const snake = new Snake({
            id: data.id,
            color: data.color,
            alternateColor: data.alternateColor,
            startPos: Vector.fromJSON(data.body[0]),
            dir: Vector.fromJSON(data.dir)
        });
        snake.alive = data.alive;
        snake.score = data.score;
        snake.body = data.body.map(v => Vector.fromJSON(v));
        return snake;
    }

    // Update from server data (for remote players)
    updateFromJSON(data) {
        this.alive = data.alive;
        this.score = data.score;
        this.body = data.body.map(v => Vector.fromJSON(v));
        this.dir = Vector.fromJSON(data.dir);
    }

}
