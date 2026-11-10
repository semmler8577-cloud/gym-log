/* Voccola Gym Log – Ernährung: reine Rechenlogik + Start-Datenbank (v1.8.0).
   Regeln: kcal immer vom Etikett (nie aus Makros neu berechnet). Gramm-Eingabe = Wert pro 100 g × Menge / 100.
   Portions-Eingabe = Etikettwert pro Portion (falls angegeben), sonst pro 100 g × Portionsgewicht. Gerundet wird nur in der Anzeige. */
(function (root, factory) {
  const C = factory();
  if (typeof module === 'object' && module.exports) module.exports = C; else root.NUTCORE = C;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const KEYS = ['kcal', 'p', 'c', 'f'];
  const r2 = x => Math.round((x + (x >= 0 ? 1 : -1) * 1e-9) * 100) / 100;
  const rK = x => (x == null || isNaN(x)) ? null : Math.round(x + 1e-9);            // kcal: ganze Zahl
  const rM = x => (x == null || isNaN(x)) ? null : Math.round(x * 10 + 1e-9) / 10;  // Makros: 1 Nachkommastelle
  const zero = () => ({ kcal: 0, p: 0, c: 0, f: 0, inc: false });

  /* Quellen: foto = Packungsfoto von Markus, hersteller = Hersteller/Händler-Etikett, db = Datenbank (fddb/OFF),
     mix = teils Etikett, teils ergänzt, std = Standardwert, schaetzung = geschätzt, eigen = selbst eingetragen */
  const SRC = {
    foto: { l: 'Packungsfoto', ic: '📷', ok: true }, hersteller: { l: 'Hersteller-Etikett', ic: '🏷', ok: true },
    eigen: { l: 'Eigene Eingabe (Etikett)', ic: '✎', ok: true }, db: { l: 'Datenbank (fddb/OFF)', ic: '🗂', ok: true },
    mix: { l: 'Etikett + ergänzt', ic: '◐', ok: false }, std: { l: 'Standardwert', ic: '≈', ok: false },
    schaetzung: { l: 'Schätzung', ic: '≈', ok: false }, frei: { l: 'Freie Eingabe', ic: '✎', ok: true }
  };

  /* Menge eines Produkts → Nährwerte. mode 'g' (Gramm/ml) oder 'p' (Portion pi, amount = Anzahl) */
  function calcItem(food, mode, amount, pi) {
    const out = zero(); const a = Number(amount);
    if (!food || !(a > 0) || !isFinite(a)) return Object.assign(out, { ok: false });
    let base, mul;
    if (mode === 'p') {
      const por = (food.portions || [])[pi || 0]; if (!por) return Object.assign(out, { ok: false });
      if (por.v) { base = por.v; mul = a; }
      else if (food.per100 && por.g > 0) { base = food.per100; mul = por.g * a / 100; }
      else return Object.assign(out, { ok: false });
    } else {
      if (!food.per100 || food.per100.kcal == null) return Object.assign(out, { ok: false });
      base = food.per100; mul = a / 100;
    }
    for (const k of KEYS) { const v = base[k]; if (v == null || isNaN(v)) { out.inc = true; out[k] = 0; } else out[k] = r2(v * mul); }
    out.ok = true; return out;
  }
  function gramsOf(food, mode, amount, pi) {
    if (mode !== 'p') return Number(amount) || 0;
    const por = (food.portions || [])[pi || 0]; return por && por.g ? por.g * (Number(amount) || 0) : null;
  }
  const nfmt = (n, d) => { const v = Math.round(n * Math.pow(10, d)) / Math.pow(10, d); return String(v).replace('.', ','); };
  function amountText(food, mode, amount, pi) {
    const u = food && food.unit === 'ml' ? 'ml' : 'g';
    if (mode !== 'p') return nfmt(Number(amount), 1) + ' ' + u;
    const por = (food.portions || [])[pi || 0] || { n: 'Portion' };
    const g = gramsOf(food, mode, amount, pi);
    return nfmt(Number(amount), 2) + ' × ' + por.n + (g ? ' (' + nfmt(g, 1) + ' ' + u + ')' : '');
  }
  function add(t, v) { for (const k of KEYS) t[k] = r2(t[k] + (v[k] || 0)); if (v.inc) t.inc = true; return t; }
  function scale(v, f) { const o = zero(); for (const k of KEYS) o[k] = r2((v[k] || 0) * f); o.inc = !!v.inc; return o; }

  /* Kombi (gespeicherte Mahlzeit) × Faktor */
  function calcCombo(combo, foodsById, factor) {
    const fac = factor == null ? 1 : Number(factor); const t = zero(); const items = []; const missing = [];
    if (!(fac > 0)) return Object.assign(t, { ok: false, items, missing });
    for (const it of (combo.items || [])) {
      const food = foodsById[it.foodId];
      if (!food) { missing.push(it.foodId); t.inc = true; continue; }
      const v = calcItem(food, it.mode, it.amount * fac, it.pi);
      if (!v.ok) { missing.push(it.foodId); t.inc = true; continue; }
      add(t, v); items.push({ foodId: food.id, name: food.name, text: amountText(food, it.mode, it.amount * fac, it.pi), src: food.src, kcal: v.kcal, p: v.p, c: v.c, f: v.f, inc: v.inc });
    }
    return Object.assign(t, { ok: items.length > 0 && !missing.length, items, missing });
  }
  function sumEntries(entries) { const t = zero(); for (const e of entries || []) add(t, e); return t; }

  /* Plausibilitäts-Check eines Etiketts (nur Warnung, kcal wird NICHT ersetzt) */
  function atwater(v) { return 4 * (v.p || 0) + 4 * (v.c || 0) + 9 * (v.f || 0); }
  function labelCheck(v) {
    if (!v || !(v.kcal > 0) || v.p == null || v.c == null || v.f == null) return { ok: true, dev: 0 };
    const est = atwater(v); const dev = (v.kcal - est) / v.kcal;
    return { ok: Math.abs(dev) <= 0.2 || Math.abs(v.kcal - est) < 15, dev, est: r2(est) };
  }
  function defaultMeal(h) { return h < 11 ? 'f' : h < 15 ? 'm' : h < 17 ? 's' : h < 22 ? 'a' : 's'; }
  const MEALS = [['f', 'Frühstück', '☀️'], ['m', 'Mittagessen', '🍽'], ['a', 'Abendessen', '🌙'], ['s', 'Snacks', '🍫']];
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]+/g, ' ').trim();
  function matches(name, q) { const n = norm(name), w = norm(q).split(/\s+/).filter(Boolean); return w.every(x => n.includes(x)); }
  /* Häufig/zuletzt genutzt: Punkte = Anzahl + Bonus für Aktualität */
  function rankRecent(entries, today, days) {
    const lim = days || 30; const t0 = new Date(today + 'T12:00:00').getTime(); const map = new Map();
    for (const e of entries || []) {
      if (e.kind === 'free') continue;
      const age = (t0 - new Date(e.date + 'T12:00:00').getTime()) / 86400000; if (age < 0 || age > lim) continue;
      const key = e.kind === 'combo' ? 'c:' + e.comboId : 'f:' + e.foodId;
      const cur = map.get(key) || { key, n: 0, score: 0, last: 0, e };
      cur.n++; cur.score += 1 + (lim - age) / lim; if (e.ts > cur.last) { cur.last = e.ts; cur.e = e; } map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.score - a.score || b.last - a.last);
  }
  const DEF_TARGETS = { kcal: 2800, p: 170, c: 350, f: 80 };

  /* ---------- Start-Datenbank (aus /workspace/food-db.md + Packungsfotos) ---------- */
  const FOODS = [
    { id: 'edeka-pb', name: 'EDEKA Herzstücke Proteinbrötchen', unit: 'g', per100: { kcal: 275, p: 21, c: 25, f: 8.6 }, portions: [{ n: 'Brötchen', g: 75, v: { kcal: 206, p: 15.8, c: 18.8, f: 6.5 } }], src: 'db', fav: true,
      note: 'fddb + Fitatu (EAN 4311501122495), 4 × 75 g. Open Food Facts nennt 28 g KH/100 g – bei Abweichung gilt deine Packung.' },
    { id: 'aldi-pb', name: 'ALDI Protein Brötchen', unit: 'g', per100: { kcal: 275, p: 21, c: 25, f: 8.6 }, portions: [{ n: 'Brötchen', g: 75, v: { kcal: 209, p: 15.8, c: 18.8, f: 6.5 } }], src: 'foto',
      note: 'Packungsfoto 10.11.2026 (Leinsamen/Sonnenblumenkerne, 4 × 75 g). 1 Brötchen laut Packung 209 kcal.' },
    { id: 'leerdammer-pro', name: 'Leerdammer Protein (Feine Scheiben)', unit: 'g', per100: { kcal: 262, p: 29.5, c: 0.1, f: 16 }, portions: [{ n: 'Scheibe', g: 10 }, { n: 'Portion (2 Scheiben)', g: 20 }], src: 'hersteller', fav: true,
      note: 'leerdammer.de, 100-g-Packung = 10 Scheiben à 10 g.' },
    { id: 'lidl-mortadella-skyr', name: 'Lidl Hähnchen-Mortadella mit Skyr', unit: 'g', per100: { kcal: 112, p: 14.7, c: 2, f: 5 }, portions: [{ n: 'Packung', g: 80 }], src: 'foto',
      note: 'Packungsfoto 10.11.2026, Packung 80 g = 90 kcal / 11,8 g P.' },
    { id: 'dulano-mortadella', name: 'Dulano Hähnchen-Mortadella High Protein', unit: 'g', per100: { kcal: 102, p: 15, c: 1, f: 3 }, portions: [{ n: 'halbe Packung', g: 40 }], src: 'mix',
      note: 'kcal/P/F aus deiner Angabe (Okt. 2026); KH (1 g) geschätzt – Packungsfoto ergänzen.' },
    { id: 'peak-ricepudding', name: 'Peak Rice Pudding (Reisgrieß)', unit: 'g', per100: { kcal: 382, p: 7.6, c: 84.2, f: 0.7 }, portions: [{ n: 'Portion', g: 60 }], src: 'foto',
      note: 'Packungsfoto 10.11.2026 (= peak.ag). Zucker 0,4 g, Ballaststoffe 1,5 g pro 100 g.' },
    { id: 'peak-hybrid', name: 'Peak Hybrid Protein (Cerealien-Milch)', unit: 'g', per100: { kcal: 350, p: 80, c: 5.2, f: 1.2 }, portions: [{ n: 'Shake', g: 30, v: { kcal: 105, p: 24, c: 1.6, f: 0.4 } }], src: 'mix', fav: true,
      note: 'kcal/Eiweiß vom Etikett (30 g = 105 kcal / 24 g P, Lieferung 28.10.2026). KH/Fett aus der Peak-Nährwerttabelle (Vanille, Händler) ergänzt.' },
    { id: 'peak-hybrid-ms', name: 'Peak Hybrid Protein (Milchschnitte)', unit: 'g', per100: { kcal: 346.7, p: 76.7, c: 5.2, f: 1.2 }, portions: [{ n: 'Shake', g: 30, v: { kcal: 104, p: 23, c: 1.6, f: 0.4 } }], src: 'mix',
      note: 'kcal/Eiweiß vom Etikett (30 g = 104 kcal / 23 g P, Lieferung 28.10.2026). KH/Fett aus Peak-Tabelle ergänzt.' },
    { id: 'peak-clear', name: 'Peak Clear Protein', unit: 'g', per100: { kcal: 332, p: 81, c: 1.1, f: 0.3 }, portions: [{ n: 'Shake', g: 30, v: { kcal: 99, p: 24, c: 0.3, f: 0.1 } }], src: 'hersteller',
      note: 'Etikett deiner Lieferung: 30 g = 99 kcal / 24 g P (Wildberry-Tabelle 100 kcal). Pro 100 g laut Hersteller-Tabelle.' },
    { id: 'esn-isoclear', name: 'ESN Isoclear', unit: 'g', per100: { kcal: 346.7, p: 80, c: 4, f: 0 }, portions: [{ n: 'Shake', g: 30, v: { kcal: 104, p: 24, c: 1.2, f: 0 } }], src: 'hersteller',
      note: 'Händler-Etikett Fresh Cherry; je nach Sorte 102–104 kcal / 23–25 g P pro 30 g.' },
    { id: 'milch-15', name: 'Milch 1,5 % Fett', unit: 'ml', per100: { kcal: 47, p: 3.4, c: 4.9, f: 1.5 }, portions: [{ n: 'Glas', g: 200 }, { n: 'Shake-Menge', g: 300 }], src: 'std', fav: true,
      note: 'Typischer Etikettwert fettarme Milch 1,5 % (pro 100 ml). Mit deiner Packung abgleichen.' },
    { id: 'lidl-ei-wrap', name: 'Lidl Ei-Protein-Wrap', unit: 'g', per100: null, portions: [{ n: 'Wrap', g: null, v: { kcal: 181, p: 11, c: null, f: null } }], src: 'mix',
      note: 'kcal/Eiweiß pro Wrap aus deiner Packung (Nov. 2026). KH/Fett fehlen noch – Packungsfoto schicken oder hier eintragen.' }
  ];
  const COMBOS = [
    { id: 'std-broetchen', name: 'Standard-Brötchen', icon: '🥯', items: [{ foodId: 'edeka-pb', mode: 'p', pi: 0, amount: 1 }, { foodId: 'leerdammer-pro', mode: 'p', pi: 0, amount: 2 }] },
    { id: 'std-fruehstueck', name: 'Standard-Frühstück', icon: '☀️', items: [{ foodId: 'milch-15', mode: 'g', amount: 300 }, { foodId: 'peak-hybrid', mode: 'p', pi: 0, amount: 1 },
      { foodId: 'edeka-pb', mode: 'p', pi: 0, amount: 2 }, { foodId: 'leerdammer-pro', mode: 'p', pi: 0, amount: 4 }] },
    { id: 'reispudding', name: 'Reispudding', icon: '🍚', items: [{ foodId: 'milch-15', mode: 'g', amount: 280 }, { foodId: 'peak-hybrid', mode: 'p', pi: 0, amount: 1 }, { foodId: 'peak-ricepudding', mode: 'g', amount: 60 }] }
  ];
  const SEED_VERSION = 1;
  return { KEYS, r2, rK, rM, SRC, calcItem, gramsOf, amountText, add, scale, calcCombo, sumEntries, atwater, labelCheck, defaultMeal, MEALS, norm, matches, rankRecent, DEF_TARGETS, FOODS, COMBOS, SEED_VERSION };
});
