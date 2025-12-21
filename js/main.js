import { mpapi } from './services/mpapi.js';
import { SelectionUI } from './ui/SelectionUI.js';
import { GameLobby } from './ui/GameLobby.js';
import { GameScreen } from './ui/GameScreen.js'
import { Game } from './components/Game.js';
import { Renderer } from './rendering/Renderer.js';
import { InputHandler } from './utils/InputHandler.js';
import { CONFIG } from './config.js';
import { defaultKeyMap } from './utils/keymap.js';
import { Vector } from './utils/Vector.js';

const SERVER_URL = 'wss://mpapi.se/net';
const APP_ID = 'ultra-snake-game';
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
let hostClientId = null;
let isHost = false;
let isSpectator = false;

let players = {};
let spectatorQueue = [];
let spawnIndex = 0;

let readyClients = new Set();
let expectedPlayerCount = 0;

const playerColors = CONFIG.playerColors;

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

function getAvailableColorIndex() {
    const usedIndices = new Set();
    for (const clientId in players) {
        const p = players[clientId];
        if (!p.isSpectator && p.colorIndex !== undefined) {
            usedIndices.add(p.colorIndex);
        }
    }

    for (let i = 0; i < playerColors.length; i++) {
        if (!usedIndices.has(i)) {
            return i;
        }
    }

    return nextColorIndex % playerColors.length;
}

function generatePlayerColor() {
    const colorIndex = getAvailableColorIndex();
    const hue = playerColors[colorIndex].hue;

    return {
        colorIndex: colorIndex,
        color: `hsl(${hue}, 70%, 50%)`,
        alternateColor: `hsl(${hue}, 70%, 35%)`
    };
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
            hostClientId = myClientId;
            isSpectator = false;

            const colors = generatePlayerColor();

            players[myClientId] = {
                name: myName,
                playerId: `P${spawnIndex}`,
                isSpectator: false,
                colorIndex: colors.colorIndex,
                color: colors.color,
                alternateColor: colors.alternateColor
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
            const COUNTDOWN_SECONDS = 3;
            api.transmit({ type: 'countdown', seconds: COUNTDOWN_SECONDS })
            lobby.startCountdown(COUNTDOWN_SECONDS, () => {
                api.transmit({ type: 'start' });
                startMultiplayerGame();
            })
        }
    }

    lobby.onSendMessage = (text) => {
        api.transmit({ type: 'chat', name: myName, message: text });
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
            playerNames.push({ name: p.name, color: p.color });
        }
    }

    lobby.setPlayers(playerNames);
    lobby.elements.spectators.textContent = '';
    spectatorNames.forEach(name => lobby.addSpectator(name));
}

function broadcastPlayerList() {
    if (isHost) {
        api.transmit({
            type: 'playerList',
            players: players,
            spectatorQueue: spectatorQueue,
            spawnIndex: spawnIndex,
            hostClientId: myClientId
        });
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
                api.transmit({ type: 'gameState', state: game.getNetworkState() });
            }
        },
        onGameOver: handleMultiplayerGameOver
    });

    renderer = new Renderer(gameScreen.getCanvas());

    game.init();

    let spawnIdx = 0;
    for (const clientId in players) {
        const p = players[clientId];
        if (!p.isSpectator) {
            const spawn = CONFIG.spawnPoints[spawnIdx % CONFIG.spawnPoints.length];

            game.addSnake({
                id: p.playerId,
                startPos: spawn.startPos,
                dir: spawn.dir,
                color: p.color,
                alternateColor: p.alternateColor
            });

            spawnIdx++;
        }
    }

    game.spawnPickup('food');
    game.spawnPickup('food');
    game.spawnPickup('food');

    const myPlayerInfo = players[myClientId];
    if (myPlayerInfo && !myPlayerInfo.isSpectator) {
        isSpectator = false;
        input = new InputHandler(game, myPlayerInfo.playerId);

        input.onInput = (key, playerId) => {
            const snake = game.getSnake(playerId);
            if (!snake) return;

            const newDir = Vector.fromName(defaultKeyMap()[key]);
            if (!newDir) return;

            if (!snake.dir.equals(newDir)) {
                if (isHost) {
                    game.handleKeyPress(key, playerId);
                } else {
                    api.transmit({ type: 'input', key: key, playerId: playerId });
                }
            }
        };
        input.start();
    } else {
        isSpectator = true;
    }

    if (isHost) {
        expectedPlayerCount = Object.values(players).filter(p => !p.isSpectator).length;
        readyClients.add(myClientId);

        api.transmit({ type: 'initialState', state: game.getNetworkState() })

        checkAllReady();
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
            const snake = game.getSnake(playerId);
            if (!snake) return;

            const newDir = Vector.fromName(defaultKeyMap()[key])
            if (!newDir) return;

            if (!snake.dir.equals(newDir)) {
                game.handleKeyPress(key, playerId);

                api.transmit({ type: 'input', key: key, playerId: playerId }, hostClientId);
            }
        };

        input.start();
    } else {
        isSpectator = true;
    }

    api.transmit({ type: 'ready', clientId: myClientId }, hostClientId)

    gameScreen.onRestart(() => {
        cleanup();
        location.reload();
    });
}

