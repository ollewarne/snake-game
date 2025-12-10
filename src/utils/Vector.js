export class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(otherVector) {
        return new Vector(this.x + otherVector.x, this.y + otherVector.y);
    }

    subtract(otherVector) {
        return new Vector(this.x - otherVector.x, this.y - otherVector.y);
    }

    multiply(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    equals(otherVector) {
        return otherVector && this.x === otherVector.x && this.y === otherVector.y;
    }

    isOpposite(otherVector) {
        return this.x + otherVector === 0 && this.y + otherVector.y === 0;
    }

    clone() {
        return new Vector(this.x, this.y);
    }

    toString() {
        return `${this.x},${this.y}`;
    }

    toJSON() {
        return { x: this.x, y: this.y };
    }

    static fromJSON(data) {
        return new Vector(data.x, data.y);
    }

    static get UP() { return new Vector(0, -1); }
    static get DOWN() { return new Vector(0, 1); }
    static get LEFT() { return new Vector(-1, 0); }
    static get RIGHT() { return new Vector(1, 0); }
    static get ZERO() { return new Vector(0, 0); }

    static fromName(name) {
        const dirs = {
            up: Vector.UP,
            down: Vector.DOWN,
            left: Vector.LEFT,
            right: Vector.RIGHT
        };
        return dirs[name]?.clone() ?? null;
    }
}
