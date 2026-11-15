/* Voccola Gym Log – Hüft-Beweglichkeit: Export-Text + "nur Neues senden" (v1.8.4) + Tagesplan/Hexenschuss-Pause (v1.8.6, v1.8.7 +rumpfrot). Reine Logik, getestet in tests/mob.test.js.
   rep = { head, blocks: [{ n, dn, tot, anyDone, items: [{ id, line }] }], note }
   sent (pro Tag) = { n: Anzahl Meldungen, ex: { id: gesendete Zeile }, blocks: [Blocknamen], note } */
(function (root, factory) {
  const C = factory();
  if (typeof module === 'object' && module.exports) module.exports = C; else root.MOBCORE = C;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const isNew = (it, sent) => !sent || !sent.ex || sent.ex[it.id] !== it.line;
  const strip = n => n.replace(/^[^\p{L}\p{N}]+/u, ''); // Emoji vorn weg: "☀️ Morgen-Routine" → "Morgen-Routine"

  /* Kompletter Tagesbericht – Format exakt wie bisher */
  function fullText(rep) {
    const out = [rep.head];
    const bd = rep.blocks.filter(b => b.anyDone).map(b => `${b.n} (${b.dn}/${b.tot})`);
    out.push('Blöcke: ' + (bd.join(', ') || '–'));
    for (const b of rep.blocks) { if (!b.items.length) continue; out.push('', b.n); b.items.forEach(it => out.push(it.line)); }
    out.push('', 'Notiz: ' + (rep.note || '–'));
    return out.join('\n');
  }

  /* Nur Neues seit der letzten Meldung des Tages. Erste Meldung des Tages = kompletter Bericht (unverändertes Format). */
  function diffReport(rep, sent) {
    if (!sent || !sent.n) return { text: fullText(rep), empty: false, follow: false, newBlocks: rep.blocks.filter(b => b.items.length).map(b => b.n) };
    const nb = rep.blocks.map(b => Object.assign({}, b, { items: b.items.filter(it => isNew(it, sent)) })).filter(b => b.items.length);
    const note = (rep.note || '').trim(); const noteNew = !!note && note !== (sent.note || '').trim();
    if (!nb.length && !noteNew) return { text: '', empty: true, follow: true, newBlocks: [] };
    const out = [rep.head + ' (Nachtrag)'];
    const bd = nb.filter(b => b.anyDone).map(b => `${b.n} (${b.dn}/${b.tot})`);
    out.push('Blöcke: ' + (bd.join(', ') || '–'));
    const old = (sent.blocks || []).filter(n => !nb.some(b => b.n === n));
    if (old.length) out.push('Schon gemeldet: ' + old.map(strip).join(', '));
    for (const b of nb) { out.push('', b.n); b.items.forEach(it => out.push(it.line)); }
    if (noteNew) out.push('', 'Notiz: ' + note);
    return { text: out.join('\n'), empty: false, follow: true, newBlocks: nb.map(b => b.n) };
  }

  /* Nach erfolgreichem Senden: alles Aktuelle als gemeldet merken */
  function markSent(rep, sent) {
    const s = { n: ((sent && sent.n) || 0) + 1, ex: Object.assign({}, (sent && sent.ex) || {}), blocks: [...((sent && sent.blocks) || [])], note: (rep.note || '').trim(), ts: Date.now() };
    for (const b of rep.blocks) { if (!b.items.length) continue; b.items.forEach(it => { s.ex[it.id] = it.line; }); if (!s.blocks.includes(b.n)) s.blocks.push(b.n); }
    return s;
  }

  /* Alte Tage aufräumen (nur die letzten `keep` Tage behalten) */
  function prune(all, keep = 14) { const ks = Object.keys(all || {}).sort(); const o = {}; ks.slice(-keep).forEach(k => { o[k] = all[k]; }); return o; }

  /* v1.8.6: Tagesplan + datumsbasierte Pausen (Hexenschuss). Schlüssel 'YYYY-MM-DD', bis einschließlich `until` pausiert. */
  const PAUSES = [{ until: '2026-11-17', why: 'Hexenschuss', label: 'pausiert bis nach Di 17.11. (Hexenschuss)',
    ids: ['wgs', 'rolle', 'sphinx', 'sphinxrot', 'halfhero', 'turtle', 'rollbecken', 'couch', 'duoball', 'rumpfrot'] }];
  function pausedIds(key) { const o = new Set(); PAUSES.forEach(p => { if (key <= p.until) p.ids.forEach(i => o.add(i)); }); return o; }
  function pauseInfo(id, key) { return PAUSES.find(p => key <= p.until && p.ids.includes(id)) || null; }
  const dayNum = key => { const [y, m, d] = key.split('-').map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 864e5); };
  /* pool = [{id, core}] in Anzeige-Reihenfolge; Kern täglich, aus dem Rest k pro Tag deterministisch nach Datum. Pausierte fallen ganz raus. */
  function planIds(pool, k, key) { const pz = pausedIds(key); const P = pool.filter(e => !pz.has(e.id)); const rot = P.filter(e => !e.core); const m = rot.length;
    if (!m || k >= m) return P.map(e => e.id); const s0 = (dayNum(key) * k) % m; const pick = new Set(Array.from({ length: k }, (_, i) => rot[(s0 + i) % m].id));
    return P.filter(e => e.core || pick.has(e.id)).map(e => e.id); }

  return { fullText, diffReport, markSent, prune, PAUSES, pausedIds, pauseInfo, dayNum, planIds };
});