function checkAllReady() {
    if (isHost && readyClients.size >= expectedPlayerCount) {
        console.log('everyone ready, start your engines!!!');
        api.transmit({ type: 'gameStart' })
        game.start();
    }
}

function updateGameUI(state) {
    if (!renderer || !gameScreen) {
        return;
    };

    renderer.render(state);

    let tx = api.stats.tx.avgBytesPerSec;
    let rx = api.stats.rx.avgPacketsPerSec;
    gameScreen.setGameInfo(`TX: ${tx} | RX: ${rx} | Time: ${state.timeRemaining}s`);

    const leaderBoardData = state.snakes.map(snake => {
        const playerInfo = findPlayerByPlayerId(snake.id);
        return {
            name: playerInfo ? playerInfo.name : snake.id,
            score: snake.longestLength,
            color: snake.color || playerInfo?.color || '#888',
            isAlive: snake.alive
        }
    })

    gameScreen.updateLeaderboard(leaderBoardData);
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
            hostClientId = data.hostClientId;
            spectatorQueue = data.spectatorQueue || [];

            if (players[myClientId]) {
                isSpectator = players[myClientId].isSpectator;
            }
            updateLobbyDisplay();
            break;
        case 'countdown':
            if (!isHost && lobby) {
                lobby.startCountdown(data.seconds, () => { });
            }
            break;
        case 'start':
            if (!isHost) {
                joinMultiplayerGame();
            }
            break;
        case 'initialState':
            if (!isHost && game) {
                game.applyNetworkState(data.state);
                updateGameUI(game.getState());
            }
            break;
        case 'ready':
            if (isHost) {
                readyClients.add(data.clientId);
                checkAllReady();
            }
            break;
        case 'gameStart':
            break;
        case 'input':
            if (isHost && game) {
                game.handleKeyPress(data.key, data.playerId);
            }
            break;
        case 'gameState':
            if (!isHost && game) {
                game.applyNetworkState(data.state);
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

        const colors = isNewSpectator ? null : generatePlayerColor();

        players[clientId] = {
            name: data.name,
            playerId: isNewSpectator ? null : `P${spawnIndex}`,
            isSpectator: isNewSpectator,
            colorIndex: colors.colorIndex,
            color: colors?.color || null,
            alternateColor: colors?.alternateColor || null
        };

        if (!isNewSpectator) {
            spawnIndex++;
        } else {
            spectatorQueue.push(clientId);
        }
        updateLobbyDisplay();
        broadcastPlayerList();
    }

}

function handlePlayerLeft(clientId) {
    console.log('handlePlayerLeft called:', clientId, players[clientId]);

    if (players[clientId]) {
        const leftPlayer = players[clientId];
        const wasPlayer = !leftPlayer.isSpectator;
        delete players[clientId];

        const queueIndex = spectatorQueue.indexOf(clientId);
        if (queueIndex > -1) {
            spectatorQueue.splice(queueIndex, 1);
        }

        if (game && leftPlayer.playerId) {
            console.log('Removing snake:', leftPlayer.playerId);
            game.removeSnake(leftPlayer.playerId);
        }

        if (wasPlayer && lobby && spectatorQueue.length > 0) {
            const nextSpectator = spectatorQueue[0];
            if (promoteSpectatorToPlayer(nextSpectator)) {
                console.log('promoted spectator to player', players[nextSpectator].name);
            }
        }

        if (lobby) {
            updateLobbyDisplay();
        }

        if (isHost) {
            broadcastPlayerList();
        }
    }
}

function promoteSpectatorToPlayer(spectatorId) {
    const spectator = players[spectatorId];
    if (!spectator || !spectator.isSpectator) return false;
    const colors = generatePlayerColor();

    spectator.isSpectator = false;
    spectator.playerId = `P${spawnIndex}`;
    spectator.colorIndex = colors.colorIndex;
    spectator.color = colors.color;
    spectator.alternateColor = colors.alternateColor;

    spawnIndex++;

    const queueIndex = spectatorQueue.indexOf(spectatorId);
    if (queueIndex > -1) {
        spectatorQueue.splice(queueIndex, 1);
    }
    return true;
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
    nextColorIndex = 0;
    readyClients = new Set();
    expectedPlayerCount = 0;
    hostClientId = null;
}

init();
