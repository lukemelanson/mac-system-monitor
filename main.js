const { app, Tray, Menu, BrowserWindow, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const si = require('systeminformation');

let tray = null;
let win = null;
let pollTimer = null;

const SESSIONS = {
  work: {
    label: 'Work',
    metrics: ['cpu', 'ram', 'battery', 'activeApp', 'network', 'breakReminder'],
    refreshMs: 3000,
    breakIntervalMin: 60
  },
  gaming: {
    label: 'Gaming',
    metrics: ['cpu', 'ram', 'battery', 'activeApp', 'gpu'],
    refreshMs: 1000
  },
  chill: {
    label: 'Chill',
    metrics: ['battery', 'network'],
    refreshMs: 5000
  },
  creative: {
    label: 'Creative',
    metrics: ['cpu', 'ram', 'battery', 'activeApp', 'disk', 'breakReminder'],
    refreshMs: 3000,
    breakIntervalMin: 90
  }
};

let currentSessionKey = 'work';
let sessionStartedAt = Date.now();
let lastBreakAt = Date.now();

function getActiveAppName() {
  return new Promise((resolve) => {
    const script = 'tell application "System Events" to get name of first application process whose frontmost is true';
    exec(`osascript -e '${script}'`, (err, stdout) => {
      if (err) return resolve('Unknown');
      resolve(stdout.trim());
    });
  });
}

async function collectMetrics(sessionKey) {
  const session = SESSIONS[sessionKey];
  const enabled = new Set(session.metrics);
  const out = { session: sessionKey, label: session.label, timestamp: Date.now() };
  const jobs = [];

  if (enabled.has('cpu')) jobs.push(si.currentLoad().then(d => { out.cpu = Math.round(d.currentLoad); }));
  if (enabled.has('ram')) jobs.push(si.mem().then(d => { out.ram = { usedPct: Math.round((d.active / d.total) * 100), usedGb: +(d.active / 1e9).toFixed(1), totalGb: +(d.total / 1e9).toFixed(1) }; }));
  if (enabled.has('battery')) jobs.push(si.battery().then(d => { out.battery = { percent: d.percent, charging: d.isCharging, timeRemaining: d.timeRemaining }; }));
  if (enabled.has('activeApp')) jobs.push(getActiveAppName().then(name => { out.activeApp = name; }));
  if (enabled.has('network')) jobs.push(si.networkStats().then(d => { const iface = d[0] || { rx_sec: 0, tx_sec: 0 }; out.network = { downKbps: Math.round((iface.rx_sec || 0) / 1024), upKbps: Math.round((iface.tx_sec || 0) / 1024) }; }));
  if (enabled.has('disk')) jobs.push(si.fsSize().then(d => { const main = d[0]; out.disk = main ? { usedPct: Math.round((main.used / main.size) * 100) } : null; }));
  if (enabled.has('gpu')) jobs.push(si.graphics().then(d => { const gpu = d.controllers && d.controllers[0]; out.gpu = gpu && gpu.utilizationGpu != null ? Math.round(gpu.utilizationGpu) : 'N/A'; }));
  if (enabled.has('breakReminder')) { const minutesSinceBreak = Math.round((Date.now() - lastBreakAt) / 60000); out.breakReminder = { minutesSinceBreak, dueForBreak: minutesSinceBreak >= (session.breakIntervalMin || 60) }; }

  await Promise.all(jobs);
  return out;
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  const tick = async () => {
    if (!win) return;
    const metrics = await collectMetrics(currentSessionKey);
    win.webContents.send('metrics-update', metrics);
  };
  tick();
  pollTimer = setInterval(tick, SESSIONS[currentSessionKey].refreshMs);
}

function positionWindowUnderTray() {
  const trayBounds = tray.getBounds();
  const winBounds = win.getBounds();
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - winBounds.width / 2);
  const y = Math.round(trayBounds.y + trayBounds.height);
  win.setPosition(x, y, false);
}

function createWindow() {
  win = new BrowserWindow({
    width: 300,
    height: 380,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
  win.on('blur', () => { if (win && !win.webContents.isDevToolsOpened()) win.hide(); });
}

function toggleWindow() {
  if (win.isVisible()) { win.hide(); } else { positionWindowUnderTray(); win.show(); win.focus(); }
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setTitle('◐');
  tray.on('click', toggleWindow);
}

app.whenReady().then(() => { createWindow(); createTray(); startPolling(); });
app.on('window-all-closed', (e) => e.preventDefault());

ipcMain.handle('get-sessions', () => Object.entries(SESSIONS).map(([key, s]) => ({ key, label: s.label })));
ipcMain.handle('get-current-session', () => currentSessionKey);
ipcMain.on('switch-session', (event, sessionKey) => { if (!SESSIONS[sessionKey]) return; currentSessionKey = sessionKey; sessionStartedAt = Date.now(); lastBreakAt = Date.now(); startPolling(); });
ipcMain.on('reset-break-timer', () => { lastBreakAt = Date.now(); });
ipcMain.on('update-tray-title', (event, title) => { if (tray) tray.setTitle(title); });
