const metricsEl = document.getElementById('metrics');
const switcherEl = document.getElementById('session-switcher');
const breakBanner = document.getElementById('break-banner');
const breakText = document.getElementById('break-text');
const breakBtn = document.getElementById('break-btn');

let sessions = [];
let activeSession = 'work';

function barClass(pct) { if (pct >= 85) return 'danger'; if (pct >= 65) return 'warn'; return ''; }
function renderRow(label, valueHtml) { return `<div class="metric-row"><span class="metric-label">${label}</span>${valueHtml}</div>`; }
function renderBar(pct) { return `<div style="display:flex;align-items:center;"><span class="metric-value">${pct}%</span><div class="bar-bg"><div class="bar-fill ${barClass(pct)}" style="width:${pct}%"></div></div></div>`; }

function renderMetrics(data) {
  let html = '';
  if (data.cpu !== undefined) html += renderRow('CPU', renderBar(data.cpu));
  if (data.ram) html += renderRow('RAM', renderBar(data.ram.usedPct) + `<span style="font-size:10px;color:#888;margin-left:4px;">${data.ram.usedGb}/${data.ram.totalGb}GB</span>`);
  if (data.battery) { const charging = data.battery.charging ? ' ⚡' : ''; html += renderRow('Battery', `<span class="metric-value">${data.battery.percent}%${charging}</span>`); }
  if (data.activeApp !== undefined) html += renderRow('Active App', `<span class="metric-value">${data.activeApp}</span>`);
  if (data.network) html += renderRow('Network', `<span class="metric-value">↓${data.network.downKbps} ↑${data.network.upKbps} KB/s</span>`);
  if (data.disk) html += renderRow('Disk', renderBar(data.disk.usedPct));
  if (data.gpu !== undefined) html += renderRow('GPU', `<span class="metric-value">${data.gpu === 'N/A' ? 'N/A' : data.gpu + '%'}</span>`);
  metricsEl.innerHTML = html;
  if (data.cpu !== undefined) window.api.setTrayTitle(`${data.cpu}%`);
  else if (data.battery) window.api.setTrayTitle(`${data.battery.percent}%`);
  if (data.breakReminder) {
    if (data.breakReminder.dueForBreak) { breakBanner.classList.remove('hidden'); breakText.textContent = `${data.breakReminder.minutesSinceBreak} min since your last break`; }
    else { breakBanner.classList.add('hidden'); }
  } else { breakBanner.classList.add('hidden'); }
}

function renderSwitcher() {
  switcherEl.innerHTML = sessions.map(s => `<div class="session-btn ${s.key === activeSession ? 'active' : ''}" data-key="${s.key}">${s.label}</div>`).join('');
  switcherEl.querySelectorAll('.session-btn').forEach(btn => {
    btn.addEventListener('click', () => { activeSession = btn.dataset.key; window.api.switchSession(activeSession); renderSwitcher(); });
  });
}

async function init() {
  sessions = await window.api.getSessions();
  activeSession = await window.api.getCurrentSession();
  renderSwitcher();
  window.api.onMetrics((data) => { renderMetrics(data); });
  breakBtn.addEventListener('click', () => { window.api.resetBreakTimer(); breakBanner.classList.add('hidden'); });
}

init();
