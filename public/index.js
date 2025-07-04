const mapImage = new Image();
mapImage.src = '/Stock.png';

const PlayerImage = new Image();
PlayerImage.src = '/kk.png';

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

//add
const chatInput = document.getElementById('chat-input');
const chatLog = document.getElementById('chat-log');

const socket = io(`ws://localhost:5000`);

let map = [[]];
let players = [];

const TILE_SIZE = 16;

socket.on('connect', () => {
    console.log('connected');
});

socket.on("map", (loadedMap) => {
    map = loadedMap;
});

socket.on('players', (serverPlayers) => {
    players = serverPlayers;
    console.log("test", serverPlayers);
})

const inputs = {
  up: false,
  down: false,
  left: false,
  right: false,
};

window.addEventListener("keydown", (e) => {
  if (e.key === "w") {
    inputs["up"] = true;
  } else if (e.key === "s") {
    inputs["down"] = true;
  } else if (e.key === "d") {
    inputs["right"] = true;
  } else if (e.key === "a") {
    inputs["left"] = true;
  }
  
  socket.emit("inputs", inputs);

});

window.addEventListener("keyup", (e) => {
  if (e.key === "w") {
    inputs["up"] = false;
  } else if (e.key === "s") {
    inputs["down"] = false;
  } else if (e.key === "d") {
    inputs["right"] = false;
  } else if (e.key === "a") {
    inputs["left"] = false;
  }
  
  socket.emit("inputs", inputs);
});

function addMessage(text, from = "You") {
  const msg = document.createElement('div');
  msg.classList.add('chat-message');
  msg.textContent = `${from}: ${text}`;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;

  
}

chatInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && chatInput.value.trim() !== '') {
    const message = chatInput.value.trim();
    socket.emit("chat", message);
    addMessage(message, 'You');
    chatInput.value = '';
  }
});

socket.on('chat', (msg) => {
  addMessage(msg.text, msg.from);
});

function loop() {
    canvas.clearRect(0, 0, canvas.width, canvas.height);

    const TILES_IN_ROW = 84;

    for (let row = 0; row < map.length; row++){
        for(let col = 0; col < map[0].length; col++){
            const { id } = map[row][col];
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            
            canvas.drawImage(
                mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE, 
                TILE_SIZE,
                col * TILE_SIZE,
                row * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE

            );
        }
    }
    
    for (const player of players) {
        canvas.drawImage(PlayerImage, player.x, player.y);
    }
    //canvas.drawImage(PlayerImage,0,0);

    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);