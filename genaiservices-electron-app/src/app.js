const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

app.disableHardwareAcceleration();

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