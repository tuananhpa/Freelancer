// Electron shell: runs the local server in-process and opens it in a window.
// Phones on the same Wi-Fi can still open http://<this-PC>:4173 while the app is running.
const { app, BrowserWindow, session, shell, dialog, Menu } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const primary = app.requestSingleInstanceLock(); // a second launch just focuses the open window
if (!primary) app.quit();
// packaged app: keep user data out of the read-only install folder
if (app.isPackaged) process.env.DATA_DIR ||= path.join(app.getPath('userData'), 'data');
process.env.PORT ||= '4173';

let win;
async function start() {
  try {
    const { ready } = await import(pathToFileURL(path.join(__dirname, '..', 'server.mjs')).href);
    const { vieneu } = await import(pathToFileURL(path.join(__dirname, '..', 'lib', 'tts.mjs')).href);
    app.on('will-quit', () => vieneu.proc?.kill()); // don't leave the Python TTS worker running
    await ready;
  } catch (e) {
    dialog.showErrorBox('Không khởi động được', e.code === 'EADDRINUSE' ? `Cổng ${process.env.PORT} đang bị chương trình khác dùng. Đóng chương trình đó rồi mở lại.` : String(e.stack || e));
    return app.quit();
  }
  const origin = `http://localhost:${process.env.PORT}`;
  // microphone for recording; nothing else
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, details) => cb(perm === 'media' && (details.requestingUrl || '').startsWith(origin)));
  session.defaultSession.setPermissionCheckHandler((wc, perm, reqOrigin) => perm === 'media' && reqOrigin.startsWith(origin));
  // downloads (MP4/MP3) open a native "Save as" dialog
  session.defaultSession.on('will-download', (_e, item) => {
    item.setSaveDialogOptions({ title: 'Lưu file', defaultPath: path.join(app.getPath('downloads'), item.getFilename()) });
    item.once('done', (_e2, state) => { if (state === 'completed') shell.showItemInFolder(item.getSavePath()); });
  });

  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600, backgroundColor: '#f5f7f0', title: 'Phát thanh nội bộ',
    icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, autoplayPolicy: 'no-user-gesture-required' },
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (!url.startsWith(origin)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(origin)) { e.preventDefault(); shell.openExternal(url); } });
  win.webContents.on('before-input-event', (_e, input) => { if (input.key === 'F12') win.webContents.toggleDevTools(); if (input.key === 'F5') win.webContents.reload(); });
  win.loadURL(origin);
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
if (primary) app.whenReady().then(start);
app.on('window-all-closed', () => app.quit());
