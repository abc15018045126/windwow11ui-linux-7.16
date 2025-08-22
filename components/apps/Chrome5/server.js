const express = require('express');
const path = require('path');
const WebSocket = require('ws');

let mainWindow = null;
let wss;

function setWindow(win) {
  mainWindow = win;
}

function startServer() {
  const app = express();
  const port = 3000;
  app.use(express.static(path.join(__dirname, 'public')));
  app.listen(port, () => console.log(`HTTP 服务器: http://localhost:${port}`));

  wss = new WebSocket.Server({port: 8081});
  console.log('WebSocket 服务器: ws://localhost:8081');
  global.wss = wss;

  wss.on('connection', ws => {
    if (mainWindow) {
      const [w, h] = mainWindow.getSize();
      ws.send(JSON.stringify({type: 'size', width: w, height: h}));
    }

    ws.on('message', msg => {
      const event = JSON.parse(msg);
      if (event.type === 'input' && mainWindow) {
        mainWindow.webContents.sendInputEvent(event.payload);
      }
    });

    const interval = setInterval(async () => {
      if (!mainWindow || ws.readyState !== WebSocket.OPEN) return;
      const image = await mainWindow.webContents.capturePage();
      const buffer = image.toPNG();
      ws.send(buffer);
    }, 200);

    ws.on('close', () => clearInterval(interval));
  });
}

module.exports = {startServer, setWindow};
