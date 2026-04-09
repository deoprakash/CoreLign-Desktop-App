const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('corelignDesktop', {
  // apiBase: 'http://127.0.0.1:8000',
  apiBase: 'https://corelign-desktop-app-production.up.railway.app',
  getDeviceInfo: () => ipcRenderer.invoke('corelign:get-device-info'),
})
