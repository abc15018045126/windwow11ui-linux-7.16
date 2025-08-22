const {ipcMain, session, app} = require('electron');
const {launchExternalAppByPath} = require('./launcher');
const childProcessStore = require('./child-process-store');

function initializeIpcHandlers() {
  ipcMain.handle('restart-app', async () => {
    const children = childProcessStore.getAll();
    if (children.length > 0) {
      const exitPromises = children.map(child => {
        return new Promise(resolve => {
          child.on('exit', () => {
            resolve();
          });
        });
      });

      children.forEach(child => {
        child.kill();
      });

      await Promise.all(exitPromises);
    }

    // All children have exited, now we can restart.
    childProcessStore.clear(); // Clear the store just in case
    app.relaunch();
    app.quit();
  });

  ipcMain.handle('app:launchExternal', (event, relativeAppPath, args) => {
    return launchExternalAppByPath(relativeAppPath, args);
  });

  // Handle setting a proxy for a specific webview session
  ipcMain.handle('session:set-proxy', async (event, partition, config) => {
    if (!partition) return;
    try {
      const ses = session.fromPartition(partition);
      await ses.setProxy(config);
      console.log(
        `Proxy set for partition ${partition} with rules: ${config.proxyRules}`,
      );
    } catch (error) {
      console.error(`Failed to set proxy for partition ${partition}:`, error);
    }
  });

  // Handle clearing the proxy for a specific webview session
  ipcMain.handle('session:clear-proxy', async (event, partition) => {
    if (!partition) return;
    try {
      const ses = session.fromPartition(partition);
      await ses.setProxy({proxyRules: ''}); // Setting empty rules clears the proxy
      console.log(`Proxy cleared for partition ${partition}`);
    } catch (error) {
      console.error(`Failed to clear proxy for partition ${partition}:`, error);
    }
  });
}

module.exports = {initializeIpcHandlers};
