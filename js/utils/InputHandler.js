export class InputHandler {
    constructor(game, playerId = null) {
        this.game = game;
        this.playerId = playerId;
        this.onInput = null;
        this.boundKeyDown = this.handleKeyDown.bind(this);
    }

    start() {
        window.addEventListener("keydown", this.boundKeyDown);
    }

    stop() {
        window.removeEventListener("keydown", this.boundKeyDown);
    }

    handleKeyDown(event) {
        const key = event.key;

        //movement
        if (this.game.isValidInput(key, this.playerId)) {
            event.preventDefault();

            if (this.onInput) {
                this.onInput(key, this.playerId);
            } else {
                this.game.handleKeyPress(key, this.playerId);
            }
        }
    }
}
