const mapImage = new Image();
mapImage.src = '/Stock.png';

const PlayerImage = new Image();
PlayerImage.src = '/walk_left_down.png';

const PlayerRightImage = new Image();
PlayerRightImage.src = '/walk_right_down.png';

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

//add
const chatInput = document.getElementById('chat-input');
const chatLog = document.getElementById('chat-log');

const socket = io(`ws://localhost:5000`);

let groundMap = [[]];
let decalMap = [[]];
let players = [];

const TILE_SIZE = 16;

socket.on('connect', () => {
    console.log('connected');
});

socket.on("map", (loadedMap) => {
    groundMap = loadedMap.ground;
    decalMap = loadedMap.decals;
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

const frameWidth = 48;
const frameHeight = 64;
const totalFrames = 8;
const animationSpeed = 120; // ms ต่อ frame

let animationFrame = 0;
let lastFrameTime = 8;

function loop() {
    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);

    let cameraX = 0;
    let cameraY = 0;

    const myPlayer = players.find((player) => player.id === socket.id);

    if(myPlayer) {
      cameraX = parseInt(myPlayer.x - canvasEl.width / 2);
      cameraY = parseInt(myPlayer.y - canvasEl.height / 2);
    }
    

    const TILES_IN_ROW = 84;

    for (let row = 0; row < groundMap.length; row++){
        for(let col = 0; col < groundMap[0].length; col++){
            let { id } = groundMap[row][col];
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            
            canvas.drawImage(
                mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE, 
                TILE_SIZE,
                col * TILE_SIZE - cameraX,
                row * TILE_SIZE - cameraY,
                TILE_SIZE,
                TILE_SIZE

            );
        }
    }

    for (let row = 0; row < decalMap.length; row++){
        for(let col = 0; col < decalMap[0].length; col++){
            let { id } = decalMap[row][col] ?? { id: undefined };
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            
            canvas.drawImage(
                mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE, 
                TILE_SIZE,
                col * TILE_SIZE - cameraX,
                row * TILE_SIZE - cameraY,
                TILE_SIZE,
                TILE_SIZE

            );
        }
    }

    const now = Date.now();
    if (now - lastFrameTime > animationSpeed) {
        animationFrame = (animationFrame + 1) % totalFrames;
        lastFrameTime = now;
    }
    
    for (const player of players) {

        const isRight = player.dir === "right"; // สมมุติ server ส่งค่าทิศทางมาใน player.dir
        const img = isRight ? PlayerRightImage : PlayerImage;

        const isMoving = player.id === socket.id &&
            (inputs.up || inputs.down || inputs.left || inputs.right);

        const frame = isMoving ? animationFrame : 0;

        canvas.drawImage(
            img,
            frame * frameWidth, 0,
            frameWidth, frameHeight,
            player.x - cameraX, player.y - cameraY,
            frameWidth, frameHeight
        );
    }

    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);