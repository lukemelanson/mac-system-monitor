const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  onMetrics: (callback) => ipcRenderer.on('metrics-update', (event, data) => callback(data)),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  getCurrentSession: () => ipcRenderer.invoke('get-current-session'),
  switchSession: (key) => ipcRenderer.send('switch-session', key),
  resetBreakTimer: () => ipcRenderer.send('reset-break-timer'),
  setTrayTitle: (title) => ipcRenderer.send('update-tray-title', title)
});
