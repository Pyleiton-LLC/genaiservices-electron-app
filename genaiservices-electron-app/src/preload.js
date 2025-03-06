const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        on: (channel, func) => ipcRenderer.on(channel, func),
        send: (channel, data) => ipcRenderer.send(channel, data),
    },
    shell: {
        openExternal: (url) => shell.openExternal(url),
    },
    shouldStayInWebview: (url) => {
        // Implement the same logic here or relay to main process
        const allowedDomains = [
            'login.microsoftonline.com',
            'accounts.google.com',
            'auth.openai.com',
            'www.perplexity.ai'
        ];
        try {
            const urlObj = new URL(url);
            return allowedDomains.some(domain => urlObj.hostname.includes(domain));
        } catch (e) {
            return false;
        }
    }
});