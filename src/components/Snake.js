import { DIRS, defaultKeyMap, shadeColor, posEq } from "../utils//utils.js";
import { CELL_SIZE, INITIAL_LENGTH } from "../components/game.js";

export class Snake {
  constructor(opts = {}) {
    this.id = opts.id ?? Math.random().toString(36).slice(2, 8);
    this.color = opts.color ?? "#4caf50";
    this.alternateColor = opts.alternateColor ?? "#2e7d32";
    this.alive = true;
    this.score = 0;

    const start = opts.startPos ?? { x: 20, y: 15 };
    const dir = opts.dir ?? DIRS.right;
    this.dir = { ...dir };

    this.body = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      this.body.push({
        x: start.x - i * dir.x,
        y: start.y - i * dir.y
      });
    }

    this.pendingGrow = 0;
    this.keyMap = opts.keyMap ?? defaultKeyMap();
    this.lastMoveDir = { ...this.dir };
  }

  setDirectionFromName(name) {
    if (!this.alive) return;
    const next = DIRS[name];
    if (!next) return;
    // prevent reversing
    if (this.lastMoveDir.x + next.x === 0 && this.lastMoveDir.y + next.y === 0) return;
    this.dir = { ...next };
  }

  move() {
    if (!this.alive) return null;
    const head = this.body[0];
    const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };
    this.body.unshift(newHead);

    if (this.pendingGrow > 0) {
      this.pendingGrow--;
    } else {
      this.body.pop();
    }

    this.lastMoveDir = { ...this.dir };
    return newHead;
  }

  grow(n = 1) {
    this.pendingGrow += n;
    this.score += n;
  }

  checkBorderDeath(maxCols, maxRows) {
    const h = this.body[0];
    if (h.x < 0 || h.x >= maxCols || h.y < 0 || h.y >= maxRows) {
      this.alive = false;
      return true;
    }
    return false;
  }

  checkSelfCollision() {
    const h = this.body[0];
    for (let i = 1; i < this.body.length; i++) {
      if (posEq(h, this.body[i])) {
        this.alive = false;
        return true;
      }
    }
    return false;
  }

  checkCollisionWithOther(other) {
    const h = this.body[0];
    for (const seg of other.body) {
      if (posEq(h, seg)) {
        this.alive = false;
        return true;
      }
    }
    return false;
  }

  draw(ctx) {
    const head = this.body[0];
    ctx.fillStyle = this.color;
    ctx.fillRect(head.x * CELL_SIZE, head.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    for (let i = 1; i < this.body.length; i++) {
      const seg = this.body[i];
      ctx.fillStyle = (i % 2 === 0) ? this.alternateColor : shadeColor(this.color, -12);
      ctx.fillRect(seg.x * CELL_SIZE + 1, seg.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }
  }
}
