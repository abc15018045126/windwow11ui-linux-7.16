const {app} = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
const API_PORT = 3001;
const WS_PORT = 3002;
const SFTP_WS_PORT = 3003;

// The project root is one level up from the 'main' directory
const FS_ROOT = path.join(__dirname, '..');
const SFTP_TEMP_DIR = path.join(FS_ROOT, 'sftp_temp');

module.exports = {
  isDev,
  API_PORT,
  WS_PORT,
  SFTP_WS_PORT,
  FS_ROOT,
  SFTP_TEMP_DIR,
};
