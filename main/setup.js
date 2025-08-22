const fs = require('fs');
const path = require('path');
const {FS_ROOT, SFTP_TEMP_DIR} = require('./constants');

function setupInitialFilesystem() {
  console.log('Ensuring essential directories exist in project root...');
  const directoriesToEnsure = ['Desktop', 'Documents', 'Downloads'];
  directoriesToEnsure.forEach(dir => {
    const dirPath = path.join(FS_ROOT, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {recursive: true});
    }
  });
  // Create temp directory for SFTP downloads
  if (!fs.existsSync(SFTP_TEMP_DIR)) {
    fs.mkdirSync(SFTP_TEMP_DIR);
  }
  const desktopPath = path.join(FS_ROOT, 'Desktop');
  const appsPath = path.join(FS_ROOT, 'components', 'apps');

  // Auto-create desktop shortcuts from .app files in components/apps
  if (fs.existsSync(appsPath)) {
    const appFiles = fs
      .readdirSync(appsPath)
      .filter(file => file.endsWith('.app'));
    appFiles.forEach(appFile => {
      const destPath = path.join(desktopPath, appFile);
      if (!fs.existsSync(destPath)) {
        const sourcePath = path.join(appsPath, appFile);
        fs.copyFileSync(sourcePath, destPath);
      }
    });
  }
}

module.exports = {setupInitialFilesystem};
