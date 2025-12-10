import { Snake } from "./Snake.js";
import { randomFreePosition, posEq, DIRS } from "../utils/utils.js";

// Exported constants for use in Snake.js
export const CELL_SIZE = 20;
export const GRID_COLS = 60;
export const GRID_ROWS = 50;
export const TICK_MS = 100;
export const INITIAL_LENGTH = 2;
export const GROW_ON_FOOD = 1;

export let snakes = [];
let food = null;
let tickTimer = null;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");

canvas.width = CELL_SIZE * GRID_COLS;
canvas.height = CELL_SIZE * GRID_ROWS;

export function initGame() {
  snakes.length = 0;

  const s1 = new Snake({
    id: "P1",
    color: "#4caf50",
    alternateColor: "#2e7d32",
    startPos: { x: 10, y: 15 },
    dir: DIRS.right
  });

  snakes.push(s1);

  food = randomFreePosition(snakes);

  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(tick, TICK_MS);

  render();
}

restartBtn.onclick = initGame;

function tick() {
  if (!snakes.some(s => s.alive)) {
    render();
    return;
  }

  const ate = new Set();

  for (const s of snakes) {
    if (!s.alive) continue;
    const newHead = s.move();

    s.checkBorderDeath(GRID_COLS, GRID_ROWS);

    if (s.alive && posEq(newHead, food)) {
      s.grow(GROW_ON_FOOD);
      ate.add(s.id);
    }
  }

  for (const s of snakes) {
    if (!s.alive) continue;
    s.checkSelfCollision();
  }

  for (let i = 0; i < snakes.length; i++) {
    const s = snakes[i];
    if (!s.alive) continue;
    for (let j = 0; j < snakes.length; j++) {
      if (i === j) continue;
      const o = snakes[j];
      if (s.checkCollisionWithOther(o)) break;
    }
  }

  const heads = {};
  for (const s of snakes) {
    if (!s.alive) continue;
    const h = s.body[0];
    const k = `${h.x},${h.y}`;
    if (!heads[k]) heads[k] = [];
    heads[k].push(s);
  }

  for (const k in heads) {
    if (heads[k].length > 1) {
      for (const s of heads[k]) s.alive = false;
    }
  }

  if (ate.size > 0) {
    food = randomFreePosition(snakes);
  }

  render();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw grid
  ctx.strokeStyle = "#071218";
  ctx.lineWidth = 1;
  for (let x = 0; x <= GRID_COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE + 0.5, 0);
    ctx.lineTo(x * CELL_SIZE + 0.5, GRID_ROWS * CELL_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE + 0.5);
    ctx.lineTo(GRID_COLS * CELL_SIZE, y * CELL_SIZE + 0.5);
    ctx.stroke();
  }

  // draw food
  ctx.fillStyle = "#ffeb3b";
  ctx.fillRect(food.x * CELL_SIZE + 3, food.y * CELL_SIZE + 3, CELL_SIZE - 6, CELL_SIZE - 6);

  for (const s of snakes) s.draw(ctx);

  let t = `Snakes alive: ${snakes.filter(s => s.alive).length}. `;
  for (const s of snakes) t += `${s.id}: ${s.score}${s.alive ? "" : " (dead)"}  `;
  statusEl.innerHTML = t;

  if (snakes.every(s => !s.alive)) {
    statusEl.innerHTML += `<span class="dead"> Game Over</span>`;
  }
}
