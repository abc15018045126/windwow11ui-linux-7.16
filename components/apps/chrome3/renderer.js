const {ipcRenderer} = require('electron');

const webSockets = new Map();

// Listen for a request from the main process to create a new WebSocket
ipcRenderer.on('create-websocket', (event, {connectionId, config}) => {
  const headers = {'User-Agent': 'Mozilla/5.0'};
  if (config.hostHeader) {
    headers['Host'] = config.hostHeader;
  }

  // Note: The native browser WebSocket API does not support custom headers directly.
  // This is a limitation. The 'Host' header will be sent by the browser based on the URL.
  // However, the main benefit is the TLS fingerprint, which should still solve the 403.
  // We will proceed without the custom Host header, as the browser environment is the key.

  const path = config.webSocketPath;
  const encodedPath = path.startsWith('/')
    ? '/' + encodeURIComponent(path.substring(1))
    : encodeURIComponent(path);
  const wsUrl = `wss://${config.serverAddress}:${config.serverPort}${encodedPath}`;

  // Use the browser's native WebSocket API
  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer'; // Important for handling binary data correctly

  webSockets.set(connectionId, ws);

  ws.onopen = () => {
    ipcRenderer.send('websocket-open', {connectionId});
  };

  ws.onmessage = event => {
    // The data is an ArrayBuffer, which needs to be converted to a Buffer
    // for the main process's Node.js environment.
    const buffer = Buffer.from(event.data);
    ipcRenderer.send('websocket-data', {connectionId, data: buffer});
  };

  ws.onerror = error => {
    // The native WebSocket error event is minimal. We'll just send a generic message.
    console.error(`WebSocket error for connection ${connectionId}:`, error);
    ipcRenderer.send('websocket-error', {
      connectionId,
      message: 'A WebSocket error occurred.',
    });
  };

  ws.onclose = event => {
    ipcRenderer.send('websocket-close', {
      connectionId,
      code: event.code,
      reason: event.reason,
    });
    webSockets.delete(connectionId);
  };
});

// Listen for a request from the main process to send data over a WebSocket
ipcRenderer.on('send-websocket-data', (event, {connectionId, data}) => {
  const ws = webSockets.get(connectionId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    // The data is a Buffer from the main process, which is compatible with the browser WebSocket API.
    ws.send(data);
  }
});

// Listen for a request from the main process to close a WebSocket
ipcRenderer.on('close-websocket', (event, {connectionId}) => {
  const ws = webSockets.get(connectionId);
  if (ws) {
    ws.close();
    webSockets.delete(connectionId);
  }
});
