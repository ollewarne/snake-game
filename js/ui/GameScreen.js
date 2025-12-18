import { CONFIG } from "../config.js";

export class GameScreen {
    constructor() {
        this.elements = {};
        this.music = new Audio('../../assets/gameMusic.mp3')
        this.build();
    }

    build() {
        this.container = document.createElement("div");
        this.container.className = 'game-screen';

        this.elements.status = document.createElement("div");
        this.elements.status.className = 'game-status';
        this.container.appendChild(this.elements.status);

        this.elements.canvas = document.createElement("canvas");
        this.elements.canvas.className = 'game-canvas';
        this.elements.canvas.width = CONFIG.cellSize * CONFIG.gridCols;
        this.elements.canvas.height = CONFIG.cellSize * CONFIG.gridRows;
        this.container.appendChild(this.elements.canvas);

        this.elements.restartBtn = document.createElement("button");
        this.elements.restartBtn.className = 'lobby-btn';
        this.elements.restartBtn.textContent = 'Back to Menu';
        this.elements.restartBtn.style.display = 'none';
        this.container.appendChild(this.elements.restartBtn);

        document.body.appendChild(this.container);

        this.music.volume = 0.1;
        this.music.play();
    }

    getCanvas() {
        return this.elements.canvas;
    }

    setStatus(text) {
        this.elements.status.textContent = text;
    }

    setStatusParts(parts) {
        this.elements.status.textContent = '';

        parts.forEach((part, index) => {
            if (index > 0) {
                const separator = document.createElement('span');
                separator.textContent = ' | ';
                this.elements.status.appendChild(separator);
            }

            const span = document.createElement('span');
            span.textContent = part.text;
            if (part.color) {
                span.className = 'player-score';
                span.style.borderLeftColor = part.color;
            }
            this.elements.status.appendChild(span);
        });
    }

    showGameOver(winner) {
        const gameOverEl = document.createElement("div");
        gameOverEl.className = 'game-over-overlay';

        const text = document.createElement("h2");
        text.textContent = winner ? `Winner: ${winner}` : 'Game Over!';
        gameOverEl.appendChild(text);

        this.container.appendChild(gameOverEl);
        this.elements.restartBtn.style.display = 'block';
    }

    onRestart(callback) {
        this.elements.restartBtn.addEventListener("click", callback);
    }

    remove() {
        this.container.remove();
        this.music.pause();
    }
}
