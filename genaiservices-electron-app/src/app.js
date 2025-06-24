const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

ipcMain.on('navigate', (event, page) => {
    if (mainWindow) {
        mainWindow.loadFile(page);

        // When navigating to manage page, send the config after page loads
        if (page === 'manage-ai-services.html') {
            mainWindow.webContents.once('did-finish-load', () => {
                // Re-read and send the config
                const userDataPath = app.getPath('userData');
                const userConfigFilePath = path.join(userDataPath, 'genai-config.json');

                fs.readFile(userConfigFilePath, 'utf-8', (err, data) => {
                    if (err) {
                        console.error('Failed to read config file for manage page:', err);
                        return;
                    }
                    const config = JSON.parse(data);
                    mainWindow.webContents.send('config', config);
                });
            });
        }
    }
});

ipcMain.on('reload-app', () => {
    if (mainWindow) {
        mainWindow.reload();
    }
});

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

    // Allow internal navigation, only prevent external links
    mainWindow.webContents.on('will-navigate', (event, url) => {
        const parsedUrl = new URL(url);
        // Check if it's a file:// protocol or a relative path
        if (parsedUrl.protocol === 'file:' || !parsedUrl.protocol) {
            // This is an internal navigation - allow it
            return;
        }

        if (!shouldStayInWebview(url)) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });


    // Open external links in the default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        const parsedUrl = new URL(url);
        // Allow internal file:// protocols
        if (parsedUrl.protocol === 'file:') {
            return { action: 'allow' };
        }

        if (shouldStayInWebview(url)) {
            return { action: 'allow' };
        } else {
            shell.openExternal(url);
            return { action: 'deny' };
        }
    });
}

function shouldStayInWebview(url) {
    try {
        // Check if URL is a login page or belongs to a specific domain
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        console.log('Checking URL:', url, 'Hostname:', hostname);

        // List of domains that should be allowed in the webview
        // Use arrays where [0] is the domain and [1] is whether to match the whole domain
        const allowedDomains = [
            { domain: 'openai.com', fullDomain: true },      // Matches all *.openai.com
            { domain: 'chatgpt.com', fullDomain: true },      // Matches all *.chatgpt.com
            { domain: 'login.microsoftonline.com', fullDomain: false }, // Exact match only
            { domain: 'accounts.google.com', fullDomain: false },
            { domain: 'perplexity.ai', fullDomain: true },
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
        console.error('Error checking URL:', e);
        return false;
    }
}


// Initial app setup
app.on('ready', () => {
    createWindow();

    // Path to the config file in the user's data directory
    const userDataPath = app.getPath('userData');
    const userConfigFilePath = path.join(userDataPath, 'genai-config.json');

    // Path to the config file in the app's resources
    const appConfigFilePath = path.join(app.getAppPath(), 'config', 'genai-config.json');

    // Copy the config file to the user's data directory if it doesn't exist
    if (!fs.existsSync(userConfigFilePath)) {
        fs.copyFileSync(appConfigFilePath, userConfigFilePath);
    }

    // Read the config file and send it to the renderer process
    fs.readFile(userConfigFilePath, 'utf-8', (err, data) => {
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
