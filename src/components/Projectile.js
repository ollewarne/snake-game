import { Vector } from "../utils/Vector.js";
import { CONFIG } from "../config.js";

export class Projectile {
    constructor(opts = {}) {
        this.id = opts.id ?? Math.random().toString(36).slice(2, 8);
        this.ownerId = opts.ownerId;
        this.position = opts.position?.clone() ?? new Vector(0, 0);
        this.direction = opts.direction?.clone() ?? Vector.RIGHT;
        this.speed = opts.speed ?? CONFIG.projectileSpeed;
        this.color = opts.color ?? "#ff4444";
        this.alive = true;
    }

    move() {
        if (!this.alive) return;
        this.position = this.position.add(this.direction.multiply(this.speed));
    }

    isOutOfBounds(maxCols, maxRows) {
        const p = this.position;
        return p.x < 0 || p.x >= maxCols || p.y < 0 || p.y >= maxRows;
    }

    checkHit(snake) {
        if (!this.alive || !snake.alive) return false;
        if (snake.id === this.ownerId) return false;

        for (const seg of snake.body) {
            if (this.position.equals(seg)) {
                return true;
            }
        }
        return false;
    }

    toJSON() {
        return {
            id: this.id,
            ownerId: this.ownerId,
            position: this.position.toJSON(),
            direction: this.direction.toJSON(),
            color: this.color,
            alive: this.alive
        };
    }

    static fromJSON(data) {
        const proj = new Projectile({
            id: data.id,
            ownerId: data.ownerId,
            position: Vector.fromJSON(data.position),
            direction: Vector.fromJSON(data.direction),
            color: data.color
        });
        proj.alive = data.alive;
        return proj;
    }
}
