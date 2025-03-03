const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

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
}

app.on('ready', () => {
    createWindow();

    // Read the config file and send it to the renderer process
    const configFilePath = path.join(__dirname, '..', 'config', 'genai-config.json');
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
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