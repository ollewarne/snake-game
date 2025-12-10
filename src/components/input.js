import { snakes } from "./game.js";

export function setupInput() {
  window.addEventListener("keydown", e => {
    const k = e.key;

    let used = false;
    for (const s of snakes) {
      if (s.alive && s.keyMap[k]) {
        s.setDirectionFromName(s.keyMap[k]);
        used = true;
      }
    }
    if (used) e.preventDefault();
  });
}
