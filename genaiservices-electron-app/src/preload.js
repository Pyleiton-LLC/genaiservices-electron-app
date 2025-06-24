const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        on: (channel, func) => {
            if (channel === 'config') {
                ipcRenderer.on(channel, func);
            }
        },
        send: (channel, data) => {
            // Allow 'navigate' channel
            if (channel === 'navigate') {
                ipcRenderer.send(channel, data);
            }
        },
    },
    shell: {
        openExternal: (url) => shell.openExternal(url),
    },
    shouldStayInWebview: (url) => {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            // List of domains with wildcard options
            const allowedDomains = [
                { domain: 'openai.com', fullDomain: true },      // Matches all *.openai.com
                { domain: 'chatgpt.com', fullDomain: true },      // Matches all *.chatgpt.com
                { domain: 'login.microsoftonline.com', fullDomain: false }, // Exact match only
                { domain: 'accounts.google.com', fullDomain: false }, //Exact match only
                { domain: 'perplexity.ai', fullDomain: true },    // Matches all *.perplexity.ai
                { domain: 'claude.ai', fullDomain: false }
            ];

            // Check if the hostname matches any allowed domains
            return allowedDomains.some(({ domain, fullDomain }) => {
                if (fullDomain) {
                    // For full domain matching, check if hostname ends with the domain
                    return hostname === domain || hostname.endsWith('.' + domain);
                } else {
                    // For specific subdomain matching, check for exact match
                    return hostname === domain;
                }
            });
        } catch (e) {
            console.error('Error checking URL in preload:', e);
            return false;
        }
    }
});