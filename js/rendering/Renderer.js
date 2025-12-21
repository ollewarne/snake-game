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

        this.scale = 1;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;

        for (let x = 0; x <= this.gridCols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.cellSize, 0);
            ctx.lineTo(x * this.cellSize, this.gridRows * this.cellSize);
            ctx.stroke();
        }

        for (let y = 0; y <= this.gridRows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.cellSize);
            ctx.lineTo(this.gridCols * this.cellSize, y * this.cellSize);
            ctx.stroke();
        }
    }

    getCellCenter(pos) {
        return {
            x: pos.x * this.cellSize + this.cellSize / 2,
            y: pos.y * this.cellSize + this.cellSize / 2
        };
    }

    drawSnake(snake) {
        if (!snake.alive || snake.respawning || !snake.body || snake.body.length < 2) return;

        const points = snake.body.map(seg => this.getCellCenter(seg));
        const thickness = this.cellSize * 0.65;
        const ctx = this.ctx;

        ctx.lineCap = 'butt';
        ctx.lineJoin = 'round';

        ctx.strokeStyle = snake.color;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            const midX = (curr.x + next.x) / 2;
            const midY = (curr.y + next.y) / 2;
            ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
        }

        const last = points[points.length - 1];
        const secondLast = points[points.length - 2];
        ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
        ctx.stroke();

        this.drawTail(points[points.length - 1], points[points.length - 2], snake.color);
        this.drawHead(points[0], points[1], snake.color);
    }

    drawHead(head, next, color) {
        const ctx = this.ctx;
        const angle = Math.atan2(head.y - next.y, head.x - next.x);
        const headSize = this.cellSize * 0.5;

        ctx.save();
        ctx.translate(head.x, head.y);
        ctx.rotate(angle);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(headSize * 0.3, 0, headSize * 0.95, headSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        const eyeOffset = headSize * 0.25;
        const eyeForward = headSize * 0.4;
        const eyeRadius = this.cellSize * 0.09;
        const pupilRadius = this.cellSize * 0.045;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(eyeForward, -eyeOffset, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeForward, eyeOffset, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(eyeForward + pupilRadius * 0.5, -eyeOffset, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeForward + pupilRadius * 0.5, eyeOffset, pupilRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawTail(tail, prev, color) {
        const ctx = this.ctx;
        const angle = Math.atan2(tail.y - prev.y, tail.x - prev.x);
        const tailLength = this.cellSize * 0.5;
        const baseWidth = this.cellSize * 0.325;

        ctx.save();
        ctx.translate(tail.x, tail.y);
        ctx.rotate(angle);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-tailLength * 0.2, -baseWidth);
        ctx.lineTo(tailLength, 0);
        ctx.lineTo(-tailLength * 0.2, baseWidth);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }


    drawPickup(pickup) {
        const ctx = this.ctx;
        const center = this.getCellCenter(pickup.position);
        const isSpecial = pickup.type === 'special';
        const radius = isSpecial ? this.cellSize * 0.45 : this.cellSize * 0.35;

        let colorLight, colorMid, colorDark;
        if (isSpecial) {
            colorLight = '#ffee66';
            colorMid = '#ddaa22';
            colorDark = '#aa7711';
        } else {
            colorLight = '#ff6666';
            colorMid = '#cc2222';
            colorDark = '#991111';
        }

        const gradient = ctx.createRadialGradient(
            center.x - radius * 0.3,
            center.y - radius * 0.3,
            0,
            center.x,
            center.y,
            radius
        );
        gradient.addColorStop(0, colorLight);
        gradient.addColorStop(0.6, colorMid);
        gradient.addColorStop(1, colorDark);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(
            center.x - radius * 0.3,
            center.y - radius * 0.3,
            radius * 0.25,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    setScale(scale) {
        this.scale = scale;
        this.canvas.style.width = (this.canvas.width * scale) + 'px';
        this.canvas.style.height = (this.canvas.height * scale) + 'px';
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
