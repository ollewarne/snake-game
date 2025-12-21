import { CONFIG } from "../config.js";

export class GameScreen {
    constructor() {
        this.elements = {};
        this.music = new Audio('./assets/gameMusic.mp3')
        this.build();
    }

    build() {
        this.container = document.createElement("div");
        this.container.className = 'game-screen';

        this.elements.wrapper = document.createElement("div");
        this.elements.wrapper.className = 'game-wrapper';

        this.elements.main = document.createElement("div");
        this.elements.main.className = 'game-main';

        this.elements.canvas = document.createElement("canvas");
        this.elements.canvas.className = 'game-canvas';
        this.elements.canvas.width = CONFIG.cellSize * CONFIG.gridCols;
        this.elements.canvas.height = CONFIG.cellSize * CONFIG.gridRows;
        this.elements.main.appendChild(this.elements.canvas);

        this.elements.bottomBar = document.createElement("div");
        this.elements.bottomBar.className = 'game-bottom-bar';

        this.elements.gameInfo = document.createElement("div");
        this.elements.gameInfo.className = 'game-info';
        this.elements.bottomBar.appendChild(this.elements.gameInfo);

        this.elements.controls = document.createElement("div");
        this.elements.controls.className = 'game-controls';
        this.elements.controls.textContent = 'Use WASD or Arrow Keys to move';
        this.elements.bottomBar.appendChild(this.elements.controls);

        this.elements.main.appendChild(this.elements.bottomBar);

        this.elements.wrapper.appendChild(this.elements.main);

        this.elements.leaderboard = document.createElement("div");
        this.elements.leaderboard.className = 'leaderboard';

        const leaderboardTitle = document.createElement("div");
        leaderboardTitle.className = 'leaderboard-title';
        leaderboardTitle.textContent = 'LEADERBOARD';
        this.elements.leaderboard.appendChild(leaderboardTitle);

        this.elements.leaderboardList = document.createElement("div");
        this.elements.leaderboardList.className = 'leaderboard-list';
        this.elements.leaderboard.appendChild(this.elements.leaderboardList);

        this.elements.wrapper.appendChild(this.elements.leaderboard);

        this.container.appendChild(this.elements.wrapper);

        this.elements.restartBtn = document.createElement("button");
        this.elements.restartBtn.className = 'lobby-btn';
        this.elements.restartBtn.textContent = 'Back to Menu';
        this.elements.restartBtn.style.display = 'none';
        this.container.appendChild(this.elements.restartBtn);

        this.updateScale();
        window.addEventListener('resize', () => this.updateScale());

        document.body.appendChild(this.container);

        this.music.volume = 0.05;
        this.music.play();
    }

    getCanvas() {
        return this.elements.canvas;
    }

    updateScale() {
        const canvas = this.elements.canvas;
        const baseWidth = CONFIG.cellSize * CONFIG.gridCols;
        const baseHeight = CONFIG.cellSize * CONFIG.gridRows;
        const leaderboardWidth = 180 + 16; // width + gap
        const padding = 64;

        const availableWidth = window.innerWidth - leaderboardWidth - padding;
        const availableHeight = window.innerHeight - 150;

        const scaleX = availableWidth / baseWidth;
        const scaleY = availableHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        canvas.style.width = (baseWidth * scale) + 'px';
        canvas.style.height = (baseHeight * scale) + 'px';
    }

    setGameInfo(text) {
        this.elements.gameInfo.textContent = text;
    }

    updateLeaderboard(players) {
        const sorted = [...players].sort((a, b) => b.score - a.score);

        sorted.forEach((player, index) => {
            let entry = this.elements.leaderboardList.querySelector(
                `[data-player-id="${player.id}"]`
            );

            if (!entry) {
                entry = this.createLeaderboardEntry(player);
                this.elements.leaderboardList.appendChild(entry);
            }

            entry.querySelector('.leaderboard-rank').textContent = `${index + 1}.`;
            entry.querySelector('.leaderboard-score').textContent = player.score;
            entry.style.order = index;
            entry.classList.toggle('leader', index === 0 && sorted.length > 1);
            entry.classList.toggle('dead', !player.isAlive);
        });

        const currentIds = new Set(players.map(p => p.id));
        const entries = this.elements.leaderboardList.querySelectorAll('.leaderboard-entry');
        entries.forEach(entry => {
            if (!currentIds.has(entry.dataset.playerId)) {
                entry.remove();
            }
        });
    }

    createLeaderboardEntry(player) {
        const entry = document.createElement('div');
        entry.className = 'leaderboard-entry';
        entry.dataset.playerId = player.id;

        const rank = document.createElement('span');
        rank.className = 'leaderboard-rank';
        entry.appendChild(rank);

        const colorDot = document.createElement('span');
        colorDot.className = 'leaderboard-color';
        colorDot.style.backgroundColor = player.color;
        entry.appendChild(colorDot);

        const name = document.createElement('span');
        name.className = 'leaderboard-name';
        name.textContent = player.name;
        entry.appendChild(name);

        const score = document.createElement('span');
        score.className = 'leaderboard-score';
        entry.appendChild(score);

        return entry;
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
