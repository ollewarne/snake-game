import { Vector } from "../utils/Vector.js";

export class Pickup {
    constructor(position, type = "food") {
        this.position = position instanceof Vector ? position : new Vector(position.x, position.y);
        this.type = type;
        this.id = Math.random().toString(36).slice(2, 8);
    }

    isAt(pos) {
        return this.position.equals(pos);
    }

    applyTo(snake) {
        snake.grow(1);
    }

    toJSON() {
        return {
            id: this.id,
            position: this.position.toJSON(),
            type: this.type
        }
    }

    static fromJSON(data) {
        const pickup = new Pickup(Vector.fromJSON(data.position), data.type);
        pickup.id = data.id;
        return pickup;
    }
}
