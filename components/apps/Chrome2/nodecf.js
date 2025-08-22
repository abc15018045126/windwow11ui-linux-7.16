/*
 * Node.js VLESS Client (nodecf.js)
 *
 * Description:
 * This script creates a local SOCKS5 proxy that forwards traffic to a VLESS
 * server over a WebSocket connection.
 *
 * Final Configuration based on the user's provided xray config.
 */

const WebSocket = require('ws');
const net = require('net');
const {v4: uuidv4} = require('uuid');

// --- Configuration ---
// This configuration is based on the xray file you provided.
const config = {
  // -- Connection details --
  serverAddress: 'pages.cloudflare.com', // This is the 'address' from your xray config
  serverPort: 443, // This is the 'port' from your xray config
  uuid: '2ea73714-138e-4cc7-8cab-d7caf476d51b', // This is the 'id' from your xray config
  localPort: 1080, // The local port for the SOCKS5 proxy

  // -- VLESS / WebSocket Settings --
  // These are from the 'wsSettings' in your xray config
  webSocketPath: '/proxyip=ProxyIP.US.CMLiussss.net', // This is the 'path'
  hostHeader: 'nless.abc15018045126.ip-dynamic.org', // This is the 'Host' header
};

// --- Main Logic ---
console.log('Starting VLESS client...');
console.log('Configuration loaded:');
console.log(`  -> Connecting to: ${config.serverAddress}:${config.serverPort}`);
console.log(`  -> Host Header: ${config.hostHeader}`);
console.log(`  -> WebSocket Path: ${config.webSocketPath}`);

const server = net.createServer(socket => {
  let stage = 0;
  let headerSent = false;

  // Set up WebSocket headers
  const headers = {'User-Agent': 'Mozilla/5.0'};
  if (config.hostHeader) {
    headers['Host'] = config.hostHeader;
  }

  // URL-encode the path to handle special characters, preserving the leading slash if it exists.
  const path = config.webSocketPath;
  const encodedPath = path.startsWith('/')
    ? '/' + encodeURIComponent(path.substring(1))
    : encodeURIComponent(path);

  const ws = new WebSocket(
    `wss://${config.serverAddress}:${config.serverPort}${encodedPath}`,
    {
      rejectUnauthorized: false,
      headers: headers,
    },
  );

  ws.on('open', () => {
    // Connection is open, but we need the SOCKS info before we can send the VLESS header.
  });

  ws.on('message', data => {
    socket.write(data);
  });

  ws.on('error', err => {
    console.error('WebSocket error:', err.message);
    socket.destroy();
  });

  ws.on('close', () => {
    socket.destroy();
  });

  socket.on('data', data => {
    if (stage === 0) {
      // SOCKS5 greeting
      socket.write(Buffer.from([0x05, 0x00]));
      stage = 1;
      return;
    }

    if (stage === 1) {
      // SOCKS5 connection request
      const [ver, cmd, rsv, atyp] = data;

      if (ver !== 5 || cmd !== 1) {
        console.error('Unsupported SOCKS version or command');
        socket.destroy();
        return;
      }

      let remoteAddr = '';
      let remotePort;

      if (atyp === 1) {
        // IPv4
        remoteAddr = data.slice(4, 8).join('.');
        remotePort = data.readUInt16BE(8);
      } else if (atyp === 3) {
        // Domain name
        const addrLen = data[4];
        remoteAddr = data.slice(5, 5 + addrLen).toString('utf8');
        remotePort = data.readUInt16BE(5 + addrLen);
      } else if (atyp === 4) {
        // IPv6
        remoteAddr = data.slice(4, 20).toString('hex');
        remotePort = data.readUInt16BE(20);
      } else {
        console.error(`Unsupported address type: ${atyp}`);
        socket.destroy();
        return;
      }

      console.log(`Proxying request to -> ${remoteAddr}:${remotePort}`);

      // Construct VLESS header
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
      if (atyp === 1) {
        // IPv4
        vlessHeaderPart2 = Buffer.concat([
          Buffer.from([0x01]),
          data.slice(4, 8),
        ]);
      } else if (atyp === 3) {
        // Domain
        const addrBytes = Buffer.from(remoteAddr, 'utf8');
        const addrLenByte = Buffer.alloc(1);
        addrLenByte.writeUInt8(addrBytes.length);
        vlessHeaderPart2 = Buffer.concat([
          Buffer.from([0x02]),
          addrLenByte,
          addrBytes,
        ]);
      } else {
        console.error(
          'IPv6 is not supported for VLESS header construction in this script.',
        );
        socket.destroy();
        return;
      }

      const vlessHeader = Buffer.concat([vlessHeaderPart1, vlessHeaderPart2]);

      const sendVlessHeader = () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(vlessHeader);
          headerSent = true;

          const successResponse = Buffer.from([
            0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0,
          ]);
          socket.write(successResponse);
          stage = 2; // Data piping stage
        }
      };

      if (ws.readyState === WebSocket.OPEN) {
        sendVlessHeader();
      } else {
        ws.once('open', sendVlessHeader);
      }
      return;
    }

    if (stage === 2 && headerSent) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  });

  socket.on('error', err => {
    console.error('Local socket error:', err.message);
    ws.close();
  });

  socket.on('close', () => {
    ws.close();
  });
});

// Start listening on the local port
server.listen(config.localPort, () => {
  console.log('---');
  console.log(`VLESS client listening on http://127.0.0.1:${config.localPort}`);
  console.log('---');
});

server.on('error', err => {
  console.error('Server error:', err);
});
