import { CONFIG } from "../config.js";

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.cellSize = CONFIG.cellSize;
        this.gridCols = CONFIG.gridCols;
        this.gridRows = CONFIG.gridRows;

        canvas.width = this.cellSize * this.gridCols;
        canvas.height = this.cellSize * this.gridRows;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = CONFIG.gridColor;
        ctx.lineWidth = 1;

        for (let x = 0; x <= this.gridCols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.cellSize + 0.5, 0);
            ctx.lineTo(x * this.cellSize + 0.5, this.gridRows * this.cellSize);
            ctx.stroke();
        }

        for (let y = 0; y <= this.gridRows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.cellSize + 0.5);
            ctx.lineTo(this.gridCols * this.cellSize, y * this.cellSize + 0.5);
            ctx.stroke();
        }
    }

    drawCell(pos, color, padding = 0) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            pos.x * this.cellSize + padding,
            pos.y * this.cellSize + padding,
            this.cellSize - padding * 2,
            this.cellSize - padding * 2,
        )
    }

    drawSnake(snake) {
        if (!snake.alive && snake.body.length === 0) return;

        const ctx = this.ctx;
        const head = snake.head;

        this.drawCell(head, snake.color, 0);

        if (snake.armor > 0) {
            ctx.strokeStyle = CONFIG.armorColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(
                head.x * this.cellSize + 2,
                head.y * this.cellSize + 2,
                this.cellSize - 4,
                this.cellSize - 4
            )
        }

        //draw snake body
        for (let i = 0; i < snake.body.length; i++) {
            const seg = snake.body[i];
            const color = (i % 2 === 0) ? snake.alternateColor : snake.color;
            this.drawCell(seg, color, 1);
        }
    }

    drawPickup(pickup) {
        const colors = {
            food: CONFIG.foodColor,
        };
        const color = colors[pickup.type] ?? CONFIG.foodColor;
        this.drawCell(pickup.position, color, 3);

        const ctx = this.ctx;
        const cx = pickup.position.x * this.cellSize + this.cellSize / 2;
        const cy = pickup.position.y * this.cellSize + this.cellSize / 2;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const icons = { food: "♦" };
        ctx.fillText(icons[pickup.type] ?? "?", cx, cy);
    }

    render(gameState) {
        this.clear();
        this.drawGrid();

        for (const pickup of gameState.pickups) {
            this.drawPickup(pickup);
        }

        for (const snake of gameState.snakes) {
            this.drawSnake(snake);
        }
    }
}
