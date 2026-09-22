// Passive, session-local estimate. Never writes ship cond or sends game requests.
(function(root) {
 'use strict';
 const INTERVAL = 15 * 60 * 1000;
 const ESTIMATE_MARGIN = 30 * 1000;
 function estimate(view, now) {
  // One pending application only: elapsed time alone does not prove repeated feeding.
  const ready = view.startedAt != null && now >= view.startedAt + view.interval + ESTIMATE_MARGIN;
  const needed = view.fleets.reduce((n, f) => n + (f.reasons.length ? 0 : f.targets.filter(t => !t.reason).length), 0);
  const enoughFuel = Number.isFinite(view.fuel) && view.fuel >= needed;
  return view.fleets.map(f => ({...f, targets: f.targets.map(t => {
   const pending = ready && enoughFuel && !f.reasons.length && !t.reason;
   return {...t, estimatedCond: pending ? Math.min(54, t.cond + f.gain) : t.cond, pending};
  })}));
 }
 const isNozaki = ship => !!ship && /^(野埼|野崎)(改)?$/.test(ship.name);
 function fleets(state) {
  return state.decks.filter(deck => deck.ships.slice(0, 2).some(isNozaki));
 }
 function inspect(deck) {
  const supplier = deck.ships.slice(0, 2).find(isNozaki);
  if (!supplier) return null;
  const reasons = [];
  if (deck.mission == null) reasons.push('遠征状態不明');
  else if (deck.mission) reasons.push('遠征中');
  if (supplier.docked == null) reasons.push('入渠状態不明');
  else if (supplier.docked) reasons.push('野埼が入渠中');
  if (!(supplier.fuelMax > 0 && supplier.ammoMax > 0) || supplier.fuel == null || supplier.ammo == null) reasons.push('補給状態不明');
  else if (supplier.fuel < supplier.fuelMax || supplier.ammo < supplier.ammoMax) reasons.push('野埼が未補給');
  if (!(supplier.maxHp > 0) || supplier.hp == null) reasons.push('損傷状態不明');
  else if (supplier.hp / supplier.maxHp <= 0.75) reasons.push('野埼が小破以上');
  if (supplier.cond == null) reasons.push('cond不明');
  else if (supplier.cond < 30) reasons.push('野埼cond30未満');
  const gain = supplier.name.endsWith('改') ? 3 : 2;
  const targets = deck.ships.filter(s => s && !isNozaki(s)).map(s => ({
   id: s.id, name: s.name, cond: s.cond,
   reason: s.docked == null ? '入渠状態不明' : s.docked ? '入渠中' : s.cond == null ? 'cond不明' : s.cond >= 54 ? '上限到達' : '',
   next: s.cond == null ? null : Math.max(s.cond, Math.min(54, s.cond + gain))
  }));
  return {id: deck.id, supplier: supplier.name, gain, reasons, targets};
 }
 class Timer {
  constructor() { this.startedAt = null; this.basis = '開始時刻不明（通常の編成変更を観測すると開始）'; }
  formation(before, after, shipId, now, changedDeckId) {
   if (Number(shipId) === -2) return; // bulk removal preserves the shared clock
   const affected = after.decks.filter(d => {
    // Successful change API identifies the edited deck even if another update
    // has already made the cached before/after ship arrays equal.
    if (changedDeckId != null && String(d.id) === String(changedDeckId)) return true;
    const old = before.decks.find(b => b.id === d.id);
    return !old || JSON.stringify(old.ships.map(s => s && s.id)) !== JSON.stringify(d.ships.map(s => s && s.id));
   });
   if (fleets({decks: affected}).length) {
    this.startedAt = now;
    this.basis = '通常の編成変更から推定';
   }
  }
  port(before, after, now) {
   // A rise above natural recovery's cap is evidence, not a server timer field.
   // Do not reset merely because 15 minutes passed, or because a port was opened.
   if (this.startedAt != null && now - this.startedAt < INTERVAL) return;
   const oldShips = new Map(before.decks.flatMap(d => d.ships).filter(Boolean).map(s => [s.id, s]));
   const observed = fleets(after).map(inspect).some(f => !f.reasons.length && f.targets.some(t => {
    const old = oldShips.get(t.id);
    return (!t.reason || t.reason === '上限到達') && old && old.cond != null
     && t.cond > 49 && t.cond <= 54 && t.cond > old.cond
     && t.cond <= Math.min(54, Math.max(49, old.cond) + f.gain);
   }));
   if (observed) { this.startedAt = now; this.basis = '母港でcond上昇を観測（次回時刻は推定）'; }
  }
  view(state) { return {startedAt: this.startedAt, basis: this.basis, interval: INTERVAL, fuel: state.fuel, fleets: fleets(state).map(inspect)}; }
 }
 root.NozakiTimer = {Timer, inspect, estimate, INTERVAL, ESTIMATE_MARGIN};
 if (typeof module !== 'undefined') module.exports = root.NozakiTimer;
})(globalThis);
