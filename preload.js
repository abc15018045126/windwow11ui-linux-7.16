const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Most APIs have been moved to the Express server running in the main process.
  // We only expose functions here that are unique to the Electron renderer environment
  // and cannot be handled over a standard web API, like launching another Electron process.
  launchExternalApp: (path, args) =>
    ipcRenderer.invoke('app:launchExternal', path, args),

  // Expose methods to manage proxy settings for a specific session partition.
  // This is essential for the in-app browser to route its traffic through a proxy.
  setProxyForSession: (partition, proxyConfig) =>
    ipcRenderer.invoke('session:set-proxy', partition, proxyConfig),
  clearProxyForSession: partition =>
    ipcRenderer.invoke('session:clear-proxy', partition),
  restartApp: () => ipcRenderer.invoke('restart-app'),
});
