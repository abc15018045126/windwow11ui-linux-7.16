const express = require('express');
const path = require('path');
const WebSocket = require('ws');

let mainWindow = null;

function setWindow(win) {
  mainWindow = win;
}

function startServer() {
  const app = express();
  const port = 3000;
  app.use(express.static(path.join(__dirname, 'public')));
  app.listen(port, () => console.log(`HTTP 服务器: http://localhost:${port}`));

  // 输入事件 WebSocket
  const wssInput = new WebSocket.Server({ port: 8081 });
  console.log("输入事件 WebSocket: ws://localhost:8081");
  global.wssInput = wssInput;

  wssInput.on('connection', (ws) => {
    if (mainWindow) {
      const [w, h] = mainWindow.getSize();
      ws.send(JSON.stringify({ type: 'size', width: w, height: h }));
    }

    ws.on('message', (msg) => {
      try {
        const event = JSON.parse(msg.toString());
        if (event.type === 'input' && mainWindow) {
          mainWindow.webContents.sendInputEvent(event.payload);
        }
      } catch (err) {
        console.error('解析输入消息失败:', err);
      }
    });
  });

  // 截图 WebSocket
  const wssFrame = new WebSocket.Server({ port: 8082 });
  console.log("截图 WebSocket: ws://localhost:8082");

  wssFrame.on('connection', (ws) => {
    const interval = setInterval(async () => {
      if (!mainWindow || ws.readyState !== WebSocket.OPEN) return;
      try {
        const image = await mainWindow.webContents.capturePage();
        const buffer = image.toPNG();
        ws.send(buffer);
      } catch (err) {
        console.error('截图失败:', err);
      }
    }, 200);

    ws.on('close', () => clearInterval(interval));
  });
}

module.exports = { startServer, setWindow };