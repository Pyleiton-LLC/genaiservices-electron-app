const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        on: (channel, listener) => ipcRenderer.on(channel, listener),
        send: (channel, data) => ipcRenderer.send(channel, data)
    }
});