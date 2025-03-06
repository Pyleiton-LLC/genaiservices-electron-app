const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const userDirConfigFilePath = path.join(app.getPath('userData'), 'pages-config.json');
const defaultConfigFilePath = app.isPackaged
    ? path.join(process.resourcesPath, 'config', 'pages-config.json')
    : path.join(__dirname, '..', 'config', 'pages-config.json');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true,
            nodeIntegration: false,
            contextIsolation: true,
            disableBlinkFeatures: 'ServiceWorker',
        },
    });

    mainWindow.loadFile('index.html');

    // Disable cache for the web contents
    mainWindow.webContents.session.clearCache();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // Open external links in the default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (shouldStayInWebview(url)) {
            return { action: 'allow' };
        } else {
            shell.openExternal(url);
            return { action: 'deny' };
        }
    })

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!shouldStayInWebview(url) && url !== mainWindow.webContents.getURL()) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
}

function shouldStayInWebview(url) {
    try {
        // Check if URL is a login page or belongs to a specific domain
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        // List of domains that should be allowed in the webview
        // Use arrays where [0] is the domain and [1] is whether to match the whole domain
        const allowedDomains = [
            { domain: 'openai.com', fullDomain: true },      // Matches all *.openai.com
            { domain: 'login.microsoftonline.com', fullDomain: false }, // Exact match only
            { domain: 'accounts.google.com', fullDomain: false },
            { domain: 'perplexity.ai', fullDomain: true }    // Matches all *.perplexity.ai
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
        console.error('Error checking URL:', e);
        return false;
    }
}


// Initial app setup
app.on('ready', () => {
    // Copy the config file to the user's app data directory if it doesn't exist
    if (app.isPackaged && !fs.existsSync(userDirConfigFilePath)) {
        fs.copyFileSync(defaultConfigFilePath, userDirConfigFilePath);
    }

    createWindow();

    // Read the config file and send it to the renderer process
    fs.readFile(defaultConfigFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Failed to read config file:', err);
            return;
        }
        const config = JSON.parse(data);
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('config', config);
        });
    });
});

app.on('web-contents-created', (event, contents) => {
    // Handle attempts to navigate to a URL
    contents.on('will-navigate', (event, navigationUrl) => {
        // Only prevent navigation for non-whitelisted domains
        if (!shouldStayInWebview(navigationUrl)) {
            const parsedUrl = new URL(navigationUrl);
            if (parsedUrl.origin !== contents.getURL()) {
                event.preventDefault();
                shell.openExternal(navigationUrl);
            }
        }
    });

    // Handle new window creation attempts
    contents.setWindowOpenHandler(({ url }) => {
        if (shouldStayInWebview(url)) {
            // Allow it to open in the application
            return { action: 'allow' };
        } else {
            // Open external URL in browser
            shell.openExternal(url);
            return { action: 'deny' };
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});