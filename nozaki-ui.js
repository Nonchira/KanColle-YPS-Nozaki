// Dedicated live panel; updates never enter or interrupt YPS history.
const nozakiPanel = document.createElement('details');
nozakiPanel.className = 'yps-body yps-nozaki';
nozakiPanel.hidden = true;
const nozakiSummary = document.createElement('summary');
const nozakiHeading = document.createElement('h3');
nozakiHeading.className = 'markdownH3';
nozakiHeading.style.setProperty('display', 'inline');
nozakiHeading.style.setProperty('margin', '0');
nozakiHeading.style.setProperty('font-weight', '700', 'important');
nozakiHeading.style.setProperty('color', 'inherit', 'important');
nozakiSummary.style.setProperty('font-weight', '700', 'important');
nozakiSummary.appendChild(nozakiHeading);
const nozakiDetails = document.createElement('div');
nozakiDetails.className = 'yps-nozaki-details';
nozakiPanel.appendChild(nozakiSummary);
nozakiPanel.appendChild(nozakiDetails);
nozakiPanel.addEventListener('toggle', layoutNozaki);
document.body.insertBefore(nozakiPanel, div);
let nozakiView = null;
let nozakiReceived = 0;
let nozakiAtPort = true;
function renderNozaki() {
 const v = nozakiView;
 nozakiPanel.hidden = !v || !nozakiAtPort;
 if (nozakiPanel.hidden) { layoutNozaki(); return; }
 const fleets = v ? NozakiTimer.estimate(v, Date.now()) : [];
 const targets = fleets.flatMap(f => f.targets);
 if (!v || !fleets.length || !targets.length) {
  nozakiSummary.className = '';
  nozakiSummary.style.setProperty('color', 'inherit', 'important');
  const status = !v ? '対象確認待ち' : !fleets.length ? '対象艦隊なし' : '給糧対象艦なし';
  nozakiHeading.textContent = '野崎タイマー: 経過 -:--, ' + status;
  nozakiSummary.title = !v ? '艦隊データの受信を待っています。' : !fleets.length
   ? '旗艦・2番艦に野埼または野埼改がいる艦隊はありません。'
   : '野埼は配置されていますが、同じ艦隊に給糧対象艦がいません。';
  nozakiDetails.textContent = status;
  layoutNozaki();
  return;
 }
 const elapsed = v.startedAt == null ? null : Math.max(0, Math.floor((Date.now() - v.startedAt) / 1000));
 const time = elapsed == null ? '不明' : Math.floor(elapsed / 60) + ':' + String(elapsed % 60).padStart(2, '0');
 // Use the lowest companion cond so one high-cond ship cannot hide a tired ship.
 const lowest = !targets.length || targets.some(t => t.estimatedCond == null)
  ? '不明' : Math.min(54, ...targets.map(t => t.estimatedCond));
 nozakiSummary.className = lowest === 54 ? 'yps-nozaki-max' : '';
 nozakiSummary.style.setProperty('color', lowest === 54 ? 'red' : 'inherit', 'important');
 nozakiHeading.textContent = '野崎タイマー: 経過 ' + time + ', 推定cond ' + lowest + '（最大54）';
 nozakiSummary.title = '全対象艦の最低推定cond（54で表示上限）。15分＋30秒で給糧1回分のみ加算。反映には母港移動が必要です。'
  + (Date.now() - nozakiReceived > 10000 ? ' 通信監視が途切れています。最終受信値に基づく推定です。' : '');
 nozakiDetails.replaceChildren();
 for (const f of fleets) {
  const fleetLabel = document.createElement('div');
  fleetLabel.className = 'yps-nozaki-fleet';
  fleetLabel.textContent = '第' + f.id + '艦隊（' + f.supplier + '）';
  nozakiDetails.appendChild(fleetLabel);
  const table = document.createElement('table');
  table.className = 'yps-nozaki-table';
  const head = document.createElement('thead');
  const header = document.createElement('tr');
  for (const label of ['推定cond', '艦名', '']) {
   const cell = document.createElement('th');
   cell.scope = 'col';
   cell.textContent = label;
   if (!label) cell.setAttribute('aria-label', '取得値と状態');
   header.appendChild(cell);
  }
  head.appendChild(header);
  table.appendChild(head);
  const body = document.createElement('tbody');
  for (const t of f.targets) {
   const row = document.createElement('tr');
   for (const value of [t.estimatedCond == null ? '不明' : t.estimatedCond, t.name,
    '（取得 ' + (t.cond == null ? '不明' : t.cond) + (t.pending ? '・母港反映待ち' : t.reason ? '・' + t.reason : '') + '）']) {
    const cell = document.createElement('td');
    cell.textContent = String(value);
    row.appendChild(cell);
   }
   body.appendChild(row);
  }
  table.appendChild(body);
  nozakiDetails.appendChild(table);
  if (f.reasons.length) {
   const status = document.createElement('div');
   status.textContent = f.reasons.join('／');
   nozakiDetails.appendChild(status);
  }
 }
 layoutNozaki();
}
function layoutNozaki() {
 const top = 64 + (nozakiPanel.hidden ? 0 : nozakiPanel.getBoundingClientRect().height + 8);
 div.style.top = hst.style.top = top + 'px';
}
new ResizeObserver(layoutNozaki).observe(nozakiPanel);
chrome.runtime.onMessage.addListener(req => {
 if (!req.nozakiTimer) return;
 nozakiView = req.nozakiTimer;
 nozakiAtPort = req.nozakiAtPort !== false;
 nozakiReceived = Date.now();
 renderNozaki();
});
setInterval(renderNozaki, 1000);
renderNozaki();
