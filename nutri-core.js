/* Voccola Gym Log – Ernährung: reine Rechenlogik + Start-Datenbank (v2.1.1).
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
    schaetzung: { l: 'Schätzung', ic: '≈', ok: false }, off: { l: 'Open Food Facts (Barcode)', ic: '▥', ok: true }, frei: { l: 'Freie Eingabe', ic: '✎', ok: true }
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
  const DEF_TARGETS = { kcal: 3000, p: 165, c: 405, f: 80 }; // ab 28.11.2026 (Lean Bulk, ~79 kg)

  /* ---------- Start-Datenbank (aus /workspace/food-db.md + Packungsfotos) ---------- */
  /* Skyr-Sauce: aus einem Skyr-Produkt der Datenbank (pro 100 g) + Zutaten berechnen, sonst feste Werte */
  const SAUCE_EXTRA = { kcal: 8, p: 0.4, c: 1.2, f: 0.2 }; // 1 TL Tomatenmark + 1 TL Senf + Knoblauch + Gewürze (Erythrit 0 kcal)
  const SAUCE_FIX = { kcal: 60, p: 11, c: 5, f: 0.5 };
  function skyrSauce(skyrPer100) {
    const s = skyrPer100; if (!s || !(s.kcal > 0) || s.p == null) return Object.assign({}, SAUCE_FIX);
    const o = {}; for (const k of KEYS) o[k] = r2((s[k] || 0) + SAUCE_EXTRA[k]); return o;
  }
  const SKYR_SAUCE = skyrSauce(null);
  const FOODS = [
    /* --- Brot & Brötchen (Etiketten von Markus, Stand 26.11.2026) --- */
    { id: 'edeka-pb', name: 'EDEKA Herzstücke Proteinbrötchen', unit: 'g', per100: { kcal: 275, p: 21, c: 25, f: 8.6 }, portions: [{ n: 'Brötchen', g: 75, v: { kcal: 206, p: 15.8, c: 18.8, f: 6.5 } }], src: 'foto', fav: true,
      note: 'Etikett: 1 Brötchen 75 g = 206 kcal / 15,8 g P / 18,8 g KH / 6,5 g F. 2 Brötchen = 412 kcal.' },
    { id: 'aldi-pb', name: 'ALDI Protein Brötchen', unit: 'g', per100: { kcal: 275, p: 21, c: 25, f: 8.6 }, portions: [{ n: 'Brötchen', g: 75, v: { kcal: 209, p: 15.8, c: 18.8, f: 6.5 } }], src: 'foto',
      note: 'Packungsfoto 10.11.2026 (Leinsamen/Sonnenblumenkerne, 4 × 75 g). 1 Brötchen laut Packung 209 kcal (pro 100 g 275 kcal).' },
    { id: 'muehlenkraft-pb', name: 'Mühlenkraft Protein-Brötchen', unit: 'g', per100: null, portions: [{ n: 'Brötchen', g: null, v: { kcal: 170, p: 16, c: 7.8, f: 7.1 } }], src: 'foto',
      note: 'Etikett: 1 Brötchen = 170 kcal / 16 g P / 7,8 g KH / 7,1 g F.' },
    { id: 'muehlenkraft-hafer', name: 'Mühlenkraft Hafer-Brötchen', unit: 'g', per100: { kcal: 246.2, p: 21.5, c: 15.4, f: null }, portions: [{ n: 'Brötchen', g: 65, v: { kcal: 160, p: 14, c: 10, f: null } }], src: 'mix',
      note: 'Etikett: 1 Brötchen 65 g = 160 kcal / 14 g P / 10 g KH. Fett fehlt.' },
    { id: 'steiner-pb', name: 'Steiner Protein-Brötchen', unit: 'g', per100: { kcal: 208, p: 23, c: 2.8, f: null }, portions: [], src: 'mix',
      note: 'Etikett pro 100 g: 208 kcal / 23 g P / 2,8 g KH. Fett und Brötchengewicht fehlen – in Gramm eintragen.' },
    { id: 'mestemacher-pb', name: 'Mestemacher Proteinbrot', unit: 'g', per100: null, portions: [{ n: 'Scheibe', g: null, v: { kcal: 131, p: 10.5, c: 5.7, f: null } }], src: 'mix',
      note: 'Etikett pro Scheibe: 131 kcal / 10,5 g P / 5,7 g KH. Fett fehlt.' },
    { id: 'harry-eiweiss', name: 'Harry Eiweiss Sandwich (Toast)', unit: 'g', per100: { kcal: 266, p: 15, c: 43, f: 2.9 }, portions: [{ n: 'Scheibe', g: 37.5, v: { kcal: 100, p: 5.6, c: 16, f: 1.1 } }], src: 'foto',
      note: 'Etikett 26.11.2026: pro 100 g 266 kcal / 15 g P / 43 g KH / 2,9 g F; 1 Scheibe 37,5 g = 100 kcal / 5,6 g P / 16 g KH.' },
    { id: 'lidl-ei-wrap', name: 'Lidl Ei-Protein-Wrap (High Protein Wrap)', unit: 'g', per100: { kcal: 293, p: 18, c: null, f: 7 }, portions: [{ n: 'Wrap', g: 62, v: { kcal: 181, p: 11, c: null, f: 4.3 } }], src: 'mix',
      note: 'Etikett 26.11.2026: 1 Wrap 62 g = 181 kcal / 11 g P; pro 100 g 293 kcal / 18 g P / 7 g F. KH nicht abgelesen.' },
    { id: 'brandt-zwieback', name: 'Brandt Zwieback', unit: 'g', per100: null, portions: [{ n: 'Scheibe', g: null, v: { kcal: 38, p: null, c: null, f: null } }], src: 'mix',
      note: 'Etikett: 38 kcal pro Scheibe. Makros fehlen.' },
    /* --- Käse, Milch, Aufstrich --- */
    { id: 'leerdammer-pro', name: 'Leerdammer Protein (Feine Scheiben)', unit: 'g', per100: { kcal: 262, p: 29.5, c: 0.1, f: 16 }, portions: [{ n: 'Scheibe', g: 10, v: { kcal: 26, p: 3, c: 0, f: 1.6 } }, { n: 'Portion (2 Scheiben)', g: 20, v: { kcal: 52, p: 6, c: 0, f: 3.2 } }], src: 'foto', fav: true,
      note: 'Etikett: pro 100 g 262 kcal / 29,5 g P / 16 g F; 1 Scheibe 10 g = 26 kcal / 3 g P.' },
    { id: 'milch-15', name: 'Lidl H-Milch 1,5 %', unit: 'ml', per100: { kcal: 46, p: 3.4, c: 4.8, f: 1.5 }, portions: [{ n: 'Glas', g: 200 }, { n: 'Shake-Menge', g: 300 }], src: 'foto', fav: true,
      note: 'Etikett 26.11.2026 pro 100 ml: 46 kcal / 3,4 g P / 4,8 g KH / 1,5 g F. 300 ml = 138 kcal / 10,2 g P.' },
    { id: 'milch-01', name: 'Milch 0,1 %', unit: 'ml', per100: { kcal: 35, p: 3.4, c: 4.9, f: 0.1 }, portions: [{ n: 'Shake-Menge', g: 300 }], src: 'mix',
      note: 'Etikett: 35 kcal / 3,4 g P pro 100 ml. KH/Fett = Standardwert Magermilch.' },
    { id: 'lidl-frischkaese', name: 'Lidl Frischkäse Doppelrahmstufe', unit: 'g', per100: { kcal: 248, p: 5, c: null, f: 24 }, portions: [{ n: 'EL (dünn, ~15 g)', g: 15 }], src: 'mix',
      note: 'Etikett: 248 kcal / 5 g P / 24 g F pro 100 g. KH nicht abgelesen.' },
    /* --- Protein-Pulver, Riegel, Kohlenhydrate --- */
    { id: 'peak-hybrid', name: 'Peak Hybrid Protein (Cerealien-Milch)', unit: 'g', per100: { kcal: 350, p: 80, c: 5.2, f: 1.2 }, portions: [{ n: 'Shake', g: 30, v: { kcal: 105, p: 24, c: 1.6, f: 0.4 } }], src: 'mix', fav: true,
      note: 'kcal/Eiweiß vom Etikett (30 g = 105 kcal / 24 g P). KH/Fett aus der Peak-Nährwerttabelle ergänzt.' },
    { id: 'peak-hybrid-ms', name: 'Peak Hybrid Protein (Milchschnitte)', unit: 'g', per100: { kcal: 346.7, p: 76.7, c: 5.2, f: 1.2 }, portions: [{ n: 'Shake', g: 30, v: { kcal: 104, p: 23, c: 1.6, f: 0.4 } }], src: 'mix',
      note: 'kcal/Eiweiß vom Etikett (30 g = 104 kcal / 23 g P). KH/Fett aus Peak-Tabelle ergänzt.' },
    { id: 'peak-clear', name: 'Peak Clear Protein', unit: 'g', per100: { kcal: 332, p: 81, c: 1.1, f: 0.3 }, portions: [{ n: 'Shake', g: 30, v: { kcal: 99, p: 24, c: 0.3, f: 0.1 } }], src: 'hersteller',
      note: 'Etikett deiner Lieferung: 30 g = 99 kcal / 24 g P. Pro 100 g laut Hersteller-Tabelle.' },
    { id: 'esn-isoclear', name: 'ESN Isoclear', unit: 'g', per100: { kcal: 343.3, p: 80, c: 3, f: 0 }, portions: [{ n: 'Shake', g: 30, v: { kcal: 103, p: 24, c: 0.9, f: 0 } }], src: 'hersteller',
      note: 'Pro 30 g ca. 103 kcal / 24 g P (je nach Sorte 102–104 kcal, 23–27 g P – bei deiner Sorte gilt die Dose).' },
    { id: 'peak-ricepudding', name: 'Peak Rice Pudding (Reisgrieß)', unit: 'g', per100: { kcal: 382, p: 7.6, c: 84.2, f: 0.7 }, portions: [{ n: 'Portion', g: 60 }], src: 'foto',
      note: 'Packungsfoto 10.11.2026 (= peak.ag). Zucker 0,4 g, Ballaststoffe 1,5 g pro 100 g.' },
    { id: 'peak-epic-intra', name: 'Peak Epic Intra', unit: 'g', per100: null, portions: [{ n: '1,5 Portionen (75 g)', g: 75, v: { kcal: 260, p: null, c: 45, f: 0 } }], src: 'mix',
      note: '1,5 Portionen ≈ 260 kcal / 45 g KH (plus EAA). Eiweiß nicht als Protein gezählt.' },
    { id: 'powerbar-protein', name: 'Powerbar Protein-Riegel', unit: 'g', per100: null, portions: [{ n: 'Riegel', g: null, v: { kcal: 175, p: 16, c: null, f: null } }], src: 'mix',
      note: 'Ca. 175 kcal / 16 g P pro Riegel (Sorte prüfen). KH/Fett fehlen.' },
    { id: 'protein-pizzamehl', name: 'Protein-Pizzamehl (HIT)', unit: 'g', per100: { kcal: 357, p: 21, c: 59, f: null }, portions: [{ n: 'Pizza-Menge', g: 150 }], src: 'mix',
      note: 'Etikett pro 100 g: 357 kcal / 21 g P / 59 g KH. Fett fehlt.' },
    { id: 'protein-maultaschen', name: 'Protein-Maultaschen', unit: 'g', per100: { kcal: 198, p: 10, c: 25, f: 5.7 }, portions: [], src: 'foto',
      note: 'Etikett pro 100 g: 198 kcal / 10 g P / 25 g KH / 5,7 g F.' },
    { id: 'linsen-spaetzle', name: 'Linsen-Spätzle', unit: 'g', per100: { kcal: 171, p: null, c: 23, f: 4.1 }, portions: [], src: 'mix',
      note: 'Etikett pro 100 g: 171 kcal / 23 g KH / 4,1 g F. Eiweiß fehlt.' },
    /* --- Fleisch, Fisch, Aufschnitt (pro 100 g) --- */
    { id: 'raeucherlachs', name: 'Räucherlachs', unit: 'g', per100: { kcal: 177, p: 22, c: null, f: 9.9 }, portions: [], src: 'foto', note: 'Etikett pro 100 g: 177 kcal / 22 g P / 9,9 g F.' },
    { id: 'lidl-mortadella-skyr', name: 'Lidl Hähnchen-Mortadella mit Skyr', unit: 'g', per100: { kcal: 112, p: 14.7, c: 2, f: 5 }, portions: [{ n: 'Packung', g: 80 }], src: 'foto',
      note: 'Packungsfoto 10.11.2026, Packung 80 g = 90 kcal / 11,8 g P.' },
    { id: 'dulano-mortadella', name: 'Dulano Hähnchen-Mortadella High Protein', unit: 'g', per100: { kcal: 102, p: 15, c: null, f: 3 }, portions: [{ n: 'halbe Packung', g: 40 }], src: 'mix',
      note: 'Etikett: 102 kcal / 15 g P / 3 g F pro 100 g. KH nicht abgelesen.' },
    { id: 'lidl-salami', name: 'Lidl Salami', unit: 'g', per100: { kcal: 433, p: 27, c: null, f: 35 }, portions: [], src: 'foto', note: 'Etikett pro 100 g: 433 kcal / 27 g P / 35 g F.' },
    { id: 'serrano', name: 'Serrano-Schinken', unit: 'g', per100: { kcal: 328.6, p: 32.9, c: null, f: 21.4 }, portions: [{ n: 'Packung 70 g', g: 70, v: { kcal: 230, p: 23, c: null, f: 15 } }], src: 'foto',
      note: 'Etikett: Packung 70 g = 230 kcal / 23 g P / 15 g F.' },
    { id: 'nackensteak', name: 'Nackensteak (Schwein)', unit: 'g', per100: { kcal: 194, p: 16, c: null, f: 14 }, portions: [], src: 'foto', note: 'Etikett pro 100 g: 194 kcal / 16 g P / 14 g F.' },
    { id: 'haehnchen-minuten', name: 'Hähnchen-Minutenschnitzel', unit: 'g', per100: { kcal: 105, p: 22, c: null, f: null }, portions: [], src: 'mix', note: 'Etikett pro 100 g: 105 kcal / 22 g P.' },
    { id: 'haehnchen-kebab', name: 'Hähnchen-Kebab', unit: 'g', per100: { kcal: 147, p: 16.5, c: null, f: null }, portions: [], src: 'mix', note: 'Etikett pro 100 g: 147 kcal / 16,5 g P.' },
    { id: 'senf-dill-sosse', name: 'Senf-Dill-Soße', unit: 'g', per100: { kcal: 263, p: null, c: null, f: null }, portions: [{ n: 'EL (~15 g)', g: 15 }], src: 'mix', note: 'Etikett: 263 kcal pro 100 g. Makros fehlen.' },
    /* --- Fertiggerichte --- */
    { id: 'lidl-hp-bowl-mex', name: 'Lidl Chef Select High Protein Bowl mexikanisch', unit: 'g', per100: { kcal: 189, p: 11.4, c: 19.6, f: 5.4 }, portions: [{ n: 'ganzer Beutel 450 g', g: 450, v: { kcal: 851, p: 51.3, c: 88.2, f: 24.3 } }], src: 'foto',
      note: 'Etikett pro 100 g: 189 kcal / 11,4 g P / 19,6 g KH / 5,4 g F. Beutel 450 g = 851 kcal / 51 g P.' },
    { id: 'frosta-teriyaki', name: 'FRoSTA Hähnchen & Blumenkohlreis Teriyaki (TK)', unit: 'g', per100: { kcal: 142, p: 14.5, c: 2.9, f: 7.4 }, portions: [{ n: 'ganzer Beutel 500 g', g: 500, v: { kcal: 710, p: 72.5, c: 14.5, f: 37 } }], src: 'foto',
      note: 'Etikett 11.11.2026 (zubereitet mit Öl). Beutel 500 g = 710 kcal / 72,5 g P.' },
    { id: 'frosta-hp-reis', name: 'FRoSTA High Protein Hähnchen Reis & Brokkoli (TK)', unit: 'g', per100: { kcal: 124, p: 13.4, c: 10, f: 3.7 }, portions: [{ n: 'ganzer Beutel 500 g', g: 500, v: { kcal: 620, p: 67, c: 50, f: 18.5 } }], src: 'foto',
      note: 'Etikett 13.11.2026 pro 100 g zubereitet (mit Milch laut Packung): 124 kcal / 13,4 g P / 10 g KH / 3,7 g F. Beutel ≈ 620 kcal / 67 g P.' },
    /* --- Standardwerte (keine Packung von Markus, fddb-Durchschnitt) --- */
    { id: 'std-magerquark', name: 'Magerquark (Standardwert)', unit: 'g', per100: { kcal: 68, p: 12, c: 4, f: 0.2 }, portions: [{ n: 'Becher 250 g', g: 250 }], src: 'std',
      note: 'Standardwert (fddb 66–70 kcal / 12 g P). 250 g ≈ 170 kcal / 30 g P. Mit eigener Packung ersetzen.' },
    { id: 'std-skyr', name: 'Skyr natur (Standardwert)', unit: 'g', per100: { kcal: 63, p: 11, c: 4, f: 0.2 }, portions: [{ n: 'Becher 150 g', g: 150 }], src: 'std', note: 'Standardwert. Mit eigener Packung ersetzen.' },
    { id: 'std-haehnchenbrust', name: 'Hähnchenbrust roh (Standardwert)', unit: 'g', per100: { kcal: 110, p: 23, c: 0, f: 2 }, portions: [], src: 'std', note: 'Standardwert roh gewogen (fddb 104–110 kcal / 22–24 g P).' },
    { id: 'std-reis-roh', name: 'Reis roh (Standardwert)', unit: 'g', per100: { kcal: 350, p: 7, c: 78, f: 0.6 }, portions: [], src: 'std', note: 'Standardwert Rohgewicht. Gekocht ≈ 130 kcal / 100 g.' },
    { id: 'std-haferflocken', name: 'Haferflocken (Standardwert)', unit: 'g', per100: { kcal: 370, p: 13.5, c: 59, f: 7 }, portions: [], src: 'std', note: 'Standardwert.' },
    { id: 'skyr-sauce', name: 'Skyr-Sauce (Carter)', unit: 'g', per100: null, portions: [{ n: 'Portion (Rezept)', g: null, v: SKYR_SAUCE }], src: 'mix',
      note: 'Rezept: 100 g Skyr + 1 TL Tomatenmark + 1 TL Senf + Knoblauch + Erythrit + Gewürze (Paprika, Pfeffer, Chili, Prise Salz, Spritzer Essig), 1–2 EL Wasser. Kalt dazu, nicht anbraten. ≈ 60 kcal pro Portion.' }
  ];
  const COMBOS = [
    { id: 'std-broetchen', name: 'Standard-Brötchen', icon: '🥯', items: [{ foodId: 'edeka-pb', mode: 'p', pi: 0, amount: 1 }, { foodId: 'leerdammer-pro', mode: 'p', pi: 0, amount: 2 }] },
    { id: 'std-fruehstueck', name: 'Standard-Frühstück', icon: '☀️', items: [{ foodId: 'milch-15', mode: 'g', amount: 300 }, { foodId: 'peak-hybrid', mode: 'p', pi: 0, amount: 1 },
      { foodId: 'edeka-pb', mode: 'p', pi: 0, amount: 2 }, { foodId: 'leerdammer-pro', mode: 'p', pi: 0, amount: 4 }] },
    { id: 'reispudding', name: 'Reispudding', icon: '🍚', items: [{ foodId: 'milch-15', mode: 'g', amount: 280 }, { foodId: 'peak-hybrid', mode: 'p', pi: 0, amount: 1 }, { foodId: 'peak-ricepudding', mode: 'g', amount: 60 }] },
    { id: 'frosta-teriyaki-sauce', name: 'FRoSTA Teriyaki + Skyr-Sauce', icon: '🍛', items: [{ foodId: 'frosta-teriyaki', mode: 'p', pi: 0, amount: 1 }, { foodId: 'skyr-sauce', mode: 'p', pi: 0, amount: 1 }] },
    { id: 'frosta-sauce-2pb', name: 'FRoSTA + Skyr-Sauce + 2 Brötchen', icon: '🍛', items: [{ foodId: 'frosta-teriyaki', mode: 'p', pi: 0, amount: 1 }, { foodId: 'skyr-sauce', mode: 'p', pi: 0, amount: 1 }, { foodId: 'edeka-pb', mode: 'p', pi: 0, amount: 2 }] }
  ];
  /* Start-Datenbank-Version: bei Erhöhung werden FEHLENDE Start-Produkte/Kombis ergänzt (2 = v1.8.2 FRoSTA + Skyr-Sauce, 3 = v1.8.3 Kombi,
     4 = v2.1.1 Etiketten-Abgleich 26.11.2026). SEED_FIX: Start-Produkte, die ersetzt werden, wenn sie noch exakt dem alten Stand entsprechen (nie selbst geändert). */
  const SEED_VERSION = 4;
  const SEED_FIX = {
    'milch-15': '{"per100":{"kcal":47,"p":3.4,"c":4.9,"f":1.5},"portions":[{"n":"Glas","g":200},{"n":"Shake-Menge","g":300}]}',
    'leerdammer-pro': '{"per100":{"kcal":262,"p":29.5,"c":0.1,"f":16},"portions":[{"n":"Scheibe","g":10},{"n":"Portion (2 Scheiben)","g":20}]}',
    'esn-isoclear': '{"per100":{"kcal":346.7,"p":80,"c":4,"f":0},"portions":[{"n":"Shake","g":30,"v":{"kcal":104,"p":24,"c":1.2,"f":0}}]}',
    'lidl-ei-wrap': '{"per100":null,"portions":[{"n":"Wrap","g":null,"v":{"kcal":181,"p":11,"c":null,"f":null}}]}',
    'edeka-pb': '{"per100":{"kcal":275,"p":21,"c":25,"f":8.6},"portions":[{"n":"Brötchen","g":75,"v":{"kcal":206,"p":15.8,"c":18.8,"f":6.5}}]}',
    'dulano-mortadella': '{"per100":{"kcal":102,"p":15,"c":1,"f":3},"portions":[{"n":"halbe Packung","g":40}]}'
  };
  const seedKey = f => JSON.stringify({ per100: f.per100 == null ? null : f.per100, portions: f.portions || [] });
  /* true, wenn ein gespeichertes Start-Produkt noch unverändert alt ist und ersetzt werden darf */
  function needsFix(stored) { return !!(stored && stored.builtin && SEED_FIX[stored.id] && seedKey(stored) === SEED_FIX[stored.id]); }

  /* ---------- Barcode / Open Food Facts ---------- */
  const digits = s => String(s == null ? '' : s).replace(/\D+/g, '');
  /* Prüfziffer für EAN-8, UPC-A (12), EAN-13, GTIN-14 */
  function validCode(raw) {
    const c = digits(raw); if (![8, 12, 13, 14].includes(c.length)) return false;
    let sum = 0; for (let i = 0; i < c.length - 1; i++) { const d = +c[c.length - 2 - i]; sum += i % 2 === 0 ? d * 3 : d; }
    return (10 - sum % 10) % 10 === +c[c.length - 1];
  }
  /* UPC-A (12) wird bei OFF meist als EAN-13 mit führender 0 geführt */
  function normCode(raw) { const c = digits(raw); return c.length === 12 ? '0' + c : c; }
  const numOrNull = v => { if (v === '' || v == null) return null; const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
  function parseGrams(s) { // "30 g", "250ml", "0,5 l", "1 Riegel (45 g)"
    const m = String(s || '').replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/i); if (!m) return null;
    const v = +m[1], u = m[2].toLowerCase(); const g = u === 'kg' || u === 'l' ? v * 1000 : u === 'cl' ? v * 10 : v; return g > 0 ? { g: r2(g), ml: /ml|cl|^l$/.test(u) } : null;
  }
  /* OFF-Antwort → Produktvorschlag (pro 100 g/ml). kcal vom Etikett, sonst kJ / 4,184 */
  function offToFood(json, code) {
    const out = { found: false, code: normCode(code) };
    if (!json || json.status === 0 || json.status === 'failure' || !json.product) return out;
    const p = json.product, n = p.nutriments || {};
    let kcal = numOrNull(n['energy-kcal_100g']), fromKJ = false;
    if (kcal == null) { const kj = numOrNull(n['energy-kj_100g']) ?? (n.energy_unit === 'kcal' ? null : numOrNull(n.energy_100g)); if (kj != null) { kcal = r2(kj / 4.184); fromKJ = true; } else if (n.energy_unit === 'kcal') kcal = numOrNull(n.energy_100g); }
    const r1 = x => x == null ? null : Math.round(x * 10) / 10, rr = x => x == null ? null : r2(x);
    const per100 = { kcal: r1(kcal), p: rr(numOrNull(n.proteins_100g)), c: rr(numOrNull(n.carbohydrates_100g)), f: rr(numOrNull(n.fat_100g)) };
    const missing = KEYS.filter(k => per100[k] == null);
    const name = String(p.product_name || '').trim(), brand = String(p.brands || '').split(',')[0].trim();
    const q = parseGrams(p.quantity), sv = parseGrams(p.serving_size);
    const unit = (q && q.ml) || (sv && sv.ml) ? 'ml' : 'g';
    const portions = [];
    if (sv && sv.g > 0) portions.push({ n: 'Portion', g: sv.g });
    if (q && q.g > 0 && (!sv || q.g !== sv.g) && q.g <= 2000) portions.push({ n: 'Packung', g: q.g });
    const full = brand && name && !norm(name).includes(norm(brand)) ? brand + ' ' + name : (name || brand);
    return Object.assign(out, { found: !!(name || brand || kcal != null), name: full, brand, per100, missing, fromKJ, unit, portions, quantity: p.quantity || '', img: p.image_front_small_url || null,
      src: 'off', note: 'Open Food Facts (Barcode ' + out.code + ')' + (fromKJ ? ' · kcal aus kJ umgerechnet' : '') + (missing.length ? ' · fehlte: ' + missing.map(k => ({ kcal: 'kcal', p: 'Eiweiß', c: 'KH', f: 'Fett' })[k]).join(', ') : '') });
  }
  const offUrl = code => 'https://world.openfoodfacts.org/api/v2/product/' + normCode(code) + '.json?fields=product_name,brands,nutriments,serving_size,quantity,image_front_small_url';
  function findByCode(foods, code) { const c = normCode(code); return (foods || []).find(f => f.barcode && normCode(f.barcode) === c) || null; }
  return { KEYS, r2, rK, rM, SRC, calcItem, gramsOf, amountText, add, scale, calcCombo, sumEntries, atwater, labelCheck, defaultMeal, MEALS, norm, matches, rankRecent, DEF_TARGETS, FOODS, COMBOS, SEED_VERSION, SEED_FIX, seedKey, needsFix, skyrSauce, validCode, normCode, parseGrams, offToFood, offUrl, findByCode };
});
