import { Game } from "./components/Game.js";
import { Renderer } from "./rendering/Renderer.js";
import { InputHandler } from "./utils/InputHandler.js";
import { Vector } from "./utils/Vector.js";

const canvas = document.getElementById("game");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");

const game = new Game({
    onStateChange: updateUI,
    onGameOver: handleGameOver
});

const renderer = new Renderer(canvas);

let localPlayerId = "P1";

const input = new InputHandler(game, localPlayerId);

function updateUI(state) {
    renderer.render(state);

    let text = `Snakes alive: ${state.snakes.filter(s => s.alive).length}. `;
    for (const s of state.snakes) {
        const ammoText = s.ammo > 0 ? ` [${s.ammo}ammo]` : "";
        const armorText = s.armor > 0 ? ` [${s.armor}armor]` : "";
        text += `${s.id}: ${s.score}${ammoText}${armorText}${s.alive ? "" : "(dead)"}  `;
    }
    statusEl.textContent = text;
}

function handleGameOver(state) {
    updateUI(state);
    const span = document.createElement("span");
    span.className = "dead";
    span.textContent = "Game Over";
    statusEl.appendChild(span);
}

function startGame() {
    game.init();

    const player = game.addSnake({
        id: localPlayerId,
        color: "#4caf50",
        alternateColor: "#2e7d32",
        startPos: new Vector(10, 15),
        dir: Vector.RIGHT
    });

    game.spawnPickup("food");
    game.spawnPickup("food");
    game.spawnPickup("ammo");

    input.playerId = player.id;

    input.start();
    game.start();
    updateUI(game.getState());
}

restartBtn.onclick = () => {
    game.stop();
    input.stop();
    startGame();
};

startGame();
