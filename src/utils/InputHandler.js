export class InputHandler {
    constructor(game, playerId = null) {
        this.game = game;
        this.playerId = playerId;
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.fireKey = " ";
    }

    start() {
        window.addEventListener("keydown", this.boundKeyDown);
    }

    stop() {
        window.removeEventListener("keydown", this.boundKeyDown);
    }

    handleKeyDown(event) {
        const key = event.key;

        //fire projectile
        if (key === this.fireKey) {
            if (this.game.handleAction("fire", this.playerId)) {
                event.preventDefault();
            }
            return;
        }

        //movement
        if (this.game.handleKeyPress(key, this.playerId)) {
            event.preventDefault();
        }
    }
}
