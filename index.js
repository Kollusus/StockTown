const express = require ('express');

const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer);

const tmx = require('tmx-parser');

let map = null;

const SPEED = 5;
const TICK_RATE = 30;

function tick() {
    for (const player of players) {
        const inputs = inputsMap[player.id];
        if (inputs.up) {
            player.y -= SPEED;
        } else if (inputs.down) {
            player.y += SPEED;
        }

        if (inputs.left) {
            player.x -= SPEED;
        } else if (inputs.right) {
            player.x += SPEED;
        }
    }

    io.emit('players', players);
}

const players = [];
const inputsMap = {};

async function main() {
    const map = await new Promise((resolve, reject) => {
            tmx.parseFile("./src/map.tmx", function(err, loadedMap) {
            if (err) return reject(err);
            console.log(loadedMap);
            resolve(loadedMap);
        });
    })
    
    console.log("map", map);

    const layer = map.layers[0];
    const tiles = layer.tiles;
    const map2D = [];
    for(let row = 0; row < map.height; row++) {
        const tileRow = [];
        for(let col = 0; col < map.width; col++) {
            const tile = tiles[row * map.height + col];
              tileRow.push({id: tile.id, gid: tile.gid});
        }
        map2D.push(tileRow);
    }
    console.log("map2D", map2D);

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
        });

        socket.emit("map", map2D);

        socket.on("inputs", (inputs) => {
            inputsMap[socket.id] = inputs;
        });

        socket.on("chat", (msg) => {
            io.emit('chat', { from: socket.id, text: msg});
        });
    });

    app.use(express.static("public"));

    httpServer.listen(5000);

    setInterval( tick/*() => {}*/, 1000 / TICK_RATE);
    }

main();

