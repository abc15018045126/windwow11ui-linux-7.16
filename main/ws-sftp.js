const {WebSocketServer} = require('ws');
const {Client} = require('ssh2');
const path = require('path');
const fs = require('fs');
const {SFTP_WS_PORT} = require('./constants');
const {resolvePath} = require('./utils');

function startSftpServer() {
  const sftpWss = new WebSocketServer({port: SFTP_WS_PORT});
  const sftpConnections = new Map();

  sftpWss.on('connection', ws => {
    const connectionId = `sftp-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[SFTP] Client connected: ${connectionId}`);

    const sendError = payload =>
      ws.send(JSON.stringify({type: 'error', payload}));
    const sendOpError = payload =>
      ws.send(JSON.stringify({type: 'operation_error', payload}));
    const sendSuccess = (message, dirToRefresh, isLocal = false) =>
      ws.send(
        JSON.stringify({
          type: 'operation_success',
          payload: {message, dirToRefresh, isLocal},
        }),
      );

    ws.on('message', message => {
      try {
        const data = JSON.parse(message);
        const connDetails = sftpConnections.get(connectionId);
        const sftp = connDetails?.sftp;

        const handleSftpError = (err, operation, target) => {
          if (err) {
            console.error(`[SFTP Error] ${operation} on ${target}:`, err);
            sendOpError(
              `Failed to ${operation} ${path.posix.basename(target)}: ${err.message}`,
            );
            return true;
          }
          return false;
        };

        if (data.type === 'connect') {
          const {host, port, username, password} = data.payload;
          const conn = new Client();
          sftpConnections.set(connectionId, {ws, ssh: conn});

          conn
            .on('ready', () => {
              conn.sftp((err, sftp) => {
                if (err) {
                  sendError(`SFTP Error: ${err.message}`);
                  return;
                }
                sftpConnections.get(connectionId).sftp = sftp;
                ws.send(JSON.stringify({type: 'status', payload: 'connected'}));
              });
            })
            .on('error', err => {
              sendError(`Connection Error: ${err.message}`);
              sftpConnections.delete(connectionId);
            })
            .on('close', () => {
              ws.send(
                JSON.stringify({type: 'status', payload: 'disconnected'}),
              );
              sftpConnections.delete(connectionId);
            })
            .connect({
              host,
              port: parseInt(port, 10) || 22,
              username,
              password,
              readyTimeout: 20000,
            });
        } else if (data.type === 'list' && sftp) {
          const {path: reqPath} = data.payload;
          sftp.readdir(reqPath, (err, list) => {
            if (handleSftpError(err, 'list', reqPath)) return;
            const items = list.map(item => ({
              name: item.filename,
              path: path.posix.join(reqPath, item.filename),
              type: item.longname.startsWith('d') ? 'folder' : 'file',
              size: item.attrs.size,
              modified: item.attrs.mtime,
            }));
            ws.send(
              JSON.stringify({type: 'list', payload: {path: reqPath, items}}),
            );
          });
        } else if (data.type === 'get_content' && sftp) {
          const {path: reqPath} = data.payload;
          const stream = sftp.createReadStream(reqPath);
          const chunks = [];
          stream.on('data', chunk => chunks.push(chunk));
          stream.on('error', err =>
            handleSftpError(err, 'get content for', reqPath),
          );
          stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            ws.send(
              JSON.stringify({
                type: 'file_content',
                payload: {path: reqPath, content: buffer.toString('utf8')},
              }),
            );
          });
        } else if (data.type === 'find_unique_name' && sftp) {
          const {parentDir, baseName, isFolder} = data.payload;
          sftp.readdir(parentDir, (err, list) => {
            if (handleSftpError(err, 'find unique name in', parentDir)) return;

            const existingNames = new Set(list.map(item => item.filename));
            let uniqueName = baseName;
            let counter = 0;
            const [namePart, extPart] = (() => {
              if (isFolder) return [baseName, ''];
              const lastDot = baseName.lastIndexOf('.');
              if (lastDot === -1 || lastDot === 0) return [baseName, ''];
              return [
                baseName.substring(0, lastDot),
                baseName.substring(lastDot),
              ];
            })();

            while (existingNames.has(uniqueName)) {
              counter++;
              uniqueName = `${namePart} (${counter})${extPart}`;
            }

            ws.send(
              JSON.stringify({
                type: 'unique_name_found',
                payload: {name: uniqueName, parentDir, isFolder},
              }),
            );
          });
        } else if (data.type === 'create_folder' && sftp) {
          const {parentDir, name} = data.payload;
          const newPath = path.posix.join(parentDir, name);
          sftp.mkdir(newPath, err => {
            if (handleSftpError(err, 'create folder', newPath)) return;
            sendSuccess(`Created folder ${name}`, parentDir, false);
          });
        } else if (data.type === 'create_file' && sftp) {
          const {parentDir, name} = data.payload;
          const newPath = path.posix.join(parentDir, name);
          const stream = sftp.createWriteStream(newPath);
          stream.on('error', err =>
            handleSftpError(err, 'create file', newPath),
          );
          stream.on('finish', () =>
            sendSuccess(`Created file ${name}`, parentDir, false),
          );
          stream.end();
        } else if (data.type === 'delete' && sftp) {
          const {item} = data.payload;
          const op =
            item.type === 'folder'
              ? sftp.rmdir.bind(sftp)
              : sftp.unlink.bind(sftp);
          op(item.path, err => {
            if (handleSftpError(err, 'delete', item.path)) return;
            sendSuccess(
              `Deleted ${item.name}`,
              path.posix.dirname(item.path),
              false,
            );
          });
        } else if (data.type === 'rename' && sftp) {
          const {item, newName} = data.payload;
          const newPath = path.posix.join(
            path.posix.dirname(item.path),
            newName,
          );
          sftp.rename(item.path, newPath, err => {
            if (handleSftpError(err, 'rename', item.path)) return;
            sendSuccess(
              `Renamed ${item.name} to ${newName}`,
              path.posix.dirname(item.path),
              false,
            );
          });
        } else if (data.type === 'save_content' && sftp) {
          const {path: reqPath, content} = data.payload;
          const writeStream = sftp.createWriteStream(reqPath);

          writeStream.on('error', err => {
            handleSftpError(err, 'save content to', reqPath);
          });

          writeStream.on('finish', () => {
            ws.send(
              JSON.stringify({
                type: 'operation_success',
                payload: {
                  message: `Saved ${path.posix.basename(
                    reqPath,
                  )} successfully.`,
                },
              }),
            );
          });

          writeStream.end(content, 'utf8');
        } else if (data.type === 'disconnect' && connDetails?.ssh) {
          connDetails.ssh.end();
        }
      } catch (e) {
        console.error(
          `[SFTP] Error processing WebSocket message from ${connectionId}:`,
          e,
        );
        sendError('Invalid message format received.');
      }
    });

    ws.on('close', () => {
      console.log(`[SFTP] Client disconnected: ${connectionId}`);
      const connDetails = sftpConnections.get(connectionId);
      if (connDetails?.ssh) connDetails.ssh.end();
      sftpConnections.delete(connectionId);
    });
  });

  console.log(
    `✅ SFTP WebSocket server listening on ws://localhost:${SFTP_WS_PORT}`,
  );
}

module.exports = {startSftpServer};
