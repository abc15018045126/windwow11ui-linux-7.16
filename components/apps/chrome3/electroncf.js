const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const net = require('net');

// --- VLESS Configuration ---
const config = {
  // The serverAddress is now the required 'Host' header / SNI value.
  serverAddress: 'nless.abc15018045126.ip-dynamic.org',
  serverPort: 443,
  uuid: '2ea73714-138e-4cc7-8cab-d7caf476d51b',
  localPort: 1080,
  webSocketPath: '/proxyip=ProxyIP.US.CMLiussss.net',

  // IMPORTANT: This IP is a placeholder. If it fails, get the correct IP by running:
  // ping pages.cloudflare.com
  // Then, replace the IP string below with the one you found.
  realServerIp: '104.21.23.123', // Placeholder IP for pages.cloudflare.com
};

let mainWindow;

// Check for headless flag
const isHeadless = process.argv.includes('--headless');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true, // Enable the <webview> tag.
    },
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startVlessClientBridge() {
  const sockets = new Map();
  const vlessHeaders = new Map();
  let connectionCounter = 0;

  ipcMain.on('websocket-data', (event, {connectionId, data}) => {
    const socket = sockets.get(connectionId);
    if (socket && socket.writable) {
      socket.write(data);
    }
  });

  ipcMain.on('websocket-close', (event, {connectionId}) => {
    const socket = sockets.get(connectionId);
    if (socket) {
      socket.destroy();
      sockets.delete(connectionId);
      vlessHeaders.delete(connectionId);
    }
  });

  ipcMain.on('websocket-error', (event, {connectionId}) => {
    const socket = sockets.get(connectionId);
    if (socket) {
      socket.destroy();
      sockets.delete(connectionId);
      vlessHeaders.delete(connectionId);
    }
  });

  ipcMain.on('websocket-open', (event, {connectionId}) => {
    if (isHeadless) return; // In headless mode, there's no renderer to talk to.
    const socketState = sockets.get(connectionId);
    if (socketState && socketState.stage === 2) {
      const vlessHeader = vlessHeaders.get(connectionId);
      if (vlessHeader) {
        mainWindow.webContents.send('send-websocket-data', {
          connectionId,
          data: vlessHeader,
        });
        const successResponse = Buffer.from([
          0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0,
        ]);
        socketState.socket.write(successResponse);
        socketState.stage = 3;
      }
    }
  });

  const server = net.createServer(socket => {
    const connectionId = ++connectionCounter;
    const socketState = {socket: socket, stage: 0};
    sockets.set(connectionId, socketState);

    socket.on('data', data => {
      if (socketState.stage === 0) {
        socket.write(Buffer.from([0x05, 0x00]));
        socketState.stage = 1;
        return;
      }

      if (socketState.stage === 1) {
        const [ver, cmd, rsv, atyp] = data;
        if (ver !== 5 || cmd !== 1) {
          socket.destroy();
          return;
        }

        let remoteAddr = '';
        let remotePort;
        if (atyp === 1) {
          remoteAddr = data.slice(4, 8).join('.');
          remotePort = data.readUInt16BE(8);
        } else if (atyp === 3) {
          const addrLen = data[4];
          remoteAddr = data.slice(5, 5 + addrLen).toString('utf8');
          remotePort = data.readUInt16BE(5 + addrLen);
        } else {
          socket.destroy();
          return;
        }

        const uuidBytes = Buffer.from(config.uuid.replace(/-/g, ''), 'hex');
        const portBytes = Buffer.alloc(2);
        portBytes.writeUInt16BE(remotePort);
        const vlessHeaderPart1 = Buffer.concat([
          Buffer.from([0x00]),
          uuidBytes,
          Buffer.from([0x00]),
          Buffer.from([0x01]),
          portBytes,
        ]);

        let vlessHeaderPart2;
        if (atyp === 1) {
          vlessHeaderPart2 = Buffer.concat([
            Buffer.from([0x01]),
            data.slice(4, 8),
          ]);
        } else {
          const addrBytes = Buffer.from(remoteAddr, 'utf8');
          const addrLenByte = Buffer.alloc(1);
          addrLenByte.writeUInt8(addrBytes.length);
          vlessHeaderPart2 = Buffer.concat([
            Buffer.from([0x02]),
            addrLenByte,
            addrBytes,
          ]);
        }

        const vlessHeader = Buffer.concat([vlessHeaderPart1, vlessHeaderPart2]);
        vlessHeaders.set(connectionId, vlessHeader);

        if (!isHeadless) {
          mainWindow.webContents.send('create-websocket', {
            connectionId,
            config,
          });
        }
        socketState.stage = 2;
        return;
      }

      if (socketState.stage === 3) {
        if (!isHeadless) {
          mainWindow.webContents.send('send-websocket-data', {
            connectionId,
            data,
          });
        }
      }
    });

    socket.on('error', () => {
      if (!isHeadless)
        mainWindow.webContents.send('close-websocket', {connectionId});
    });
    socket.on('close', () => {
      if (!isHeadless)
        mainWindow.webContents.send('close-websocket', {connectionId});
    });
  });

  server.listen(config.localPort, () => {
    console.log(
      `[CHROME 3 PROXY] SOCKS5 proxy listening on 127.0.0.1:${config.localPort}`,
    );
    if (isHeadless) {
      console.log('[CHROME 3 PROXY] Running in headless mode.');
    }
  });
}

// Using the host-resolver-rules switch to map the desired Host/SNI to the actual server IP.
// This is the key to solving the server's security requirements.
app.commandLine.appendSwitch(
  'host-resolver-rules',
  `MAP ${config.serverAddress} ${config.realServerIp}`,
);
app.commandLine.appendSwitch('ignore-certificate-errors');

app.whenReady().then(() => {
  startVlessClientBridge();
  if (!isHeadless) {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
