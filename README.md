# Ultra Snake Game

A multiplayer snake game built with vanilla JavaScript featuring real-time WebSocket networking, canvas rendering, and lobby-based matchmaking.  
You can test the game [HERE](https://ollewarne.github.io/snake-game/)

## Features

- Single-player and multiplayer modes
- Real-time multiplayer via WebSocket
- Up to 4 players per session
- Spectator support when lobbies are full
- In-game chat during lobby phase
- Live leaderboard during gameplay
- Respawn system on collision
- Special pickups on grid edges (3x growth)
- Smooth snake rendering with curved bodies

## How to Play

### Controls

Arrow keys or WASD to control your snake.

### Game Modes

**Singleplayer**: Jump straight into a solo game.

**Host Session**: Create a multiplayer lobby. Share the session ID with friends to let them join. Start the game once 2+ players have joined.

**Join Session**: Enter a session ID to join an existing lobby.

### Gameplay

- Collect red food pickups to grow your snake
- Yellow pickups spawn on grid edges and grant 3x growth
- Colliding with walls, yourself, or other snakes triggers a respawn
- The player with the longest snake length at the end of the 90-second timer wins
