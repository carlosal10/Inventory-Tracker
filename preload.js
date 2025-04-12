const { contextBridge, ipcRenderer } = require('electron');

// Expose specific methods to renderer safely
contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  log: (message) => {
    console.log(`Preload Log: ${message}`);
  }
});
