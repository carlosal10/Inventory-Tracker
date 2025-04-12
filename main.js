const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let serverProcess;
const serverPort = 3000;  // Port for server communication

function startServer() {
  const serverFileName = process.platform === 'win32' ? 'server.exe' : 'server';

  let serverPath;

  // Check if running in development or production
  if (app.isPackaged) {
    // For packaged app, the server is in the resources path
    serverPath = path.join(process.resourcesPath, serverFileName);
  } else {
    // For development, the server can be run from the project root
    serverPath = path.join(__dirname, serverFileName);
  }

  const logPath = path.join(app.getPath('userData'), 'server-log.txt');
  const errorLog = fs.createWriteStream(logPath, { flags: 'a' });

  try {
    if (!fs.existsSync(serverPath)) {
      console.error(`Server executable not found at: ${serverPath}`);
      fs.appendFileSync(logPath, `Server executable not found at: ${serverPath}\n`);
      app.quit();
      return;
    }

    serverProcess = spawn(serverPath, [], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    console.log(`Server started at ${serverPath}`);
    fs.appendFileSync(logPath, `Server started at ${serverPath}\n`);

    serverProcess.stdout.pipe(errorLog);
    serverProcess.stderr.pipe(errorLog);

    serverProcess.on('exit', (code) => {
      console.log(`Server exited with code ${code}`);
      fs.appendFileSync(logPath, `Server exited with code ${code}\n`);
    });
  } catch (error) {
    console.error(`Error launching server: ${error}`);
    fs.appendFileSync(logPath, `Error launching server: ${error}\n`);
    app.quit();
  }
}

// Check if the server is ready to accept requests
function checkServerReady(retries = 20, delay = 2000) {
  const request = http.get(`http://localhost:${serverPort}`, (res) => {
    if (res.statusCode === 200) {
      console.log('Server is ready!');
      createWindow();
    } else {
      retryCheck(retries, delay);
    }
  });

  request.on('error', () => retryCheck(retries, delay));
}

// Retry logic to wait for server readiness
function retryCheck(retries, delay) {
  if (retries > 0) {
    console.log(`Retrying server... (${retries} attempts left)`);
    setTimeout(() => checkServerReady(retries - 1, delay), delay);
  } else {
    console.error('Server failed to start.');
    app.quit();
  }
}

// Create the Electron main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(app.getAppPath(), 'Lander.html'));
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    if (serverProcess) serverProcess.kill();
    mainWindow = null;
  });
}

// Initialize the app
app.whenReady().then(() => {
  startServer();
  checkServerReady();
});

// Handle window close events
app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
