export class SelectionUI {
    constructor() {
        this.container = document.createElement("div");
        this.container.className = "selection-container";

        const title = document.createElement("h1");
        title.textContent = "Select Mode";
        this.container.appendChild(title);

        const nameLabel = document.createElement("label");
        nameLabel.textContent = "Name";
        nameLabel.setAttribute("for", "nameInput");
        this.container.appendChild(nameLabel);

        this.nameInput = document.createElement("input");
        this.nameInput.id = "nameInput";
        this.nameInput.placeholder = "Enter name";
        this.container.appendChild(this.nameInput);

        const sessionLabel = document.createElement("label");
        sessionLabel.textContent = "Session ID";
        sessionLabel.setAttribute("for", "sessionIdInput");
        this.container.appendChild(sessionLabel);

        this.sessionIdInput = document.createElement("input");
        this.sessionIdInput.id = "sessionIdInput";
        this.sessionIdInput.placeholder = "Enter session ID";
        this.container.appendChild(this.sessionIdInput);

        this.singlePlayerBtn = document.createElement("button");
        this.singlePlayerBtn.textContent = "Singleplayer";
        this.container.appendChild(this.singlePlayerBtn);

        const divider = document.createElement("hr");
        divider.className = "selection-divider";
        this.container.appendChild(divider);

        this.hostBtn = document.createElement("button");
        this.hostBtn.textContent = "Host Session";
        this.hostBtn.className = "btn-secondary";
        this.container.appendChild(this.hostBtn);

        this.joinBtn = document.createElement("button");
        this.joinBtn.textContent = "Join Session";
        this.joinBtn.className = "btn-secondary";
        this.container.appendChild(this.joinBtn);

        document.body.appendChild(this.container);
    }

    getName() {
        return this.nameInput.value.trim();
    }

    getSessionId() {
        return this.sessionIdInput.value.trim();
    }

    remove() {
        this.container.remove();
    }
}
