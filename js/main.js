import { mpapi } from './services/mpapi.js';
import { SelectionUI } from './ui/SelectionUI.js';
import { GameLobby } from './ui/GameLobby.js';
import { GameScreen } from './ui/GameScreen.js'
import { Game } from './components/Game.js';
import { Renderer } from './rendering/Renderer.js';
import { InputHandler } from './utils/InputHandler.js';
import { CONFIG } from './config.js';

const SERVER_URL = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/net`;
const APP_ID = 'snake-game-it-up-yo';
const MAX_PLAYERS = CONFIG.playerLimit || 4;

let api = null;
let ui = null;
let lobby = null;
let gameScreen = null;
let game = null;
let renderer = null;
let input = null;

let myName = '';
let myClientId = '';
let isHost = false;
let isSpectator = false;

let players = {};
let spawnIndex = 0;

function init() {
    api = new mpapi(SERVER_URL, APP_ID);
    setupApiListener();
    setupBeforeUnload();
    showSelectionUi();
}

function setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
        if (api && api.sessionId) {
            api.leave();
        }
    });
}

function showSelectionUi() {
    ui = new SelectionUI();

    ui.singlePlayerBtn.addEventListener('click', () => {
        ui.remove();
        ui = null;
        startSinglePlayer();
    });

    ui.hostBtn.addEventListener('click', async () => {
        myName = ui.getName();
        if (!myName) return;

        try {
            const response = await api.host({ name: myName });

            myClientId = response.clientId;
            isHost = true;
            isSpectator = false;

            players[myClientId] = {
                name: myName,
                playerId: `P${spawnIndex}`,
                isSpectator: false
            };
            spawnIndex++;

            ui.remove();
            ui = null;
            showLobby(response.session, myName);
        } catch (err) {
            console.error('error hosting lobby:', err);
        }
    });

    ui.joinBtn.addEventListener('click', async () => {
        myName = ui.getName();
        const sessionId = ui.getSessionId();
        if (!myName || !sessionId) return;

        try {
            const response = await api.join(sessionId, { name: myName });

            myClientId = response.clientId;
            isHost = false;

            ui.remove();
            ui = null;
            showLobby(response.session, response.name);
        } catch (err) {
            console.error('error while joining', err);
        }
    })
}

function showLobby(session, hostName) {
    lobby = new GameLobby(session, hostName, isHost);

    lobby.onLeave = () => {
        api.leave();
        cleanup();
        location.reload();
    };

    lobby.onStart = () => {
        if (isHost) {
            api.transmit({ type: 'start' });
            startMultiplayerGame();
        }
    }

    lobby.onSendMessage = (text) => {
        api.transmit({ type: 'chat', name: myName, message: text });
        lobby.addChatMessage(myName, text);
    }

    if (isHost) {
        updateLobbyDisplay();
    }
}

function updateLobbyDisplay() {
    if (!lobby) return;

    const playerNames = [];
    const spectatorNames = [];

    for (const clientId in players) {
        const p = players[clientId];
        if (p.isSpectator) {
            spectatorNames.push(p.name);
        } else {
            playerNames.push(p.name);
        }
    }

    lobby.setPlayers(playerNames);
    lobby.elements.spectators.textContent = '';
    spectatorNames.forEach(name => lobby.addSpectator(name));
}

function broadcastPlayerList() {
    if (isHost) {
        api.transmit({ type: 'playerList', players: players });
    }
}

function startSinglePlayer() {
    gameScreen = new GameScreen();

    game = new Game({
        onStateChange: updateGameUI,
        onGameOver: handleGameOver
    })

    renderer = new Renderer(gameScreen.getCanvas());

    game.init();

    const spawn = CONFIG.spawnPoints[0];
    const player = game.addSnake({
        id: 'P1',
        startPos: spawn.startPos,
        dir: spawn.dir
    })

    game.spawnPickup('food');
    game.spawnPickup('food');
    game.spawnPickup('food');

    input = new InputHandler(game, player.id);
    input.start();

    game.start();
    updateGameUI(game.getState());

    gameScreen.onRestart(() => {
        cleanup();
        showSelectionUi();
    });
}

function startMultiplayerGame() {
    if (lobby) {
        lobby.remove();
        lobby = null;
    }

    gameScreen = new GameScreen();

    game = new Game({
        onStateChange: (state) => {
            updateGameUI(state);
            if (isHost) {
                api.transmit({ type: 'gameState', state: game.getFullState() });
            }
        },
        onGameOver: handleMultiplayerGameOver
    });

    renderer = new Renderer(gameScreen.getCanvas());

    game.init();

    for (const clientId in players) {
        const p = players[clientId];
        if (!p.isSpectator) {
            const spawnIdx = parseInt(p.playerId.replace('P', ''));
            const spawn = CONFIG.spawnPoints[spawnIdx % CONFIG.spawnPoints.length];

            game.addSnake({
                id: p.playerId,
                startPos: spawn.startPos,
                dir: spawn.dir
            })
        }
    }

    game.spawnPickup('food');
    game.spawnPickup('food');
    game.spawnPickup('food');

    const myPlayerInfo = players[myClientId];
    if (myPlayerInfo && !myPlayerInfo.isSpectator) {
        isSpectator = false;
        input = new InputHandler(game, myPlayerInfo.playerId);

        if (isHost) {
            input.onInput = (key, playerId) => {
                game.handleKeyPress(key, playerId);
            }
        } else {
            input.onInput = (key, playerId) => {
                api.transmit({ type: 'input', key: key, playerId: playerId });
            }
        }
        input.start();
    } else {
        isSpectator = true;
    }

    if (isHost) {
        game.start();
    }

    updateGameUI(game.getState());

    gameScreen.onRestart(() => {
        cleanup();
        location.reload();
    });
}

function joinMultiplayerGame() {
    if (lobby) {
        lobby.remove();
        lobby = null;
    }

    gameScreen = new GameScreen();

    game = new Game({
        onStateChange: updateGameUI,
        onGameOver: handleMultiplayerGameOver
    });

    renderer = new Renderer(gameScreen.getCanvas());

    game.init();

    const myPlayerInfo = players[myClientId];
    if (myPlayerInfo && !myPlayerInfo.isSpectator) {
        isSpectator = false;
        input = new InputHandler(game, myPlayerInfo.playerId);
        input.onInput = (key, playerId) => {
            api.transmit({ type: 'input', key: key, playerId: playerId });
        };

        input.start();
    } else {
        isSpectator = true;
    }

    gameScreen.onRestart(() => {
        cleanup();
        location.reload();
    });
}

function updateGameUI(state) {
    if (!renderer || !gameScreen) {
        return;
    };

    renderer.render(state);

    let statusText = `Time: ${state.timeRemaining}s`;
    for (const snake of state.snakes) {
        const playerInfo = findPlayerByPlayerId(snake.id);
        const name = playerInfo ? playerInfo.name : snake.id;
        statusText += ` | ${name}: ${snake.longestLength}`;
    }

    gameScreen.setStatus(statusText);
}

function handleGameOver(state) {
    updateGameUI(state);
    const winner = game.getWinner();
    gameScreen.showGameOver(winner ? winner.id : null);
}

function handleMultiplayerGameOver(state) {
    updateGameUI(state);
    const winner = game.getWinner();
    const playerInfo = winner ? findPlayerByPlayerId(winner.id) : null;
    const winnerName = playerInfo ? playerInfo.name : (winner ? winner.id : null);
    gameScreen.showGameOver(winnerName);

    if (isHost) {
        api.transmit({ type: 'gameOver', winnerId: winner?.id, winnerName: winnerName })
    }
}

function findPlayerByPlayerId(playerId) {
    for (const clientId in players) {
        if (players[clientId].playerId === playerId) {
            return players[clientId];
        }
    }
    return null;
}

function setupApiListener() {
    api.listen((cmd, messageId, clientId, data) => {
        console.log('API event:', cmd, clientId);
        switch (cmd) {
            case 'game':
                handleGameMessage(clientId, data);
                break;
            case 'joined':
                handlePlayerJoined(clientId, data);
                break;
            case 'left':
                handlePlayerLeft(clientId);
                break;
            case 'closed':
                if (clientId && clientId !== myClientId) {
                    console.log('Client disconnected:', clientId);
                    handlePlayerLeft(clientId);
                } else {
                    console.log('Session closed');
                    cleanup();
                    location.reload();
                }
        }
    })
}

function handleGameMessage(clientId, data) {
    switch (data.type) {
        case 'chat':
            if (lobby) {
                lobby.addChatMessage(data.name, data.message);
            }
            break;
        case 'playerList':
            players = data.players;
            spawnIndex = data.spawnIndex;

            if (players[myClientId]) {
                isSpectator = players[myClientId].isSpectator;
            }
            updateLobbyDisplay();
            break;
        case 'start':
            if (!isHost) {
                joinMultiplayerGame();
            }
            break;
        case 'input':
            if (isHost && game) {
                game.handleKeyPress(data.key, data.playerId);
            }
            break;
        case 'gameState':
            if (!isHost && game) {
                game.applyState(data.state);
                updateGameUI(game.getState());
            }
            break;
        case 'gameOver':
            if (!isHost && gameScreen) {
                gameScreen.showGameOver(data.winnerName);
            }
            break;

    }
}

function handlePlayerJoined(clientId, data) {

    if (isHost && data.name) {
        const currentPlayerCount = Object.values(players).filter(p => !p.isSpectator).length;
        const isNewSpectator = currentPlayerCount >= MAX_PLAYERS;

        players[clientId] = {
            name: data.name,
            playerId: isNewSpectator ? null : `P${spawnIndex}`,
            isSpectator: isNewSpectator
        };

        if (!isNewSpectator) {
            spawnIndex++;
        }
        updateLobbyDisplay();
        broadcastPlayerList();
    }

}

function handlePlayerLeft(clientId) {
    console.log('handlePlayerLeft called:', clientId, players[clientId]);

    if (players[clientId]) {
        const leftPlayer = players[clientId];
        delete players[clientId];

        if (game && leftPlayer.playerId) {
            console.log('Removing snake:', leftPlayer.playerId);
            game.removeSnake(leftPlayer.playerId);
        }

        if (lobby) {
            updateLobbyDisplay();
        }

        if (isHost) {
            broadcastPlayerList();
        }
    }
}

function cleanup() {
    if (input) {
        input.stop();
        input = null;
    }

    if (game) {
        game.stop();
        game = null;
    }

    if (renderer) {
        renderer = null;
    }

    if (gameScreen) {
        gameScreen.remove();
        gameScreen = null;
    }

    if (lobby) {
        lobby.remove();
        lobby = null;
    }

    if (ui) {
        ui.remove();
        ui = null;
    }

    players = {};
    spawnIndex = 0;
    isHost = false;
    isSpectator = false;
}

init();
