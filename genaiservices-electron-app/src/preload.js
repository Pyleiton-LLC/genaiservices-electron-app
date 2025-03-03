const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        on: (channel, func) => {
            const validChannels = ['config'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
            }
        }
    }
});