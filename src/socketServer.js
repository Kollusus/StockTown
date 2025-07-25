// src/socketServer.js
const { Server } = require("socket.io");
const tmx = require("tmx-parser");

const SPEED = 5;
const TICK_RATE = 30;
const TILE_SIZE = 16;

const players = [];
const inputsMap = {};
const ground2D = [];
const decals2D = [];

function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.h + rect1.y > rect2.y
  );
}

function isCollidingMap(player) {
  for (let row = 0; row < decals2D.length; row++) {
    for (let col = 0; col < decals2D[0].length; col++) {
      const tile = decals2D[row][col];

      if (
        tile &&
        isColliding(
          { x: player.x, y: player.y, w: 48, h: 64 },
          { x: col * TILE_SIZE, y: row * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE }
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function tick(io) {
  for (const player of players) {
    const inputs = inputsMap[player.id];
    const previousY = player.y;
    const previousX = player.x;

    if (inputs.up) player.y -= SPEED;
    else if (inputs.down) player.y += SPEED;
    if (isCollidingMap(player)) player.y = previousY;

    if (inputs.left) {
      player.x -= SPEED;
      player.dir = "left";
    } else if (inputs.right) {
      player.x += SPEED;
      player.dir = "right";
    }
    if (isCollidingMap(player)) player.x = previousX;
  }

  io.emit("players", players);
}

async function setupSocketServer(httpServer) {
  const io = new Server(httpServer);

  // load map
  const map = await new Promise((resolve, reject) => {
    tmx.parseFile("./src/map.tmx", (err, loadedMap) => {
      if (err) return reject(err);
      resolve(loadedMap);
    });
  });

  const groundTiles = map.layers[0].tiles;
  const decalTiles = map.layers[1].tiles;

  for (let row = 0; row < map.height; row++) {
    const groundRow = [];
    const decalRow = [];
    for (let col = 0; col < map.width; col++) {
      const groundTile = groundTiles[row * map.height + col];
      groundRow.push({ id: groundTile.id, gid: groundTile.gid });

      const decalTile = decalTiles[row * map.height + col];
      if (decalTile) {
        decalRow.push({ id: decalTile.id, gid: decalTile.gid });
      } else {
        decalRow.push(undefined);
      }
    }
    ground2D.push(groundRow);
    decals2D.push(decalRow);
  }

  io.on("connect", (socket) => {
    console.log("user connected", socket.id);

    inputsMap[socket.id] = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    players.push({
      id: socket.id,
      x: 0,
      y: 0,
      dir: "right",
    });

    socket.emit("map", {
      ground: ground2D,
      decals: decals2D,
    });

    socket.on("inputs", (inputs) => {
      inputsMap[socket.id] = inputs;
    });

    socket.on("chat", (msg) => {
      io.emit("chat", { from: socket.id, text: msg });
    });
  });

  // start game loop
  setInterval(() => tick(io), 1000 / TICK_RATE);
}

module.exports = setupSocketServer;
