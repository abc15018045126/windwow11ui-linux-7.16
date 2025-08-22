const WebSocket = require('ws');
const net = require('net');
const {createWebSocketStream} = require('ws');

const LOCAL_PORT = 1081;

// Configuration based on various VLESS/xray config files found in the project.
const config = {
  serverAddress: 'pages.cloudflare.com',
  serverPort: 443,
  uuid: '2ea73714-138e-4cc7-8cab-d7caf476d51b', // This was missing and is essential for VLESS
  webSocketPath: '/proxyip=ProxyIP.US.CMLiussss.net',
  hostHeader: 'nless.abc15018045126.ip-dynamic.org',
};

/**
 * Starts the proxy server for Chrome 3.
 * It listens locally as a SOCKS5 server and forwards traffic
 * to the remote VLESS WebSocket proxy server.
 */
function startChrome3Proxy() {
  const server = net.createServer(clientSocket => {
    let stage = 0;

    const onData = data => {
      if (stage === 0) {
        // SOCKS5 Greeting: We only support NO AUTHENTICATION (0x00)
        clientSocket.write(Buffer.from([0x05, 0x00]));
        stage = 1;
        return;
      }

      if (stage === 1) {
        // SOCKS5 Connection Request - after this, the listener will be removed.
        clientSocket.removeListener('data', onData);
        const [ver, cmd, rsv, atyp] = data;
        if (ver !== 5 || cmd !== 1) {
          console.error('[CH3PRX] Unsupported SOCKS version/command');
          clientSocket.end();
          return;
        }

        let remoteAddr, remotePort, initialData;
        if (atyp === 0x01) {
          // IPv4
          remoteAddr = data.slice(4, 8).join('.');
          remotePort = data.readUInt16BE(8);
          initialData = data.slice(10);
        } else if (atyp === 0x03) {
          // Domain
          const addrLen = data[4];
          remoteAddr = data.slice(5, 5 + addrLen).toString('utf8');
          remotePort = data.readUInt16BE(5 + addrLen);
          initialData = data.slice(5 + addrLen + 2);
        } else {
          console.error(`[CH3PRX] Unsupported address type: ${atyp}`);
          clientSocket.end();
          return;
        }

        const headers = {'User-Agent': 'Mozilla/5.0', Host: config.hostHeader};
        const path = config.webSocketPath;
        // URL-encode the path to handle special characters.
        const encodedPath = path.startsWith('/')
          ? '/' + encodeURIComponent(path.substring(1))
          : encodeURIComponent(path);
        const wsUrl = `wss://${config.serverAddress}:${config.serverPort}${encodedPath}`;

        const remoteConnection = new WebSocket(wsUrl, {
          headers,
          rejectUnauthorized: false,
        });

        const handleOpen = () => {
          // --- VLESS Header Construction ---
          const uuidBytes = Buffer.from(config.uuid.replace(/-/g, ''), 'hex');
          const portBytes = Buffer.alloc(2);
          portBytes.writeUInt16BE(remotePort);

          const vlessHeaderPart1 = Buffer.concat([
            Buffer.from([0x00]), // Version
            uuidBytes,
            Buffer.from([0x00]), // Addon Length
            Buffer.from([0x01]), // Command (TCP)
            portBytes,
          ]);

          let vlessHeaderPart2;
          if (atyp === 0x01) {
            // IPv4
            vlessHeaderPart2 = Buffer.concat([
              Buffer.from([0x01]),
              data.slice(4, 8),
            ]);
          } else {
            // Domain
            const addrBytes = Buffer.from(remoteAddr, 'utf8');
            const addrLenByte = Buffer.alloc(1);
            addrLenByte.writeUInt8(addrBytes.length);
            vlessHeaderPart2 = Buffer.concat([
              Buffer.from([0x02]),
              addrLenByte,
              addrBytes,
            ]);
          }
          // The full VLESS header includes the initial data packet from the browser.
          const vlessHeader = Buffer.concat([
            vlessHeaderPart1,
            vlessHeaderPart2,
            initialData,
          ]);

          remoteConnection.send(vlessHeader);

          // Send SOCKS success reply to the browser
          const successResponse = Buffer.from([
            0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0,
          ]);
          clientSocket.write(successResponse);

          // Begin piping data between the browser and the remote server
          const duplex = createWebSocketStream(remoteConnection, {
            readable: true,
            writable: true,
          });
          clientSocket.pipe(duplex).pipe(clientSocket);

          const cleanup = () => {
            if (!clientSocket.destroyed) clientSocket.destroy();
            if (duplex && !duplex.destroyed) duplex.destroy();
            if (remoteConnection.readyState === WebSocket.OPEN)
              remoteConnection.close();
          };

          clientSocket.on('error', cleanup).on('close', cleanup);
          duplex.on('error', cleanup).on('close', cleanup);
        };

        if (remoteConnection.readyState === WebSocket.OPEN) {
          handleOpen();
        } else {
          remoteConnection.on('open', handleOpen);
        }

        const cleanupOnError = err => {
          console.error('[CH3PRX] WebSocket connection error:', err.message);
          if (!clientSocket.destroyed) clientSocket.destroy();
        };
        remoteConnection.on('error', cleanupOnError);
        remoteConnection.on('close', () => {
          if (!clientSocket.destroyed) clientSocket.destroy();
        });
      }
    };
    clientSocket.on('data', onData);
    clientSocket.on('error', err => {
      /* ignore client errors */
    });
  });

  server.on('error', e => {
    if (e.code === 'EADDRINUSE') {
      console.error(
        `[CH3PRX] FATAL: Port ${LOCAL_PORT} is already in use. Proxy server cannot start.`,
      );
    } else {
      console.error('[CH3PRX] Server error:', e);
    }
  });

  server.listen(LOCAL_PORT, '127.0.0.1', () => {
    console.log(
      `✅ Chrome 3 Proxy (VLESS) listening on 127.0.0.1:${LOCAL_PORT}`,
    );
  });
}

module.exports = {startChrome3Proxy};
