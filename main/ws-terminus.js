const {WebSocketServer} = require('ws');
const {Client} = require('ssh2');
const {WS_PORT} = require('./constants');

function startTerminusServer() {
  const wss = new WebSocketServer({port: WS_PORT});
  const sshConnections = new Map();

  wss.on('connection', ws => {
    const connectionId = Math.random().toString(36).substring(2, 15);
    console.log(`[Terminus] WebSocket client connected: ${connectionId}`);

    ws.on('message', message => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'connect') {
          const {host, username, password} = data.payload;
          const conn = new Client();
          sshConnections.set(connectionId, {ws, ssh: conn});

          conn
            .on('ready', () => {
              ws.send(JSON.stringify({type: 'status', payload: 'connected'}));
              conn.shell({term: 'xterm-256color'}, (err, stream) => {
                if (err) {
                  ws.send(
                    JSON.stringify({type: 'error', payload: err.message}),
                  );
                  return;
                }

                sshConnections.get(connectionId).stream = stream;

                stream
                  .on('close', () => {
                    conn.end();
                  })
                  .on('data', data => {
                    ws.send(
                      JSON.stringify({
                        type: 'data',
                        payload: data.toString('utf8'),
                      }),
                    );
                  })
                  .stderr.on('data', data => {
                    ws.send(
                      JSON.stringify({
                        type: 'data',
                        payload: data.toString('utf8'),
                      }),
                    );
                  });
              });
            })
            .on('error', err => {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  payload: `Connection Error: ${err.message}`,
                }),
              );
              sshConnections.delete(connectionId);
            })
            .on('close', () => {
              ws.send(
                JSON.stringify({type: 'status', payload: 'disconnected'}),
              );
              sshConnections.delete(connectionId);
            })
            .connect({
              host,
              port: 22,
              username,
              password,
              readyTimeout: 20000,
            });
        } else if (data.type === 'data') {
          const connection = sshConnections.get(connectionId);
          if (connection && connection.stream) {
            connection.stream.write(data.payload);
          }
        } else if (data.type === 'resize') {
          const connection = sshConnections.get(connectionId);
          if (connection && connection.stream) {
            connection.stream.setWindow(data.payload.rows, data.payload.cols);
          }
        } else if (data.type === 'disconnect') {
          const connection = sshConnections.get(connectionId);
          if (connection && connection.ssh) {
            connection.ssh.end();
          }
        }
      } catch (e) {
        console.error('[Terminus] Error processing WebSocket message:', e);
      }
    });

    ws.on('close', () => {
      console.log(`[Terminus] WebSocket client disconnected: ${connectionId}`);
      const connection = sshConnections.get(connectionId);
      if (connection && connection.ssh) {
        connection.ssh.end();
      }
      sshConnections.delete(connectionId);
    });
  });

  console.log(
    `✅ Terminus WebSocket server listening on ws://localhost:${WS_PORT}`,
  );
}

module.exports = {startTerminusServer};
