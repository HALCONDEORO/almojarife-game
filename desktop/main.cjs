// El Almojarife desktop shell (Electron).
// The game uses ES modules and fetch(), which do not work over file://, so
// the shell serves the copied game files over a loopback-only HTTP server.
// Saves (localStorage) are keyed by origin, so the port is FIXED: a single
// instance lock plus a fixed port keeps every save on one origin. If the
// port is taken by something else, the shell says so instead of silently
// moving saves to a new origin.
const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { createStaticServer, isAllowedExternal, listen } = require('./server-lib.cjs');

const GAME_ROOT = path.join(__dirname, 'app');
const PORT = 8737; // fixed: the save origin must not move between launches

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit(); // a second launch just focuses the running game
} else {
  let server;
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(async () => {
    server = createStaticServer(GAME_ROOT);
    try {
      await listen(server, PORT);
    } catch {
      dialog.showErrorBox(
        'El Almojarife',
        `Port ${PORT} is already in use by another program. Close it and start the game again. Your saves are safe: they never moved.`,
      );
      app.quit();
      return;
    }
    const win = new BrowserWindow({
      width: 1440, height: 900, minWidth: 1024, minHeight: 700,
      autoHideMenuBar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    const ownOrigin = `http://127.0.0.1:${PORT}`;
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (isAllowedExternal(url)) shell.openExternal(url);
      return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith(ownOrigin + '/') && url !== ownOrigin) event.preventDefault();
    });
    win.loadURL(`${ownOrigin}/index.html`);
  });
  app.on('window-all-closed', () => { if (server) server.close(); app.quit(); });
}
