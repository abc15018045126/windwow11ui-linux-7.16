const {app, BrowserWindow, session} = require('electron');
const {startServer, setWindow} = require('./server');

let win;

function createWindow() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    delete headers['x-frame-options'];
    delete headers['X-Frame-Options'];
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];
    callback({responseHeaders: headers});
  });

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL('https://github.com');

  win.webContents.on('did-finish-load', () => {
    const zoomFactor = win.webContents.getZoomFactor();
    console.log('当前缩放比例:', zoomFactor);

    if (global.wss) {
      global.wss.clients.forEach(client => {
        client.send(
          JSON.stringify({
            type: 'zoom',
            factor: zoomFactor,
          }),
        );
      });
    }
  });

  setWindow(win);
}

app.whenReady().then(() => {
  const {startServer, setWindow} = require('./server');
  startServer();
  createWindow();
});
