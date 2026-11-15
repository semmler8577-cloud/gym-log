/* Voccola Gym Log – Mindset (v1.8.5). Reine Logik, getestet in tests/mind.test.js.
   Daten (localStorage 'vgl-mind'): { days: { 'YYYY-MM-DD': { k: bool (Kopf-Übung), s: bool (Souverän kommunizieren), note: '', ts } } } */
(function (root, factory) {
  const C = factory();
  if (typeof module === 'object' && module.exports) module.exports = C; else root.MINDCORE = C;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const key = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const shift = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return key(d); };

  function norm(data) { const o = data && typeof data === 'object' ? data : {}; return Object.assign({}, o, { days: o.days && typeof o.days === 'object' ? o.days : {} }); }
  function get(data, k) { const x = norm(data).days[k] || {}; return { k: !!x.k, s: !!x.s, note: x.note || '' }; }
  /* Feld setzen; leere Tage werden entfernt, alles andere bleibt unberührt */
  function set(data, k, patch, now = Date.now()) {
    const d = norm(data); const days = Object.assign({}, d.days);
    const x = Object.assign({}, get(d, k), patch); x.note = String(x.note || '').slice(0, 200);
    if (!x.k && !x.s && !x.note.trim()) delete days[k]; else days[k] = { k: x.k, s: x.s, note: x.note, ts: now };
    return Object.assign({}, d, { days });
  }
  const level = (data, k) => { const x = get(data, k); return (x.k ? 1 : 0) + (x.s ? 1 : 0); }; // 0 / 1 / 2
  /* Serie = Tage in Folge mit beiden Haken; ist heute noch offen, zählt ab gestern */
  function streak(data, today) { let k = today, n = 0; if (level(data, k) < 2) k = shift(k, -1); while (level(data, k) === 2) { n++; k = shift(k, -1); } return n; }
  function last7(data, today) { const a = []; for (let i = 6; i >= 0; i--) { const k = shift(today, -i); a.push({ k, lv: level(data, k) }); } return a; }
  return { key, parse, shift, norm, get, set, level, streak, last7 };
});
