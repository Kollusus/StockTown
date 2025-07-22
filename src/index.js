// src/index.js
const http = require("http");
const app = require("./httpServer"); // ✅ เปลี่ยนจาก './httpServer'
const setupSocket = require("./socketServer");

const httpServer = http.createServer(app);

setupSocket(httpServer); // ไม่ต้องส่ง app ไปก็ได้ ถ้าไม่ได้ใช้

const PORT = 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});