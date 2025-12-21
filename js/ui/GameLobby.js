export class GameLobby {
    constructor(session, host, isHost = false) {
        this.session = session;
        this.host = host;
        this.isHost = isHost;
        this.playerCount = 0;
        this.elements = {};
        this.onStart = null;
        this.onLeave = null;
        this.onSendMessage = null;
        this.music = new Audio('./assets/lobbyMusic.mp3')
        this.build();
    }

    build() {
        // Header
        const header = document.createElement('div');
        header.className = 'lobby-header';

        const info = document.createElement('div');
        info.className = 'lobby-info';

        const sessionDiv = document.createElement('div');
        sessionDiv.textContent = `Session: ${this.session}`;
        info.appendChild(sessionDiv);

        const hostDiv = document.createElement('div');
        hostDiv.textContent = `Host: ${this.host}`;
        info.appendChild(hostDiv);

        header.appendChild(info);

        const actions = document.createElement('div');
        actions.className = 'lobby-actions';

        if (this.isHost) {
            this.elements.startBtn = document.createElement('button');
            this.elements.startBtn.className = 'lobby-btn';
            this.elements.startBtn.textContent = 'Start Game';
            this.elements.startBtn.disabled = true;
            this.elements.startBtn.addEventListener('click', () => {
                if (this.onStart && this.playerCount >= 2) this.onStart();
            });
            actions.appendChild(this.elements.startBtn);
        }

        this.elements.leaveBtn = document.createElement('button');
        this.elements.leaveBtn.className = 'lobby-btn btn-secondary';
        this.elements.leaveBtn.textContent = 'Leave Lobby';
        this.elements.leaveBtn.addEventListener('click', () => {
            if (this.onLeave) this.onLeave();
        });
        actions.appendChild(this.elements.leaveBtn);

        this.elements.countdown = document.createElement('div');
        this.elements.countdown.className = 'lobby-countdown';
        this.elements.countdown.style.display = 'none';
        this.elements.countdown.textContent = "";
        actions.appendChild(this.elements.countdown);

        header.appendChild(actions);
        document.body.appendChild(header);

        // Main container
        const container = document.createElement('div');
        container.className = 'lobby-container';

        // Top row (players + spectators)
        const topRow = document.createElement('div');
        topRow.className = 'lobby-top';

        // Players section
        const playersSection = document.createElement('div');
        playersSection.className = 'lobby-section';

        const playersTitle = document.createElement('h3');
        playersTitle.textContent = 'Players';
        playersSection.appendChild(playersTitle);

        this.elements.players = document.createElement('ul');
        this.elements.players.className = 'lobby-list';
        playersSection.appendChild(this.elements.players);

        topRow.appendChild(playersSection);

        // Spectators section
        const spectatorsSection = document.createElement('div');
        spectatorsSection.className = 'lobby-section';

        const spectatorsTitle = document.createElement('h3');
        spectatorsTitle.textContent = 'Spectators';
        spectatorsSection.appendChild(spectatorsTitle);

        this.elements.spectators = document.createElement('ul');
        this.elements.spectators.className = 'lobby-list';
        spectatorsSection.appendChild(this.elements.spectators);

        topRow.appendChild(spectatorsSection);
        container.appendChild(topRow);

        // Chat section
        const chatSection = document.createElement('div');
        chatSection.className = 'lobby-section chat-section';

        const chatTitle = document.createElement('h3');
        chatTitle.textContent = 'Chat';
        chatSection.appendChild(chatTitle);

        this.elements.chat = document.createElement('div');
        this.elements.chat.className = 'chat-messages';
        chatSection.appendChild(this.elements.chat);

        const inputRow = document.createElement('div');
        inputRow.className = 'chat-input-row';

        this.elements.chatInput = document.createElement('input');
        this.elements.chatInput.className = 'chat-input';
        this.elements.chatInput.placeholder = 'Type a message...';
        this.elements.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        inputRow.appendChild(this.elements.chatInput);

        this.elements.sendBtn = document.createElement('button');
        this.elements.sendBtn.className = 'lobby-btn';
        this.elements.sendBtn.textContent = 'Send';
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        inputRow.appendChild(this.elements.sendBtn);

        chatSection.appendChild(inputRow);
        container.appendChild(chatSection);

        // Meta info
        this.elements.meta = document.createElement('div');
        this.elements.meta.className = 'lobby-meta';
        container.appendChild(this.elements.meta);

        document.body.appendChild(container);

        this.headerEl = header;
        this.containerEl = container;

        // Audio

        this.music.loop = true;
        this.music.volume = 0.05;
        this.music.play();
    }

    updateStartButton() {
        if (this.isHost && this.elements.startBtn) {
            this.elements.startBtn.disabled = this.playerCount < 2;
        }
    }

    sendMessage() {
        const text = this.elements.chatInput.value.trim();
        if (text && this.onSendMessage) {
            this.onSendMessage(text);
            this.elements.chatInput.value = '';
        }
    }

    setPlayers(players) {
        this.elements.players.textContent = '';
        this.playerCount = players.length;
        players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name;
            li.dataset.name = player.name;
            if (player.color) {
                li.style.borderLeftColor = player.color;
            }
            this.elements.players.appendChild(li);
        });
        this.updateStartButton();
    }

    addPlayer(name) {
        const li = document.createElement('li');
        li.textContent = name;
        li.dataset.name = name;
        this.elements.players.appendChild(li);
        this.playerCount++;
        this.updateStartButton();
    }

    addSpectator(name) {
        const li = document.createElement('li');
        li.textContent = name;
        li.dataset.name = name;
        this.elements.spectators.appendChild(li);
    }

    addChatMessage(sender, message) {
        const msg = document.createElement('div');
        const bold = document.createElement('strong');
        bold.textContent = `${sender}: `;
        msg.appendChild(bold);
        msg.appendChild(document.createTextNode(message));
        this.elements.chat.appendChild(msg);
        this.elements.chat.scrollTop = this.elements.chat.scrollHeight;
    }

    startCountdown(seconds, onComplete) {
        let remaining = seconds;

        if (this.elements.startBtn) {
            this.elements.startBtn.style.display = 'none';
        }

        this.elements.countdown.style.display = 'block';
        this.elements.countdown.textContent = `Game starting in ${remaining}...`;

        const interval = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                this.elements.countdown.textContent = `Game starting in ${remaining}...`;
            } else {
                this.elements.countdown.textContent = "Game starting now!";
                clearInterval(interval);
                setTimeout(() => {
                    if (onComplete && typeof onComplete === 'function') onComplete();
                }, 500)
            }
        }, 1000)
        return interval;
    }

    remove() {
        this.headerEl.remove();
        this.containerEl.remove();
        this.music.pause();
    }
}
