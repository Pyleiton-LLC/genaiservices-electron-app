const { app, BrowserWindow, session } = require('electron');
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

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    // Copy the config file to the user's app data directory if it doesn't exist
    if (app.isPackaged && !fs.existsSync(userDirConfigFilePath)) {
        fs.copyFileSync(defaultConfigFilePath, userDirConfigFilePath);
    }
    createWindow();
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