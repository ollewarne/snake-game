export class SelectionUI {
    constructor() {
        this.wrapper = document.createElement("div");
        this.wrapper.className = "selection-wrapper";

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

        this.wrapper.appendChild(this.container);

        const guide = document.createElement("div");
        guide.className = "selection-guide";

        const guideTitle = document.createElement("h2");
        guideTitle.textContent = "How to Play";
        guide.appendChild(guideTitle);

        const sections = [
            { title: "Controls", text: "Use Arrow Keys or WASD to move your snake." },
            { title: "Objective", text: "Eat food to grow. The longest snake at the end of 90 seconds wins." },
            { title: "Pickups", text: "Red = +1 length. Yellow (on edges) = +3 length." },
            { title: "Collisions", text: "Hitting walls, yourself, or others causes a respawn. Head on collision kills both snakes." },
            {
                title: "Multiplayer", lines: [
                    { bold: "Host:", text: " Enter a name and click \"Host Session\". Share the session ID with friends." },
                    { bold: "Join:", text: " Enter a name and the session ID, then click \"Join Session\"." },
                    { text: "Games start when the host clicks \"Start Game\" with 2+ players." }
                ]
            }
        ];

        sections.forEach(section => {
            const h3 = document.createElement("h3");
            h3.textContent = section.title;
            guide.appendChild(h3);

            if (section.text) {
                const p = document.createElement("p");
                p.textContent = section.text;
                guide.appendChild(p);
            }

            if (section.lines) {
                section.lines.forEach(line => {
                    const p = document.createElement("p");
                    if (line.bold) {
                        const strong = document.createElement("strong");
                        strong.textContent = line.bold;
                        p.appendChild(strong);
                        p.appendChild(document.createTextNode(line.text));
                    } else {
                        p.textContent = line.text;
                    }
                    guide.appendChild(p);
                });
            }
        });

        this.wrapper.appendChild(guide);

        document.body.appendChild(this.wrapper);
    }

    getName() {
        return this.nameInput.value.trim();
    }

    getSessionId() {
        return this.sessionIdInput.value.trim();
    }

    remove() {
        this.wrapper.remove();
    }
}
