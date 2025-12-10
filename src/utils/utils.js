// Direction vectors
export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export function posEq(a, b) {
  return a.x === b.x && a.y === b.y;
}

export function defaultKeyMap() {
  return {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
    W: "up",
    S: "down",
    A: "left",
    D: "right"
  };
}

export function randomFreePosition(snakes) {
  const occupied = new Set();
  for (const s of snakes) {
    for (const seg of s.body) occupied.add(`${seg.x},${seg.y}`);
  }
  let tries = 0;
  while (tries++ < 10000) {
    const x = Math.floor(Math.random() * 40);
    const y = Math.floor(Math.random() * 30);
    if (!occupied.has(`${x},${y}`)) return { x, y };
  }
  return { x: 0, y: 0 };
}

export function shadeColor(hex, percent) {
  let R = parseInt(hex.substring(1,3),16);
  let G = parseInt(hex.substring(3,5),16);
  let B = parseInt(hex.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = Math.min(255, Math.max(0, R));
  G = Math.min(255, Math.max(0, G));
  B = Math.min(255, Math.max(0, B));

  return "#" + R.toString(16).padStart(2,"0") +
               G.toString(16).padStart(2,"0") +
               B.toString(16).padStart(2,"0");
}
