/* Voccola Gym Log – Vanilla JS, offline, keine Tracker. Daten bleiben im Browser (IndexedDB). */
'use strict';
const APP_VERSION = '1.4.0';

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 1) => (n == null || isNaN(n)) ? '–' : Number(n).toLocaleString('de-DE', { maximumFractionDigits: d });
const fmtIn = n => (n == null || isNaN(n)) ? '' : String(Math.round(n * 100) / 100).replace('.', ',');
const num = v => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const pl = (n, a, b) => n + ' ' + (n === 1 ? a : b);
const pad = n => String(n).padStart(2, '0');
const dkey = (d = new Date()) => { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WDL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const dateDE = k => { const d = fromKey(k); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); };
const dur = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? Math.floor(m / 60) + ' h ' + pad(m % 60) + ' min' : m + ' min'; };
const clock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600); return (h ? h + ':' + pad(Math.floor(s / 60) % 60) : Math.floor(s / 60)) + ':' + pad(s % 60); };
const weekStart = (d = new Date()) => { d = new Date(d); d.setHours(0, 0, 0, 0); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d; };

/* ---------- Stammdaten ---------- */
const DAYS = {
  upper: { name: 'Oberkörper', groups: ['Brust', 'Rücken', 'Schultern', 'Arme'], sub: 'Brust · Rücken · Schultern · Arme' },
  lower: { name: 'Bauch + Beine', groups: ['Bauch', 'Beine'], sub: 'Bauch · Beine' }
};
const GROUPS = ['Brust', 'Rücken', 'Schultern', 'Arme', 'Bauch', 'Beine', 'Reha'];
const GROUP_ICON = { Brust: '◆', Rücken: '▲', Schultern: '●', Arme: '✦', Bauch: '▦', Beine: '▮', Reha: '✚' };
const SPLIT = { 1: 'upper', 2: 'lower', 3: 'upper', 4: 'lower', 5: 'upper', 6: 'lower', 0: null };
const DEFAULT_EX = [
  ['Brust', 'Schrägbank Kurzhantel', 1], ['Brust', 'Flachbank Kurzhantel', 1], ['Brust', 'Obere Brust Frontheben sitzend'],
  ['Brust', 'Kurzhantel eng nach vorn (obere Brust)'], ['Brust', 'Fliegende liegend (Blackroll)', 1], ['Brust', 'Liegestütze'],
  ['Rücken', 'Rudern Maschine enger Griff'], ['Rücken', 'Latzug mit Seil'],
  ['Schultern', 'Seitheben Kurzhantel', 1], ['Schultern', 'Seitheben Kabel'], ['Schultern', 'Schulterpresse Maschine'],
  ['Arme', 'Hammercurls', 1], ['Arme', 'Bizeps Kurzhantel', 1], ['Arme', 'Bizeps Seilzug'], ['Arme', 'Bizeps Kabel stehend (Arme ausgestreckt)'], ['Arme', 'Trizeps Seil'],
  ['Bauch', 'Negative Sit-ups Schrägbank (mit Scheibe)'], ['Bauch', 'Hanging Leg Raises'], ['Bauch', 'Knieheben am Beinstrecker'], ['Bauch', 'Crunch am Seilzug'], ['Bauch', 'Seitbeugen'], ['Bauch', 'Seitliche Kabelcrunches'],
  ['Beine', 'Beinpresse'], ['Beine', 'Hackenschmidt'], ['Beine', 'Beinstrecker'], ['Beine', 'Beinbeuger'],
  ['Reha', 'Tennisarm Halteübung (isometrisch)', 0, 'sec'], ['Reha', 'Tennisarm exzentrisch']
];
const QUOTES = [
  ['Schmerz ist vorübergehend. Stolz bleibt.', 'Disziplin'],
  ['Du wirst nicht stärker, wenn es leicht ist.', 'Wachstum'],
  ['Eine Wiederholung mehr als gestern.', 'Progression'],
  ['Disziplin schlägt Motivation. Jeden Tag.', 'Haltung'],
  ['Der Körper erreicht, was der Kopf glaubt.', 'Mindset'],
  ['Keine Ausreden. Nur Ergebnisse.', 'Fokus'],
  ['Stark ist, wer weitermacht, wenn es brennt.', 'Wille'],
  ['Heute investiert. Morgen sichtbar.', 'Geduld'],
  ['Champions trainieren, wenn keiner zuschaut.', 'Charakter'],
  ['Das Eisen lügt nie.', 'Wahrheit'],
  ['Konstanz baut Körper. Nicht Perfektion.', 'Konstanz'],
  ['Mit 41 erst richtig in Form. Weiter so, Markus.', 'Erfahrung'],
  ['Jeder Satz zählt. Jede Woche zählt.', 'Volumen'],
  ['Gewicht hoch. Kopf höher.', 'Stolz'],
  ['Der letzte Satz macht den Unterschied.', 'Intensität']
];
const METRICS = [
  { k: 'weight', l: 'Körpergewicht', u: 'kg', d: 1, goodDown: true },
  { k: 'bf', l: 'Körperfett', u: '%', d: 1, goodDown: true },
  { k: 'rhr', l: 'Ruhepuls', u: 'bpm', d: 0, goodDown: true },
  { k: 'chest', l: 'Brust', u: 'cm', d: 1 },
  { k: 'shoulders', l: 'Schultern', u: 'cm', d: 1 },
  { k: 'armR', l: 'Oberarm rechts', u: 'cm', d: 1 },
  { k: 'armL', l: 'Oberarm links', u: 'cm', d: 1 },
  { k: 'waist', l: 'Taille', u: 'cm', d: 1, goodDown: true },
  { k: 'thigh', l: 'Oberschenkel', u: 'cm', d: 1 }
];
/* Erweiterter Übungskatalog (v1.1). Flags: p = pro Seite, s = Sekunden, e = ellenbogenfreundlich (Tennisarm), w = Vorsicht bei Tennisarm */
const CATALOG = [
  ['r-klimm', 'Rücken', '', 'Klimmzüge Obergriff', ''], ['r-klimm-neutral', 'Rücken', '', 'Klimmzüge neutraler Griff', 'e'], ['r-chinup', 'Rücken', '', 'Klimmzüge Untergriff (Chin-ups)', ''],
  ['r-klimm-assist', 'Rücken', '', 'Klimmzüge Maschine (assistiert)', 'e'],
  ['r-lat-breit', 'Rücken', '', 'Latzug breit', ''], ['r-lat-eng', 'Rücken', '', 'Latzug eng (V-Griff)', 'e'], ['r-lat-unter', 'Rücken', '', 'Latzug Untergriff', ''],
  ['r-lat-einarm', 'Rücken', '', 'Latzug einarmig Kabel', 'e'], ['r-lat-maschine', 'Rücken', '', 'Latzug Maschine (Hammer Strength)', 'e'],
  ['r-row-lh', 'Rücken', '', 'Rudern Langhantel vorgebeugt', ''], ['r-row-kh', 'Rücken', '', 'Rudern Kurzhantel einarmig', 'e'], ['r-row-tbar', 'Rücken', '', 'T-Bar Rudern', 'e'],
  ['r-row-kabel', 'Rücken', '', 'Rudern Kabel sitzend (V-Griff)', 'e'], ['r-row-breit', 'Rücken', '', 'Rudern Maschine breiter Griff', ''], ['r-row-brust', 'Rücken', '', 'Rudern mit Brustauflage (Kurzhantel)', 'pe'],
  ['r-pullover', 'Rücken', '', 'Pullover am Kabel (Seil)', 'e'], ['r-facepull', 'Rücken', '', 'Face Pulls (Seil)', 'e'], ['r-revfly', 'Rücken', '', 'Reverse Butterfly (hintere Schulter)', 'e'],
  ['r-hyper', 'Rücken', '', 'Hyperextensions', ''], ['r-deadlift', 'Rücken', '', 'Kreuzheben', ''], ['r-rackpull', 'Rücken', '', 'Rack Pulls', ''],
  ['r-shrug-kh', 'Rücken', '', 'Shrugs Kurzhantel', 'pe'], ['r-shrug-lh', 'Rücken', '', 'Shrugs Langhantel', ''],
  ['b-bank-flach', 'Brust', '', 'Bankdrücken Langhantel flach', ''], ['b-bank-schraeg', 'Brust', '', 'Bankdrücken Langhantel schräg', ''], ['b-bank-negativ', 'Brust', '', 'Bankdrücken Langhantel negativ', ''],
  ['b-kh-neutral', 'Brust', '', 'Kurzhantel-Drücken neutraler Griff', 'pe'], ['b-multi-schraeg', 'Brust', '', 'Multipresse Schrägbank', ''],
  ['b-presse', 'Brust', '', 'Brustpresse Maschine', 'e'], ['b-presse-schraeg', 'Brust', '', 'Schrägbankpresse Maschine', 'e'],
  ['b-butterfly', 'Brust', '', 'Butterfly Maschine', 'e'], ['b-pecdeck', 'Brust', '', 'Pec Deck (Ellenbogenpolster)', 'e'],
  ['b-cross-hoch', 'Brust', '', 'Kabelzug Crossover von oben', 'e'], ['b-cross-tief', 'Brust', '', 'Kabelzug Crossover von unten', 'e'], ['b-cross-mitte', 'Brust', '', 'Kabelzug Fliegende mittig', 'e'],
  ['b-fly-schraeg', 'Brust', '', 'Fliegende Kurzhantel schräg', 'p'], ['b-dips', 'Brust', '', 'Dips (Brustfokus)', ''], ['b-push-griffe', 'Brust', '', 'Liegestütze an Griffen (neutral)', 'e'],
  ['a-sz', 'Arme', 'Bizeps', 'SZ-Curls', ''], ['a-lh', 'Arme', 'Bizeps', 'Langhantelcurls', ''], ['a-konz', 'Arme', 'Bizeps', 'Konzentrationscurls', ''],
  ['a-scott', 'Arme', 'Bizeps', 'Scottcurls (SZ)', ''], ['a-scott-masch', 'Arme', 'Bizeps', 'Bizepscurl Maschine', ''], ['a-spider', 'Arme', 'Bizeps', 'Spider Curls', 'p'],
  ['a-bayes', 'Arme', 'Bizeps', 'Bayesian Kabelcurls', ''], ['a-schraeg', 'Arme', 'Bizeps', 'Schrägbank-Curls Kurzhantel', 'p'], ['a-drag', 'Arme', 'Bizeps', 'Drag Curls', ''],
  ['a-hammer-seil', 'Arme', 'Bizeps', 'Hammercurls am Seil', 'e'], ['a-hammer-cross', 'Arme', 'Bizeps', 'Cross-Body Hammercurls', 'pe'],
  ['t-french', 'Arme', 'Trizeps', 'French Press (SZ)', ''], ['t-stange', 'Arme', 'Trizeps', 'Trizepsdrücken Kabel Stange', ''], ['t-vgriff', 'Arme', 'Trizeps', 'Trizepsdrücken Kabel V-Griff', 'e'],
  ['t-ueberkopf', 'Arme', 'Trizeps', 'Überkopf-Trizeps Kabel (Seil)', 'e'], ['t-ueberkopf-kh', 'Arme', 'Trizeps', 'Überkopf-Trizeps Kurzhantel', ''],
  ['t-dips-geraet', 'Arme', 'Trizeps', 'Dips am Gerät', 'e'], ['t-dips-bank', 'Arme', 'Trizeps', 'Bankdips', ''], ['t-kickback', 'Arme', 'Trizeps', 'Kickbacks Kurzhantel', 'p'],
  ['t-kickback-kabel', 'Arme', 'Trizeps', 'Kickbacks Kabel', 'e'], ['t-eng-bank', 'Arme', 'Trizeps', 'Enges Bankdrücken', ''], ['t-maschine', 'Arme', 'Trizeps', 'Trizeps Maschine', 'e'],
  ['t-einarm', 'Arme', 'Trizeps', 'Trizepsdrücken einarmig Untergriff', ''],
  ['u-reverse', 'Arme', 'Unterarme', 'Reverse Curls (SZ)', 'w'], ['u-wrist', 'Arme', 'Unterarme', 'Handgelenkcurls', ''], ['u-wrist-rev', 'Arme', 'Unterarme', 'Reverse Handgelenkcurls', 'w'],
  ['u-pronation', 'Arme', 'Unterarme', 'Pronation/Supination Kurzhantel', 'e'], ['u-finger', 'Arme', 'Unterarme', 'Fingercurls Langhantel', ''],
  ['u-farmer', 'Arme', 'Unterarme', "Farmer's Walk", 'ps'], ['u-hang', 'Arme', 'Unterarme', 'Dead Hang', 's']
];
/* Nachträgliche Infos für bestehende Standard-Übungen */
const DEFAULT_PATCH = { x7: { elbow: 'e' }, x8: { elbow: 'e' }, x12: { sub: 'Bizeps', elbow: 'e' }, x13: { sub: 'Bizeps' }, x14: { sub: 'Bizeps' }, x15: { sub: 'Bizeps' }, x16: { sub: 'Trizeps', elbow: 'e' } };
const CATALOG_VERSION = 4;
/* v1.2.1: neue Standard-Übungen, die direkt im Plan sichtbar sind (Migration fügt fehlende per ID ein) */
const EXTRA_EX = [
  { id: 's-presse-kabel-liegend', name: 'Schulterpresse Kabelzug (liegend)', group: 'Schultern', unit: 'reps', perSide: false, elbow: 'w', order: 10.5,
    desc: 'Bauchlage auf der Schrägbank (Brust aufgelegt, Gesicht nach unten). Kabel vom unteren Zug hinter dir, Griffe oder Seil. Nach vorn/oben über Kopf drücken. Kein Hohlkreuz, Brust bleibt auf dem Polster, konstante Spannung – oben nicht ablegen.',
    elbowNote: 'Griff locker halten, neutraler Griff (Seil/Hammergriff).' }
];
/* v1.3.0: Körpergewichts-Übungen (bw = ohne Zusatzgewicht, Anzeige „KG“) – im Katalog, für Drops mit anderer Übung */
const BW_EX = [
  { id: 'bw-dips', name: 'Dips Körpergewicht', group: 'Arme', sub: 'Trizeps' },
  { id: 'bw-klimm', name: 'Klimmzüge Körpergewicht', group: 'Rücken' },
  { id: 'bw-ausfall', name: 'Ausfallschritte Körpergewicht', group: 'Beine' },
  { id: 'bw-kniebeuge', name: 'Kniebeugen Körpergewicht', group: 'Beine' }
];
const BW_PATCH = ['x6', 'b-push-griffe', 'r-klimm', 'r-klimm-neutral', 'r-chinup', 'b-dips', 't-dips-bank'];
const PICK_FILTERS = ['Brust', 'Rücken', 'Bizeps', 'Trizeps', 'Unterarme', 'Schultern', 'Bauch', 'Beine', 'Reha'];
const SUB_ORDER = { Bizeps: 0, Trizeps: 1, Unterarme: 2 };
const elbowBadge = ex => ex.elbow === 'e' ? '<span class="badge badge-elbow" title="Neutraler Griff – ellenbogenfreundlich">🟢 Tennisarm-ok</span>' : ex.elbow === 'w' ? '<span class="badge badge-warn" title="Belastet die Unterarmstrecker">⚠ Tennisarm</span>' : '';
const filterOf = ex => ex.group === 'Arme' ? (ex.sub || 'Bizeps') : ex.group;
const painCol = v => v == null || isNaN(v) ? '#a1a1a6' : v <= 3 ? '#30d158' : v <= 6 ? '#ffd60a' : '#ff3b30';
const painTxt = v => v == null || isNaN(v) ? 'nicht erfasst' : v === 0 ? 'kein Schmerz' : v <= 3 ? 'leicht' : v <= 6 ? 'mittel' : 'stark';
const FEEL = ['', 'Schlecht', 'Mäßig', 'Okay', 'Gut', 'Top'];

/* ---------- IndexedDB ---------- */
const STORES = ['exercises', 'sessions', 'sets', 'measurements', 'meta'];
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('voccola-gym-log', 1);
      r.onupgradeneeded = () => { const d = r.result; STORES.forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); }); };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  tx(s, mode, fn) {
    return new Promise((res, rej) => {
      const t = this.db.transaction(s, mode); const st = t.objectStore(s); const q = fn(st);
      t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  },
  all(s) { return this.tx(s, 'readonly', st => st.getAll()); },
  put(s, v) { return this.tx(s, 'readwrite', st => st.put(v)); },
  del(s, id) { return this.tx(s, 'readwrite', st => st.delete(id)); },
  clear(s) { return this.tx(s, 'readwrite', st => st.clear()); }
};
const S = { exercises: [], sessions: [], sets: [], measurements: [], meta: {} };
async function save(store, obj) {
  if (store === 'meta') { S.meta[obj.id] = obj.value; } else {
    const arr = S[store]; const i = arr.findIndex(x => x.id === obj.id); if (i >= 0) arr[i] = obj; else arr.push(obj);
  }
  try { await DB.put(store, obj); } catch (e) { toast('Speichern fehlgeschlagen: ' + e.message); }
}
async function remove(store, id) { S[store] = S[store].filter(x => x.id !== id); await DB.del(store, id); }
const setMeta = (k, v) => save('meta', { id: k, value: v });

async function loadAll() {
  await DB.open();
  for (const s of STORES) {
    const rows = await DB.all(s);
    if (s === 'meta') rows.forEach(r => S.meta[r.id] = r.value); else S[s] = rows;
  }
  if (!S.meta.seeded) {
    let i = 0;
    for (const [g, n, ps, unit] of DEFAULT_EX) await save('exercises', { id: 'x' + (i + 1), name: n, group: g, unit: unit || 'reps', perSide: !!ps, order: i++, photo: null });
    await setMeta('seeded', true);
    await setMeta('weekGoal', 6);
  }
  if ((S.meta.catalogVersion || 0) < 1) {
    // Merge per ID: bestehende Übungen/Daten bleiben unangetastet, neue Katalog-Übungen kommen ausgeblendet dazu
    for (const [id, p] of Object.entries(DEFAULT_PATCH)) { const ex = exById(id); if (ex) { let ch = false; for (const [k, v] of Object.entries(p)) if (ex[k] === undefined) { ex[k] = v; ch = true; } if (ch) await save('exercises', ex); } }
    let i = 0;
    for (const [id, g, sub, name, f] of CATALOG) {
      if (!exById(id)) await save('exercises', { id, name, group: g, sub: sub || undefined, unit: f.includes('s') ? 'sec' : 'reps', perSide: f.includes('p'), elbow: f.includes('e') ? 'e' : f.includes('w') ? 'w' : undefined, order: 100 + i, photo: null, hidden: true, catalog: true });
      i++;
    }
    await setMeta('catalogVersion', 1);
  }
  if ((S.meta.catalogVersion || 0) < 2) {
    // Nur fehlende Übungen ergänzen – vorhandene Übungen, Sätze und Einstellungen bleiben unverändert
    for (const e of EXTRA_EX) if (!exById(e.id)) await save('exercises', { ...e, photo: null });
    await setMeta('catalogVersion', 2);
  }
  if ((S.meta.catalogVersion || 0) < 3) {
    let i = 0;
    for (const e of BW_EX) if (!exById(e.id)) await save('exercises', { ...e, unit: 'reps', perSide: false, bw: true, order: 300 + i++, photo: null, hidden: true, catalog: true });
    for (const id of BW_PATCH) { const ex = exById(id); if (ex && ex.bw === undefined) { ex.bw = true; await save('exercises', ex); } }
    await setMeta('catalogVersion', 3);
  }
  if ((S.meta.catalogVersion || 0) < 4) {
    // Tennisarm-Halteübung: vorhandene (per ID/Name) ergänzen, sonst neu anlegen – Sätze bleiben unverändert
    const ISO_DESC = 'Handgelenk-Streckung halten: Unterarm liegt auf (Oberschenkel/Bank), Handrücken oben, das Gewicht hängt über den Knöcheln. Handgelenk leicht gestreckt halten, ruhig atmen. Schmerz max. 3–4/10.';
    let iso = exById('x27') && /halte/i.test(exById('x27').name) ? exById('x27') : S.exercises.find(e => e.name === 'Tennisarm Halteübung (isometrisch)');
    if (!iso) await save('exercises', { id: 'reha-iso', name: 'Tennisarm Halteübung (isometrisch)', group: 'Reha', unit: 'sec', perSide: false, elbow: 'e', target: 45, desc: ISO_DESC, order: 900, photo: null });
    else { iso.unit = 'sec'; if (iso.elbow === undefined) iso.elbow = 'e'; if (!iso.desc) iso.desc = ISO_DESC; if (!iso.target) iso.target = 45; if (iso.hidden) iso.hidden = false; await save('exercises', iso); }
    await setMeta('catalogVersion', 4);
  }
}

/* ---------- Berechnungen ---------- */
const exById = id => S.exercises.find(e => e.id === id);
const sessById = id => S.sessions.find(s => s.id === id);
const activeSession = () => { const id = S.meta.activeSession; const s = id && sessById(id); return s && !s.end ? s : null; };
const setsOf = sid => S.sets.filter(x => x.sessionId === sid).sort((a, b) => a.ts - b.ts);
const setsOfEx = (sid, eid) => setsOf(sid).filter(x => x.exerciseId === eid);
const isSec = ex => ex && ex.unit === 'sec';
const e1rm = (w, r) => !w || !r ? 0 : (r <= 1 ? w : w * (1 + r / 30));
function setVolume(st) {
  const ex = exById(st.exerciseId); if (st.warmup || isSec(ex)) return 0;
  const f = st.perSide ? 2 : 1; let v = (st.weight || 0) * f * (st.reps || 0);
  // Drops mit anderer Übung: Faktor nach deren „pro Seite“; Körpergewicht-Drops (w = 0) zählen 0 kg
  (st.drops || []).forEach(d => { const de = d.ex && d.ex !== st.exerciseId ? exById(d.ex) : null; v += (d.w || 0) * (de ? (de.perSide ? 2 : 1) : f) * (d.r || 0); });
  return v;
}
function isPR(st) {
  if (st.warmup || !st.weight) return false;
  const ex = exById(st.exerciseId);
  const prior = S.sets.filter(x => x.exerciseId === st.exerciseId && !x.warmup && x.ts < st.ts && x.weight);
  if (!prior.length) return false;
  if (isSec(ex)) { const mw = Math.max(...prior.map(p => p.weight)); const ms = Math.max(...prior.map(p => p.reps || 0)); return st.weight > mw || (st.weight >= mw && (st.reps || 0) > ms); }
  const m1 = Math.max(...prior.map(p => e1rm(p.weight, p.reps))); const mw = Math.max(...prior.map(p => p.weight));
  return e1rm(st.weight, st.reps) > m1 + 0.01 || st.weight > mw;
}
function sessionStats(s) {
  const sets = setsOf(s.id); const work = sets.filter(x => !x.warmup);
  const vol = sets.reduce((a, x) => a + setVolume(x), 0);
  const last = sets.length ? sets[sets.length - 1].ts : s.start;
  const end = s.end || (activeSession() && activeSession().id === s.id ? Date.now() : last);
  const exIds = [...new Set(sets.map(x => x.exerciseId))];
  return { sets: work.length, warm: sets.length - work.length, vol, dur: end - s.start, exIds, prs: work.filter(isPR).length };
}
function lastSessionSets(eid, beforeTs) {
  const cand = S.sessions.filter(s => s.start < beforeTs).sort((a, b) => b.start - a.start);
  for (const s of cand) { const st = setsOfEx(s.id, eid); if (st.length) return { session: s, sets: st }; }
  return null;
}
const setLabel = (st, ex) => {
  if (isSec(ex)) return (st.weight ? fmt(st.weight, 2) + (st.perSide ? 'kg p.S.' : 'kg') + '×' : '') + fmt(st.reps, 0) + 's';
  const u = '';
  let t = (st.weight ? fmt(st.weight, 2) + (st.perSide ? ' kg p.S.' : ' kg') + ' × ' : '') + fmt(st.reps, 0) + u;
  if (!st.weight && !isSec(ex)) t = fmt(st.reps, 0) + ' Wdh.';
  return t;
};
const dropEx = (d, ex) => d.ex && d.ex !== (ex && ex.id) ? exById(d.ex) : null;
const dropLabel = (st, ex) => (st.drops || []).map(d => { const de = dropEx(d, ex);
  if (!de) return (d.w ? fmt(d.w, 2) + ' × ' : '') + fmt(d.r, 0) + (isSec(ex) ? ' s' : '');
  return esc(de.name) + ' ' + (d.w ? fmt(d.w, 2) + ' kg × ' : 'KG × ') + fmt(d.r, 0) + (isSec(de) ? ' s' : ''); }).join(' → ');
function weekData(offset = 0) {
  const ws = weekStart(); ws.setDate(ws.getDate() + offset * 7); const we = new Date(ws); we.setDate(we.getDate() + 7);
  const ss = S.sessions.filter(s => s.start >= ws.getTime() && s.start < we.getTime());
  let vol = 0, time = 0, kcal = 0, sets = 0;
  ss.forEach(s => { const st = sessionStats(s); vol += st.vol; time += st.dur; kcal += s.kcal || 0; sets += st.sets; });
  const meas = S.measurements.filter(m => { const t = fromKey(m.date).getTime(); return t >= ws.getTime() && t < we.getTime(); }).length;
  return { ws, sessions: ss, vol, time, kcal, sets, meas };
}

/* ---------- UI Infrastruktur ---------- */
const app = $('#app');
let timers = [];
function toast(msg, ms = 2200) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms); }
function showPR(text) { const o = $('#pr-overlay'); $('.pr-sub', o).textContent = text; o.classList.add('show'); setTimeout(() => o.classList.remove('show'), 2000); }
function openSheet(html, onMount) { $('#sheet').innerHTML = html; $('#sheet').scrollTop = 0; document.body.classList.add('sheet-open'); onMount && onMount($('#sheet')); }
function closeSheet() { document.body.classList.remove('sheet-open'); }
function go(h) { if (location.hash === h) render(); else location.hash = h; }
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, txt.length); let ok = false; try { ok = document.execCommand('copy'); } catch (_) { } ta.remove(); return ok;
  }
}
function pickImage(useCam) {
  return new Promise(res => {
    const inp = useCam ? $('#file-cam') : $('#file-lib'); inp.value = '';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return res(null); resizeImage(f, 900).then(res).catch(() => { toast('Foto konnte nicht geladen werden'); res(null); }); };
    inp.click();
  });
}
function resizeImage(file, max) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { const sc = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .8)); };
    img.onerror = rej; img.src = url;
  });
}
const emblem = (size = 64) => `<svg class="emb" width="${size}" height="${size}" viewBox="0 0 100 100"><defs><linearGradient id="eg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6d1f"/><stop offset=".45" stop-color="#D4AF37"/><stop offset=".55" stop-color="#f6e27a"/><stop offset="1" stop-color="#8a6d1f"/></linearGradient><linearGradient id="er${size}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2b2b"/><stop offset="1" stop-color="#a00000"/></linearGradient></defs><path d="M50 4 L90 18 V50 C90 74 72 90 50 97 C28 90 10 74 10 50 V18 Z" fill="#0a0a0a" stroke="url(#eg${size})" stroke-width="3"/><path d="M50 12 L82 23 V50 C82 69 68 82 50 88 C32 82 18 69 18 50 V23 Z" fill="url(#er${size})"/><path d="M31 32 L50 72 L69 32" fill="none" stroke="#0a0a0a" stroke-width="9"/><path d="M31 32 L50 72 L69 32" fill="none" stroke="url(#eg${size})" stroke-width="3.5"/></svg>`;

/* ---------- Charts (SVG, handgeschrieben) ---------- */
function lineChart(pts, o = {}) {
  if (!pts.length) return `<div class="chart-empty">${o.empty || 'Noch keine Daten – leg los!'}</div>`;
  const W = 340, H = o.h || 200, L = 40, R = 12, T = 18, B = 26;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x0 === x1) { x0 -= 86400000 * 3; x1 += 86400000 * 3; }
  let y0 = Math.min(...ys), y1 = Math.max(...ys); const pd = (y1 - y0) * .15 || Math.max(1, Math.abs(y1) * .05); y0 -= pd; y1 += pd; if (y0 < 0 && Math.min(...ys) >= 0) y0 = 0;
  const X = x => L + (x - x0) / (x1 - x0) * (W - L - R), Y = y => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
  let g = '';
  for (let i = 0; i <= 4; i++) { const v = y0 + (y1 - y0) * i / 4, yy = Y(v); g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text class="axis" x="${L - 6}" y="${yy + 3}" text-anchor="end">${fmt(v, v > 100 ? 0 : 1)}</text>`; }
  const n = Math.min(pts.length, 5); const used = new Set();
  for (let i = 0; i < n; i++) { const p = pts[Math.round(i * (pts.length - 1) / Math.max(1, n - 1))]; if (used.has(p.x)) continue; used.add(p.x); const d = new Date(p.x); g += `<text class="axis" x="${X(p.x)}" y="${H - 8}" text-anchor="middle">${pad(d.getDate())}.${pad(d.getMonth() + 1)}.</text>`; }
  const path = pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
  const area = path + ` L${X(pts[pts.length - 1].x).toFixed(1)} ${H - B} L${X(pts[0].x).toFixed(1)} ${H - B} Z`;
  const last = pts[pts.length - 1];
  const dots = pts.map(p => `<circle class="pt ${p.pr ? 'pr' : ''}" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.pr ? 5.5 : 4}"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="cgold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6d1f"/><stop offset=".5" stop-color="#f6e27a"/><stop offset="1" stop-color="#D4AF37"/></linearGradient><linearGradient id="carea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E60000" stop-opacity=".45"/><stop offset="1" stop-color="#E60000" stop-opacity="0"/></linearGradient></defs>${g}<path d="${area}" fill="url(#carea)"/><path class="ln" d="${path}"/>${dots}<text class="lbl-v" x="${Math.min(X(last.x), W - R - 4)}" y="${Math.max(12, Y(last.y) - 10)}" text-anchor="end">${fmt(last.y, o.d ?? 1)} ${o.unit || ''}</text></svg>`;
}
function spark(vals, color = '#E60000') {
  if (vals.length < 2) return `<svg viewBox="0 0 100 34"><line x1="0" x2="100" y1="17" y2="17" stroke="#2a2a2e" stroke-dasharray="3 4"/></svg>`;
  const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  const p = vals.map((v, i) => (i ? 'L' : 'M') + (i / (vals.length - 1) * 96 + 2).toFixed(1) + ' ' + (30 - (v - mn) / r * 26).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 100 34" preserveAspectRatio="none"><path d="${p}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function rings(vals) {
  const R = [56, 41, 26], sw = 13; let s = `<svg class="rings" viewBox="0 0 132 132"><defs>`;
  vals.forEach((v, i) => s += `<linearGradient id="rg${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${v.c1}"/><stop offset="1" stop-color="${v.c2}"/></linearGradient>`);
  s += `</defs>`;
  vals.forEach((v, i) => {
    const r = R[i], c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, v.p));
    s += `<circle class="bgc" cx="66" cy="66" r="${r}" stroke="${v.c1}" stroke-width="${sw}"/><circle class="fg" cx="66" cy="66" r="${r}" stroke="url(#rg${i})" stroke-width="${sw}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}" data-off="${(c * (1 - p)).toFixed(1)}" transform="rotate(-90 66 66)"/>`;
  });
  return s + `</svg>`;
}

/* ---------- Views ---------- */
function topbar(title, sub, back, right = '') {
  return `<div class="topbar">${back ? `<button class="icon-btn" data-act="go" data-to="${back}" aria-label="Zurück">‹</button>` : ''}<div class="tb-title">${sub ? `<div>${esc(sub)}</div>` : ''}<h2>${esc(title)}</h2></div>${right}</div>`;
}
const todayType = () => SPLIT[new Date().getDay()];

function dashboardCard() {
  const w = weekData(0), pw = weekData(-1), goal = S.meta.weekGoal || 6;
  const volRatio = pw.vol ? w.vol / pw.vol : (w.vol ? 1 : 0);
  return `<div class="card gold-frame">
    <div class="sec-h" style="margin:0 0 12px"><span>Diese Woche</span><span class="line"></span></div>
    <div class="dash">${rings([{ p: w.sessions.length / goal, c1: '#E60000', c2: '#ff5c5c' }, { p: volRatio, c1: '#8a6d1f', c2: '#f6e27a' }, { p: Math.min(1, w.meas), c1: '#9a9aa0', c2: '#ffffff' }])}
      <div class="ring-legend">
        <div class="rl"><span class="k c-red">Trainings</span><span class="v">${w.sessions.length}<small>/${goal}</small></span></div>
        <div class="rl"><span class="k c-gold">Volumen vs. Vorwoche</span><span class="v">${pw.vol ? fmt(volRatio * 100, 0) + '<small>%</small>' : (w.vol ? 'neu' : '0<small>%</small>')}</span></div>
        <div class="rl"><span class="k c-silver">Messungen</span><span class="v">${w.meas}<small>/1</small></span></div>
      </div></div>
    <div class="stats">
      <div class="stat"><div class="k">Trainings</div><div class="v">${w.sessions.length}<small>diese Woche</small></div></div>
      <div class="stat"><div class="k">Gesamtvolumen</div><div class="v">${w.vol >= 10000 ? fmt(w.vol / 1000, 1) + '<small>t</small>' : fmt(w.vol, 0) + '<small>kg</small>'}</div></div>
      <div class="stat"><div class="k">Trainingszeit</div><div class="v">${Math.floor(w.time / 3600000)}<small>h</small> ${pad(Math.round(w.time / 60000) % 60)}<small>min</small></div></div>
      <div class="stat"><div class="k">Aktivkalorien</div><div class="v c-red">${fmt(w.kcal, 0)}<small>kcal</small></div></div>
    </div></div>`;
}

function viewHome() {
  const h = new Date().getHours(); const greet = h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
  const act = activeSession(); const tt = todayType();
  const q = QUOTES[(S.meta.qIdx || 0) % QUOTES.length];
  const wd = new Date().getDay(); const doneDays = new Set(weekData(0).sessions.map(s => (new Date(s.start).getDay())));
  const chips = [1, 2, 3, 4, 5, 6, 0].map(d => `<span class="${SPLIT[d] === 'upper' ? 'up' : SPLIT[d] === 'lower' ? 'lo' : ''} ${d === wd ? 'today' : ''}" style="position:relative">${WD[d]}${doneDays.has(d) ? '<i class="done-dot"></i>' : ''}</span>`).join('');
  let cta;
  if (act) cta = `<button class="btn btn-red cta" data-act="go" data-to="#/train"><div><small>Training läuft · <span data-timer="${act.start}">${clock(Date.now() - act.start)}</span></small><div class="big">${DAYS[act.type].name} fortsetzen</div></div><span class="arrow">›</span></button>`;
  else if (tt) cta = `<button class="btn btn-red cta" data-act="start" data-type="${tt}"><div><small>Heute · ${WDL[wd]}</small><div class="big">${DAYS[tt].name} starten</div></div><span class="arrow">›</span></button>`;
  else cta = `<div class="card" style="text-align:center;background:rgba(10,10,10,.7)"><b>Ruhetag 😌</b><div class="muted small" style="margin:4px 0 12px">Regeneration ist Teil des Trainings. Trotzdem trainieren?</div><div class="row"><button class="btn btn-red btn-sm" data-act="start" data-type="upper">Oberkörper</button><button class="btn btn-outline-gold btn-sm" data-act="start" data-type="lower">Bauch + Beine</button></div></div>`;
  const recent = [...S.sessions].sort((a, b) => b.start - a.start)[0];
  return {
    html: `<section class="hero">
      <div class="brand">${emblem(64)}<div class="name gold">Voccola Gym Log</div></div>
      <div style="flex:1;min-height:40px"></div>
      <div class="greet">${greet}, <b>Markus</b></div>
      <div class="quote" id="quote">„${esc(q[0])}“</div>
      <div class="quote-by" id="quote-by">— ${esc(q[1])} —</div>
      ${cta}
      <div class="day-chips">${chips}</div>
    </section>
    <div style="height:18px"></div>
    ${dashboardCard()}
    ${recent ? `<div class="sec-h"><span>Letztes Training</span><span class="line"></span></div>${sessionCard(recent)}` : `<div class="card"><div class="empty" style="padding:10px">Noch kein Training gespeichert.<br>Tippe oben auf <b style="color:#fff">starten</b> – los geht's! 💪</div></div>`}
    <div class="foot">Daten bleiben nur auf diesem iPhone · offline · v${APP_VERSION}</div>`,
    mount() {
      timers.push(setInterval(() => {
        const el = $('#quote'), by = $('#quote-by'); if (!el) return; el.classList.add('out'); by.classList.add('out');
        setTimeout(() => { S.meta.qIdx = ((S.meta.qIdx || 0) + 1) % QUOTES.length; const q = QUOTES[S.meta.qIdx]; el.textContent = '„' + q[0] + '“'; by.textContent = '— ' + q[1] + ' —'; el.classList.remove('out'); by.classList.remove('out'); }, 600);
      }, 7000));
    }
  };
}

function sessionCard(s) {
  const st = sessionStats(s); const d = new Date(s.start);
  return `<a class="card sess ${s.type === 'upper' ? 'up' : 'lo'}" href="#/session/${s.id}">
    <div class="date"><b>${d.getDate()}</b><span>${MON[d.getMonth()].slice(0, 3)}</span></div>
    <div class="info"><b>${DAYS[s.type].name}</b>${!s.end ? ' <span class="badge badge-drop">läuft</span>' : ''}${st.prs ? ` <span class="badge badge-pr">🏆 ${st.prs}</span>` : ''}
      <div>${WDL[d.getDay()]} · ${dur(st.dur)} · ${pl(st.sets, 'Satz', 'Sätze')} · ${fmt(st.vol, 0)} kg${s.kcal ? ' · ' + fmt(s.kcal, 0) + ' kcal' : ''}</div></div><span class="chev">›</span></a>`;
}

let trainType = null;
function exRow(ex, act) {
  const n = act ? setsOfEx(act.id, ex.id).filter(x => !x.warmup).length : 0;
  const ls = lastSessionSets(ex.id, act ? act.start : Date.now() + 1);
  const sub = ls ? 'Zuletzt: ' + ls.sets.filter(x => !x.warmup).slice(0, 3).map(x => setLabel(x, ex)).join(', ') : 'Noch nicht trainiert';
  return `<a class="ex ${n ? 'done' : ''}" href="#/ex/${ex.id}"><div class="th" ${ex.photo ? `style="background-image:url('${ex.photo}')"` : ''}>${ex.photo ? '' : GROUP_ICON[ex.group] || '•'}</div>
    <div class="nm"><b>${esc(ex.name)}</b>${ex.elbow === 'e' ? '<i class="elbow-dot" title="ellenbogenfreundlich"></i>' : ''}<span>${ex.sub ? esc(ex.sub) + ' · ' : ''}${esc(sub)}</span></div><div class="cnt ${n ? 'has' : ''}">${n}</div></a>`;
}
function viewTrain() {
  const act = activeSession();
  const type = act ? act.type : (trainType || todayType() || 'upper');
  const day = DAYS[type];
  const list = [...day.groups, 'Reha'].map(g => {
    const exs = S.exercises.filter(e => e.group === g && !e.hidden).sort((a, b) => (SUB_ORDER[a.sub] ?? 0) - (SUB_ORDER[b.sub] ?? 0) || a.order - b.order);
    if (!exs.length) return '';
    return `<div class="sec-h"><span>${g}${g === 'Reha' ? ' · Tennisarm' : ''}</span><span class="line"></span></div>${exs.map(e => exRow(e, act)).join('')}`;
  }).join('') + `<button class="btn btn-outline-gold btn-sm" data-act="picker" style="margin-top:14px">＋ Weitere Übungen auswählen (${S.exercises.filter(e => e.hidden).length} im Katalog)</button>`;
  let head;
  if (act) {
    const st = sessionStats(act);
    head = `<div class="card red-frame"><div class="live"><span class="dot"></span><div style="flex:1"><div class="small muted">${day.name} · läuft seit</div><div class="t" data-timer="${act.start}">${clock(Date.now() - act.start)}</div></div>
      <div style="text-align:right"><div class="small muted">${pl(st.sets, 'Satz', 'Sätze')}</div><div style="font-weight:800;font-size:18px">${fmt(st.vol, 0)} kg</div></div></div>
      <div style="height:12px"></div><button class="btn btn-gold btn-sm" data-act="finish">Training beenden ✓</button></div>`;
  } else {
    head = `<div class="seg"><button class="${type === 'upper' ? 'on' : ''}" data-act="ttype" data-type="upper">Oberkörper</button><button class="${type === 'lower' ? 'on' : ''}" data-act="ttype" data-type="lower">Bauch + Beine</button></div>
      <button class="btn btn-red" data-act="start" data-type="${type}">Training starten</button><div class="hint" style="text-align:center">Oder direkt eine Übung antippen – das Training startet automatisch.</div>`;
  }
  head += `<button class="btn btn-ghost btn-sm" data-act="picker" style="margin-top:10px">🔍 Übungen suchen & auswählen</button>`;
  return { html: topbar(day.name, act ? 'Training aktiv' : (todayType() === type ? 'Heute laut Plan' : 'Trainingstag'), null, `<button class="icon-btn" data-act="go" data-to="#/exercises" aria-label="Übungen verwalten">✎</button>`) + head + list };
}

/* --- Logging --- */
let ED = null, EDex = null;
function prefill(ex, act) {
  const cur = act ? setsOfEx(act.id, ex.id) : [];
  const idx = cur.length;
  const ls = lastSessionSets(ex.id, act ? act.start : Date.now() + 1);
  const src = ls && ls.sets[idx];
  let o;
  if (src) o = { weight: src.weight, reps: src.reps, perSide: src.perSide, warmup: src.warmup, drops: (src.drops || []).map(d => ({ ...d })) };
  else if (cur.length) { const l = cur[cur.length - 1]; o = { weight: l.weight, reps: l.reps, perSide: l.perSide, warmup: false, drops: [] }; }
  else if (ls) { const l = ls.sets[ls.sets.length - 1]; o = { weight: l.weight, reps: l.reps, perSide: l.perSide, warmup: false, drops: [] }; }
  else o = { weight: isSec(ex) ? 0 : 10, reps: isSec(ex) ? 30 : 10, perSide: !!ex.perSide, warmup: false, drops: [] };
  o.note = ''; o.editId = null; o.from = src ? 'last' : null;
  return o;
}
function editorHTML(ex, act) {
  const sec = isSec(ex); const n = act ? setsOfEx(act.id, ex.id).filter(x => !x.warmup).length : 0;
  const editSt = ED.editId && S.sets.find(x => x.id === ED.editId);
  const editing = editSt ? (editSt.warmup ? 'A' : setsOfEx(act.id, ex.id).filter(x => !x.warmup && x.ts <= editSt.ts).length) : 0;
  return `<div class="card gold-frame editor" id="editor">
   <div class="ed-title"><span class="gold">${editing ? (editing === 'A' ? 'Aufwärmsatz' : 'Satz ' + editing) + ' bearbeiten' : (ED.warmup ? 'Aufwärmsatz' : 'Satz ' + (n + 1))}</span><span class="ed-rest" id="ed-rest"></span></div>
   ${ED.from === 'last' && !editing ? '<div class="small muted" style="margin:-6px 0 10px">↺ Vorschlag vom letzten Training</div>' : ''}
   <div class="steppers">
     <div class="stepper"><label>Gewicht (kg${ED.perSide ? ' / Seite' : ''})</label><div class="stp"><button data-step="weight" data-d="${sec ? -0.5 : -2.5}" aria-label="weniger Gewicht">−</button><input id="in-weight" data-f="weight" inputmode="decimal" value="${fmtIn(ED.weight)}"><button data-step="weight" data-d="${sec ? 0.5 : 2.5}" aria-label="mehr Gewicht">+</button></div></div>
     <div class="stepper"><label>${sec ? 'Gehalten (Sek.)' : 'Wiederholungen'}</label><div class="stp"><button data-step="reps" data-d="${sec ? -5 : -1}">−</button><input id="in-reps" data-f="reps" inputmode="numeric" value="${fmtIn(ED.reps)}"><button data-step="reps" data-d="${sec ? 5 : 1}">+</button></div></div>
   </div>
   ${sec ? holdHTML(ex) : ''}
   <div class="toggles">
     <button class="tgl ${ED.perSide ? 'on' : ''}" data-act="tgl" data-f="perSide">pro Seite</button>
     <button class="tgl ${ED.warmup ? 'on' : ''}" data-act="tgl" data-f="warmup">Aufwärmsatz</button>
     <button class="tgl red" data-act="addDrop">+ Drop-Satz</button>
   </div>
   <div id="drops">${ED.drops.map((d, i) => { const de = dropEx(d, ex); return `<div class="drop">${de ? `<div class="dex">↳ ${esc(de.name)}${de.bw ? ' <span class="badge badge-warm">KG</span>' : ''} <span class="muted small">${de.bw ? 'Gewicht optional (0 = Körpergewicht)' : ''}</span></div>` : ''}<span class="dl">DROP ${i + 1}</span>
     <div class="stp sm"><button data-step="drop:${i}:w" data-d="-2.5">−</button><input data-f="drop:${i}:w" inputmode="decimal" value="${fmtIn(d.w)}"><button data-step="drop:${i}:w" data-d="2.5">+</button></div>
     <div class="stp sm"><button data-step="drop:${i}:r" data-d="-1">−</button><input data-f="drop:${i}:r" inputmode="numeric" value="${fmtIn(d.r)}"><button data-step="drop:${i}:r" data-d="1">+</button></div>
     <button class="x" data-act="rmDrop" data-i="${i}" aria-label="Drop entfernen">×</button></div>`; }).join('')}</div>
   <input class="field" data-f="note" placeholder="Notiz (optional)" value="${esc(ED.note || '')}" style="margin-bottom:12px">
   ${editing ? `<div class="row"><button class="btn btn-ghost btn-sm" data-act="cancelEdit">Abbrechen</button><button class="btn btn-danger btn-sm" data-act="delSet">Löschen</button></div><div style="height:8px"></div><button class="btn btn-gold" data-act="saveSet">Änderung speichern</button>`
      : `<button class="btn btn-red" data-act="saveSet">Satz speichern ✓</button>`}
  </div>`;
}
function viewEx(id) {
  const ex = exById(id); if (!ex) return { html: topbar('Übung nicht gefunden', '', '#/train') };
  const act = activeSession();
  if (!ED || EDex !== id) { ED = prefill(ex, act); EDex = id; }
  const cur = act ? setsOfEx(act.id, ex.id) : [];
  const ls = lastSessionSets(ex.id, act ? act.start : Date.now() + 1);
  let wn = 0;
  const setsHtml = cur.map(st => {
    const pr = isPR(st); if (!st.warmup) wn++;
    return `<div class="set ${st.warmup ? 'warm' : ''} ${ED.editId === st.id ? 'editing' : ''}" data-act="editSet" data-id="${st.id}"><div class="no">${st.warmup ? 'A' : wn}</div>
      <div class="main"><b>${setLabel(st, ex)}</b> ${pr ? '<span class="badge badge-pr">🏆 Neuer Rekord!</span>' : ''}
      ${st.drops && st.drops.length ? `<div class="sub"><span class="badge badge-drop">DROP</span> ${dropLabel(st, ex)}</div>` : ''}${st.note ? `<div class="sub">📝 ${esc(st.note)}</div>` : ''}</div><span class="chev">›</span></div>`;
  }).join('');
  const lastHtml = ls ? `<div class="card"><div class="small muted" style="letter-spacing:1px;text-transform:uppercase;font-weight:700;margin-bottom:6px">Letztes Mal · ${dateDE(dkey(ls.session.start))}</div><div class="last">${ls.sets.map(x => `<b>${x.warmup ? '<span style="color:#888">A</span> ' : ''}${setLabel(x, ex)}</b>${x.drops && x.drops.length ? ' <span style="color:#ff7070">→ ' + dropLabel(x, ex) + '</span>' : ''}`).join('<br>')}</div></div>` : '';
  return {
    html: topbar(ex.name, ex.group + (isSec(ex) ? ' · isometrisch' : ''), '#/train', `<span style="display:flex;gap:8px"><button class="icon-btn" data-act="editEx" data-id="${ex.id}" aria-label="Übung bearbeiten">✎</button><button class="icon-btn" data-act="go" data-to="#/progress/${ex.id}" aria-label="Fortschritt">📈</button></span>`) +
      (ex.photo ? `<div class="photo-hero" style="background-image:url('${ex.photo}')" data-act="photo" data-id="${ex.id}"><span class="photo-edit">📷 Foto vom Gerät ändern</span></div>` : `<button class="btn btn-outline-gold btn-sm" data-act="photo" data-id="${ex.id}" style="margin-bottom:12px">📷 Foto vom Gerät aufnehmen</button>`) +
      (ex.desc || ex.elbowNote ? `<div class="card"><div class="small muted" style="letter-spacing:1px;text-transform:uppercase;font-weight:700;margin-bottom:6px">Ausführung</div>${ex.desc ? `<div style="font-size:14px;line-height:1.45;color:var(--tx2)">${esc(ex.desc)}</div>` : ''}${ex.elbowNote ? `<div style="margin-top:8px;font-size:14px">${elbowBadge(ex)} <span style="color:#ffd60a">${esc(ex.elbowNote)}</span></div>` : ''}</div>` : '') +
      lastHtml +
      (cur.length ? `<div class="sec-h"><span>Heute · ${pl(cur.filter(x => !x.warmup).length, 'Satz', 'Sätze')}</span><span class="line"></span></div>${setsHtml}` : '') +
      `<div style="height:6px"></div>` + editorHTML(ex, act)
  };
}
function setEdField(f, v, raw) {
  if (f === 'note') { ED.note = v; return; }
  const val = raw ? num(v) : v;
  if (f.startsWith('drop:')) { const [, i, k] = f.split(':'); if (ED.drops[i]) ED.drops[i][k] = val; } else ED[f] = val;
}
function readEditorInputs() { if (ED) $$('#editor input[data-f]').forEach(inp => setEdField(inp.dataset.f, inp.value, inp.dataset.f !== 'note')); }
function getEdField(f) { if (f.startsWith('drop:')) { const [, i, k] = f.split(':'); return ED.drops[i] ? ED.drops[i][k] : 0; } return ED[f]; }
function doStep(btn) {
  if (!ED) return;
  const f = btn.dataset.step, d = parseFloat(btn.dataset.d);
  const inp = btn.parentElement.querySelector('input'); setEdField(f, inp.value, true);
  const v = Math.max(0, Math.round(((getEdField(f) || 0) + d) * 100) / 100);
  setEdField(f, v); inp.value = fmtIn(v);
}
async function ensureSession(type) {
  let act = activeSession(); if (act) return act;
  act = { id: uid(), type: type || trainType || todayType() || 'upper', start: Date.now(), end: null };
  await save('sessions', act); await setMeta('activeSession', act.id);
  return act;
}
let restStart = null;
/* --- Halte-Timer (Zeit statt Wiederholungen). Basis: Zeitstempel, daher korrekt auch bei Sperrbildschirm --- */
let TMR = null, tmrI = null, wakeLock = null, actx = null;
const tgtOf = ex => ex.target || 45;
function holdHTML(ex) {
  const run = TMR && TMR.ex === ex.id;
  return `<div class="hold ${run ? 'run' : ''}" id="hold">
    <div class="hold-tgt"><span class="muted small">Zielzeit</span><button class="icon-btn sm" data-act="tgt" data-d="-5" aria-label="Ziel minus 5 s">−5</button><b id="hold-tgt">${tgtOf(ex)} s</b><button class="icon-btn sm" data-act="tgt" data-d="5" aria-label="Ziel plus 5 s">+5</button></div>
    <div class="hold-clock" id="hold-clock">${run ? '' : '0:00'}</div><div class="hold-sub" id="hold-sub">${run ? '' : 'Ziel ' + tgtOf(ex) + ' s'}</div>
    <div class="hold-bar"><i id="hold-bar"></i></div>
    <button class="btn ${run ? 'btn-gold' : 'btn-red'} hold-btn" data-act="${run ? 'holdStop' : 'holdStart'}">${run ? '■ Stopp & speichern' : '▶ Start'}</button></div>`;
}
function holdTick() {
  if (!TMR) return; const ex = exById(TMR.ex); const tg = tgtOf(ex);
  const el = (Date.now() - TMR.start) / 1000, c = $('#hold-clock'); if (!c) return;
  c.textContent = clock(el * 1000); const left = Math.ceil(tg - el);
  $('#hold-sub').textContent = left > 0 ? `noch ${left} s · Ziel ${tg} s` : `Ziel erreicht ✓ +${Math.floor(el - tg)} s`;
  $('#hold-bar').style.transform = `scaleX(${Math.min(1, el / tg)})`;
  if (el >= tg && !TMR.hit) { TMR.hit = true; $('#hold').classList.add('hit'); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} beep(); }
}
function beep() { try { if (!actx) return; const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination); const t = actx.currentTime; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.4, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .45); o.start(t); o.stop(t + .5); } catch (e) {} }
async function lockWake() { try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && TMR) { lockWake(); holdTick(); } });
async function holdStart() {
  readEditorInputs();
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume && actx.resume(); } catch (e) {}
  TMR = { ex: EDex, start: Date.now(), hit: false }; restStart = null; lockWake();
  clearInterval(tmrI); tmrI = setInterval(holdTick, 200); render(true); holdTick();
}
async function holdStop() {
  if (!TMR) return; const secs = Math.max(1, Math.round((Date.now() - TMR.start) / 1000));
  clearInterval(tmrI); TMR = null; try { wakeLock && wakeLock.release(); } catch (e) {} wakeLock = null;
  const ri = $('#in-reps'); if (ri) ri.value = secs; ED.reps = secs; await saveSet();
}
async function saveSet() {
  readEditorInputs();
  const ex = exById(EDex);
  if (!ED.reps && !ED.weight) return toast('Bitte Gewicht oder Wiederholungen eingeben');
  const act = await ensureSession();
  const wasEdit = !!ED.editId;
  const st = wasEdit ? S.sets.find(x => x.id === ED.editId) : { id: uid(), sessionId: act.id, exerciseId: ex.id, ts: Date.now() };
  Object.assign(st, { weight: ED.weight || 0, reps: ED.reps || 0, perSide: !!ED.perSide, warmup: !!ED.warmup, note: (ED.note || '').trim(), drops: ED.drops.filter(d => d.r || d.w).map(d => d.ex ? { w: d.w || 0, r: d.r || 0, ex: d.ex } : { w: d.w || 0, r: d.r || 0 }) });
  await save('sets', st);
  if (ex.perSide !== st.perSide) { ex.perSide = st.perSide; save('exercises', ex); }
  if (!wasEdit) restStart = Date.now();
  if (!wasEdit && isPR(st)) showPR(ex.name + ': ' + setLabel(st, ex)); else toast(wasEdit ? 'Satz aktualisiert ✓' : 'Satz gespeichert ✓', 1400);
  ED = prefill(ex, act); EDex = ex.id; render(true);
}

/* --- Fortschritt --- */
let progMetric = 'best';
function exSeries(ex) {
  const bySess = {};
  S.sets.filter(x => x.exerciseId === ex.id && !x.warmup).sort((a, b) => a.ts - b.ts).forEach(x => {
    const s = sessById(x.sessionId); if (!s) return;
    const b = bySess[s.id] = bySess[s.id] || { x: s.start, best: 0, rm: 0, vol: 0, sec: 0, sets: [] };
    b.best = Math.max(b.best, x.weight || 0); b.rm = Math.max(b.rm, e1rm(x.weight, x.reps)); b.vol += setVolume(x); b.sec = Math.max(b.sec, x.reps || 0); b.sets.push(x);
  });
  const arr = Object.values(bySess).sort((a, b) => a.x - b.x);
  let mb = -1, mr = -1, ms = -1;
  arr.forEach((p, i) => { p.prBest = i > 0 && p.best > mb; p.prRm = i > 0 && p.rm > mr + .01; p.prSec = i > 0 && p.sec > ms; mb = Math.max(mb, p.best); mr = Math.max(mr, p.rm); ms = Math.max(ms, p.sec); });
  return arr;
}
function viewProgress(id) {
  const visible = S.exercises.filter(e => !e.hidden || S.sets.some(x => x.exerciseId === e.id)).sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.order - b.order);
  const ex = exById(id) || exById(S.meta.lastProgEx) || visible.find(e => S.sets.some(s => s.exerciseId === e.id)) || visible[0];
  if (!ex) return { html: topbar('Fortschritt') + '<div class="empty">Keine Übungen</div>' };
  if (ex.id !== S.meta.lastProgEx) setMeta('lastProgEx', ex.id);
  const sec = isSec(ex); const ser = exSeries(ex);
  const M = sec ? { best: ['Gewicht', 'best', 'kg', 'prBest'], rm: ['Haltezeit', 'sec', 's', 'prSec'], vol: ['Sätze', null, '', null] }
    : { best: ['Bestes Gewicht', 'best', 'kg', 'prBest'], rm: ['1RM (Epley)', 'rm', 'kg', 'prRm'], vol: ['Volumen', 'vol', 'kg', null] };
  const m = M[progMetric];
  const pts = ser.map(p => ({ x: p.x, y: m[1] ? p[m[1]] : p.sets.length, pr: m[3] ? p[m[3]] : false }));
  const opts = GROUPS.map(g => `<optgroup label="${g}">` + visible.filter(e => e.group === g).map(e => `<option value="${e.id}" ${e.id === ex.id ? 'selected' : ''}>${esc(e.name)}</option>`).join('') + '</optgroup>').join('');
  const allBest = ser.length ? Math.max(...ser.map(p => p.best)) : 0, allRm = ser.length ? Math.max(...ser.map(p => sec ? p.sec : p.rm)) : 0;
  const prs = ser.filter(p => p.prBest || p.prRm || p.prSec).reverse().slice(0, 8);
  return {
    html: topbar('Fortschritt', 'Pro Übung') +
      `<select class="field" data-change="progEx" style="margin-bottom:12px">${opts}</select>
      <div class="kpis"><div class="kpi"><div class="k">Bestwert</div><div class="v">${fmt(allBest, 2)}<small class="u"> kg</small></div></div>
      <div class="kpi"><div class="k">${sec ? 'Max. Zeit' : '1RM geschätzt'}</div><div class="v">${fmt(allRm, 1)}<small class="u"> ${sec ? 's' : 'kg'}</small></div></div>
      <div class="kpi"><div class="k">Einheiten</div><div class="v">${ser.length}</div></div></div>
      <div class="seg gold sm">${Object.entries(M).map(([k, v]) => `<button class="${progMetric === k ? 'on' : ''}" data-act="pmetric" data-m="${k}">${v[0]}</button>`).join('')}</div>
      <div class="card gold-frame">${lineChart(pts, { unit: m[2], d: progMetric === 'vol' ? 0 : 1, empty: 'Noch keine Sätze für diese Übung.' })}
        <div class="legend"><span><i style="background:#E60000"></i>Einheit</span><span><i style="background:#D4AF37"></i>Rekord</span></div></div>
      <div class="sec-h"><span>Rekorde</span><span class="line"></span></div>
      <div class="card">${prs.length ? prs.map(p => `<div class="pr-row"><span>${dateDE(dkey(p.x))}</span><span class="badge badge-pr">🏆 ${sec ? fmt(p.sec, 0) + ' s' : fmt(p.best, 2) + ' kg · 1RM ' + fmt(p.rm, 1)}</span></div>`).join('') : '<div class="empty" style="padding:12px">Noch keine Rekorde – der erste kommt bestimmt!</div>'}</div>
      <button class="btn btn-red btn-sm" data-act="go" data-to="#/ex/${ex.id}">Diese Übung trainieren</button>`
  };
}

/* --- Verlauf --- */
let calMonth = null, calSel = null;
function viewHistory() {
  const now = new Date(); if (!calMonth) calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const y = calMonth.getFullYear(), mo = calMonth.getMonth();
  const first = new Date(y, mo, 1); const off = (first.getDay() + 6) % 7;
  const days = new Date(y, mo + 1, 0).getDate(); const cellsN = Math.ceil((off + days) / 7) * 7;
  const byDay = {}; S.sessions.forEach(s => { const k = dkey(s.start); (byDay[k] = byDay[k] || []).push(s); });
  let cells = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => `<div class="dn">${d}</div>`).join('');
  for (let i = 0; i < cellsN; i++) {
    const d = new Date(y, mo, 1 - off + i); const k = dkey(d); const ss = byDay[k];
    const cls = [d.getMonth() !== mo ? 'other' : '', k === dkey() ? 'today' : '', ss ? (ss[0].type === 'upper' ? 'up' : 'lo') : '', calSel === k ? 'sel' : ''].join(' ');
    cells += `<button class="d ${cls}" data-act="calDay" data-k="${k}">${d.getDate()}</button>`;
  }
  let list = [...S.sessions].sort((a, b) => b.start - a.start);
  if (calSel) list = list.filter(s => dkey(s.start) === calSel);
  const monthCount = S.sessions.filter(s => { const d = new Date(s.start); return d.getMonth() === mo && d.getFullYear() === y; }).length;
  return {
    html: topbar('Verlauf', 'Kalender & Einheiten') +
      `<div class="card gold-frame"><div class="cal-h"><button class="icon-btn" data-act="calNav" data-d="-1">‹</button><div style="text-align:center"><b>${MON[mo]} ${y}</b><div class="small muted">${pl(monthCount, 'Training', 'Trainings')}</div></div><button class="icon-btn" data-act="calNav" data-d="1">›</button></div>
      <div class="cal">${cells}</div><div class="legend"><span><i style="background:#E60000"></i>Oberkörper</span><span><i style="background:#D4AF37"></i>Bauch + Beine</span></div></div>
      <div class="sec-h"><span>${calSel ? dateDE(calSel) : 'Alle Einheiten'}</span>${calSel ? '<button class="small c-gold" data-act="calDay" data-k="">Alle zeigen</button>' : '<span class="line"></span>'}</div>
      ${list.length ? list.slice(0, 60).map(sessionCard).join('') : '<div class="empty">Keine Einheiten' + (calSel ? ' an diesem Tag' : '') + '.</div>'}`
  };
}

/* --- Session Zusammenfassung --- */
const cLab = (w, r, ps, ex) => (w ? fmt(w, 2) + (ps ? 'kg p.S.' : 'kg') + '×' : '') + fmt(r, 0) + (isSec(ex) ? 's' : (w ? '' : ' Wdh.'));
function carterText(s) {
  const st = sessionStats(s); const d = new Date(s.start);
  let t = `🏋️ Training ${WDL[d.getDay()]}, ${dateDE(dkey(s.start))} – ${DAYS[s.type].name}\n`;
  t += `Dauer ${dur(st.dur)} · ${pl(st.sets, "Arbeitssatz", "Arbeitssätze")} · Volumen ${fmt(st.vol, 0)} kg${s.kcal ? ' · ' + fmt(s.kcal, 0) + ' kcal aktiv' : ''}\n`;
  const extra = [];
  if (s.bodyweight) extra.push(`Körpergewicht ${fmt(s.bodyweight, 1)} kg`);
  if (s.feeling) extra.push(`Gefühl ${s.feeling}/5`);
  if (s.elbow != null) extra.push(`Ellenbogen-Schmerz ${s.elbow}/10`);
  if (extra.length) t += extra.join(' · ') + '\n';
  t += '\n';
  st.exIds.forEach(eid => {
    const ex = exById(eid); if (!ex) return;
    const parts = setsOfEx(s.id, eid).map(x => (x.warmup ? '(A) ' : '') + cLab(x.weight, x.reps, x.perSide, ex) +
      (x.drops && x.drops.length ? ' +Drop ' + x.drops.map(dd => { const de = dropEx(dd, ex); return de ? de.name + ' ' + (dd.w ? cLab(dd.w, dd.r, de.perSide, de) : 'KG×' + fmt(dd.r, 0) + (isSec(de) ? 's' : '')) : cLab(dd.w, dd.r, x.perSide, ex); }).join('→') : '') + (isPR(x) ? ' 🏆PR' : '') + (x.note ? ` (${x.note})` : ''));
    t += `• ${ex.name}: ${parts.join(', ')}\n`;
  });
  if (s.note) t += `\nNotiz: ${s.note}\n`;
  t += '\n(A) = Aufwärmsatz · p.S. = pro Seite';
  return t.trim();
}
function viewSession(id, fresh) {
  const s = sessById(id); if (!s) return { html: topbar('Nicht gefunden', '', '#/history') };
  const st = sessionStats(s); const d = new Date(s.start);
  const exHtml = st.exIds.map(eid => { const ex = exById(eid); if (!ex) return ''; return `<div class="sum-ex"><b>${esc(ex.name)}</b><div>${setsOfEx(s.id, eid).map(x => `${x.warmup ? '<span style="color:#777">A ' : ''}${setLabel(x, ex)}${x.drops && x.drops.length ? ' <span style="color:#ff7070">→ ' + dropLabel(x, ex) + '</span>' : ''}${x.warmup ? '</span>' : ''}${isPR(x) ? ' <span class="badge badge-pr">🏆</span>' : ''}`).join(' · ')}</div></div>`; }).join('');
  const mins = Math.round(st.dur / 60000);
  return {
    html: topbar(DAYS[s.type].name, WDL[d.getDay()] + ', ' + dateDE(dkey(s.start)), '#/history') +
      (fresh ? `<div class="card gold-frame sum-hero"><div class="trophy">🏆</div><div class="title gold" style="font-size:26px">Stark, Markus!</div><div class="muted">Training gespeichert.${st.prs ? ' ' + st.prs + '× Neuer Rekord!' : ''}</div></div>` : '') +
      `<div class="tiles"><div class="tile"><div class="v">${mins >= 60 ? Math.floor(mins / 60) + ':' + pad(mins % 60) : mins}<small style="font-size:12px;color:#888"> ${mins >= 60 ? 'h' : 'min'}</small></div><div class="k">Dauer</div></div><div class="tile"><div class="v">${fmt(st.vol, 0)}</div><div class="k">Volumen kg</div></div><div class="tile"><div class="v">${st.sets}</div><div class="k">Sätze</div></div>
      <div class="tile"><div class="v">${st.exIds.length}</div><div class="k">Übungen</div></div><div class="tile kcal"><div class="v">${s.kcal ? fmt(s.kcal, 0) : '–'}</div><div class="k">Aktiv-kcal</div></div><div class="tile"><div class="v" style="color:var(--gold)">${st.prs}</div><div class="k">Rekorde</div></div></div>
      <div class="sec-h"><span>Tagesdaten (optional)</span><span class="line"></span></div>
      <div class="card">
        <div class="row"><div><label class="lbl" style="margin-top:0">Körpergewicht (kg)</label><input class="field" inputmode="decimal" data-sf="bodyweight" value="${fmtIn(s.bodyweight)}" placeholder="z. B. 78,4"></div>
        <div><label class="lbl" style="margin-top:0">Aktivkalorien</label><input class="field" inputmode="numeric" data-sf="kcal" value="${fmtIn(s.kcal)}" placeholder="kcal (Fitness)"></div></div>
        <label class="lbl">Gefühl <span class="scale-hint">(1 = schlecht · 5 = top)</span> <span id="feel-l">${s.feeling ? '· ' + FEEL[s.feeling] : ''}</span></label><div class="chips">${[1, 2, 3, 4, 5].map(i => `<button class="${s.feeling === i ? 'on' : ''}" data-act="feel" data-v="${i}" data-id="${s.id}">${i}</button>`).join('')}</div>
        <div class="scale-ends"><span>1 · schlecht</span><span>5 · top</span></div>
        <label class="lbl">Ellenbogen-Schmerz <span class="scale-hint">(0 = kein Schmerz · 10 = stark)</span></label>
        <div class="pain-val" id="elbow-box" style="color:${painCol(s.elbow)}"><b id="elbow-v">${s.elbow ?? '–'}</b><span>/ 10</span><em id="elbow-t">${painTxt(s.elbow)}</em></div>
        <input type="range" min="0" max="10" step="1" value="${s.elbow ?? 0}" data-sf="elbow">
        <div class="scale-ends"><span style="color:#30d158">0 · kein Schmerz</span><span style="color:#ffd60a">5</span><span style="color:#ff3b30">10 · stark</span></div>
        <label class="lbl">Notiz</label><textarea class="field" data-sf="note" placeholder="Schlaf, Energie, Besonderheiten…">${esc(s.note || '')}</textarea>
      </div>
      <button class="btn btn-gold" data-act="carter" data-id="${s.id}">📋 Für Carter exportieren</button>
      <div class="sec-h"><span>Übungen</span><span class="line"></span></div>
      <div class="card">${exHtml || '<div class="empty" style="padding:8px">Keine Sätze erfasst.</div>'}</div>
      ${!s.end ? `<button class="btn btn-red btn-sm" data-act="go" data-to="#/train" style="margin-bottom:10px">Training fortsetzen</button>` : ''}
      <button class="btn btn-danger btn-sm" data-act="delSession" data-id="${s.id}">Einheit löschen</button>`,
    mount() {
      $$('[data-sf]').forEach(el => {
        const h = () => { const f = el.dataset.sf; let v = f === 'note' ? el.value : num(el.value); if (f === 'elbow') { v = parseInt(el.value, 10); $('#elbow-v').textContent = v; $('#elbow-t').textContent = painTxt(v); $('#elbow-box').style.color = painCol(v); } s[f] = v; save('sessions', s); };
        el.addEventListener(el.type === 'range' ? 'input' : 'change', h);
      });
    }
  };
}

/* --- Messungen --- */
function metricSeries(k) {
  const pts = S.measurements.filter(m => m[k] != null).map(m => ({ x: fromKey(m.date).getTime() + 43200000, y: m[k], id: m.id }));
  if (k === 'weight') S.sessions.filter(s => s.bodyweight).forEach(s => { const dk = dkey(s.start); if (!pts.some(p => dkey(p.x) === dk)) pts.push({ x: fromKey(dk).getTime() + 43200000, y: s.bodyweight, sess: s.id }); });
  return pts.sort((a, b) => a.x - b.x);
}
function viewMeasure() {
  const cards = METRICS.map((m, i) => {
    const ser = metricSeries(m.k); const last = ser[ser.length - 1], prev = ser[ser.length - 2];
    let dl = '<span class="eq-c">noch keine Daten</span>';
    if (last && prev) { const d = Math.round((last.y - prev.y) * 10) / 10; const good = m.goodDown ? d < 0 : d > 0; dl = d === 0 ? '<span class="eq-c">± 0</span>' : `<span class="${good ? 'dn-c' : 'up-c'}">${d > 0 ? '▲ +' : '▼ '}${fmt(d, m.d)} ${m.u}</span>`; }
    else if (last) dl = `<span class="eq-c">${dateDE(dkey(last.x))}</span>`;
    const col = i === 0 ? '#E60000' : i < 3 ? '#D4AF37' : '#ff4040';
    return `<a class="mcard ${i === 0 ? 'wide' : ''}" href="#/measure/${m.k}"><div class="k">${m.l}<span>${m.u}</span></div><div class="v">${last ? fmt(last.y, m.d) : '–'}<small>${m.u}</small></div><div class="dl">${dl}</div>${spark(ser.slice(-12).map(p => p.y), col)}</a>`;
  }).join('');
  return {
    html: topbar('Messungen', 'Körper & Fitness') + dashboardCard() +
      `<button class="btn btn-red" data-act="addMeasure" style="margin-bottom:6px">+ Messung erfassen</button>
      <div class="sec-h"><span>Werte</span><span class="line"></span></div><div class="mgrid">${cards}</div>
      <div class="hint">Tipp: Umfänge immer zur gleichen Zeit messen (morgens, nüchtern, entspannt). Das Körpergewicht aus den Trainings fließt automatisch in die Kurve ein.</div>`
  };
}
function viewMetric(k) {
  const m = METRICS.find(x => x.k === k); if (!m) return { html: topbar('?', '', '#/measure') };
  const ser = metricSeries(k); const vals = ser.map(p => p.y);
  return {
    html: topbar(m.l, 'Messung · ' + m.u, '#/measure') +
      `<div class="kpis"><div class="kpi"><div class="k">Aktuell</div><div class="v">${vals.length ? fmt(vals[vals.length - 1], m.d) : '–'}</div></div><div class="kpi"><div class="k">Min</div><div class="v">${vals.length ? fmt(Math.min(...vals), m.d) : '–'}</div></div><div class="kpi"><div class="k">Max</div><div class="v">${vals.length ? fmt(Math.max(...vals), m.d) : '–'}</div></div></div>
      <div class="card gold-frame">${lineChart(ser, { unit: m.u, d: m.d, empty: 'Noch keine Werte erfasst.' })}</div>
      <button class="btn btn-red btn-sm" data-act="addMeasure" style="margin-bottom:6px">+ Wert erfassen</button>
      <div class="sec-h"><span>Einträge</span><span class="line"></span></div>
      <div class="card">${ser.length ? [...ser].reverse().map(p => `<div class="pr-row"><span>${dateDE(dkey(p.x))}${p.sess ? ' <span class="small muted">(Training)</span>' : ''}</span><span><b>${fmt(p.y, m.d)} ${m.u}</b>${p.id ? ` <button class="small" style="color:#ff6b6b;margin-left:10px;padding:6px" data-act="delMeasure" data-id="${p.id}" data-k="${k}">✕</button>` : ''}</span></div>`).join('') : '<div class="empty" style="padding:10px">Keine Einträge.</div>'}</div>`
  };
}
function measureSheet() {
  const lastOf = k => { const s = metricSeries(k); return s.length ? s[s.length - 1].y : null; };
  openSheet(`<h3>Messung erfassen</h3><div class="muted small">Nur ausfüllen, was du gemessen hast.</div>
    <label class="lbl">Datum</label><input class="field" type="date" id="m-date" value="${dkey()}">
    <div class="mform">${METRICS.map(m => `<div><label class="lbl">${m.l} (${m.u})</label><input class="field" inputmode="decimal" data-mk="${m.k}" placeholder="${lastOf(m.k) != null ? 'zuletzt ' + fmt(lastOf(m.k), m.d) : '–'}"></div>`).join('')}</div>
    <div style="height:14px"></div><button class="btn btn-red" data-act="saveMeasure">Speichern</button>`);
}

/* --- Mehr / Einstellungen --- */
function viewMore() {
  return {
    html: topbar('Mehr', 'Einstellungen & Daten') +
      `<div class="card"><label class="lbl" style="margin-top:0">Wochenziel Trainings</label>
       <div class="stp" style="max-width:220px"><button data-act="goal" data-d="-1">−</button><input readonly value="${S.meta.weekGoal || 6}"><button data-act="goal" data-d="1">+</button></div></div>
      <div class="card" style="padding:4px 14px">
        <a class="list-btn" href="#/exercises"><span class="ic">✎</span><span class="tx">Übungen verwalten<span>Bearbeiten, eigene hinzufügen, Fotos</span></span><span class="chev">›</span></a>
        <button class="list-btn" data-act="export"><span class="ic">⬇︎</span><span class="tx">Backup exportieren (JSON)<span>${S.sessions.length} Einheiten · ${S.sets.length} Sätze · ${S.measurements.length} Messungen</span></span></button>
        <button class="list-btn" data-act="import"><span class="ic">⬆︎</span><span class="tx">Backup importieren<span>Ersetzt alle aktuellen Daten</span></span></button>
        <button class="list-btn" data-act="carterLast"><span class="ic">📋</span><span class="tx">Letztes Training für Carter kopieren<span>Kompakte Zusammenfassung als Text</span></span></button>
      </div>
      <div class="card"><b class="gold">Datenschutz</b><div class="hint" style="color:var(--tx2)">Alle Daten liegen ausschließlich auf diesem Gerät. Kein Server, kein Konto, kein Tracking. Mach regelmäßig ein Backup (z. B. in „Dateien“ / iCloud Drive). Achtung: Wenn du die App vom Home-Bildschirm löschst, sind die Daten weg.</div></div>
      <button class="btn btn-danger btn-sm" data-act="wipe">Alle Daten löschen</button>
      <div class="foot">Voccola Gym Log v${APP_VERSION} · für Markus 💪</div>`
  };
}
function viewExercises() {
  const html = GROUPS.map(g => {
    const exs = S.exercises.filter(e => e.group === g && !e.hidden).sort((a, b) => a.order - b.order);
    return `<div class="sec-h"><span>${g}</span><span class="line"></span></div>` + exs.map(e => `<button class="ex" style="width:100%;text-align:left" data-act="editEx" data-id="${e.id}"><div class="th" ${e.photo ? `style="background-image:url('${e.photo}')"` : ''}>${e.photo ? '' : GROUP_ICON[g]}</div><div class="nm"><b>${esc(e.name)}</b><span>${isSec(e) ? 'Sekunden' : 'Wiederholungen'}${e.perSide ? ' · pro Seite' : ''}</span></div><span class="chev">›</span></button>`).join('');
  }).join('');
  return { html: topbar('Übungen', 'Verwalten', '#/train') + `<div class="row"><button class="btn btn-red btn-sm" data-act="picker">🔍 Aus Katalog wählen</button><button class="btn btn-ghost btn-sm" data-act="editEx" data-id="">+ Eigene Übung</button></div>` + html };
}
let exDraftPhoto;
function exSheet(id) {
  const e = exById(id) || { id: '', name: '', group: DAYS[(activeSession() && activeSession().type) || trainType || todayType() || 'upper'].groups[0], unit: 'reps', perSide: false, photo: null };
  exDraftPhoto = e.photo;
  openSheet(`<h3>${id ? 'Übung bearbeiten' : 'Neue Übung'}</h3>
    <label class="lbl">Name</label><input class="field" id="ex-name" value="${esc(e.name)}" placeholder="z. B. Butterfly Maschine">
    <label class="lbl">Muskelgruppe</label><select class="field" id="ex-group">${GROUPS.map(g => `<option ${g === e.group ? 'selected' : ''}>${g}</option>`).join('')}</select>
    <label class="lbl">Erfassung</label><div class="seg sm" id="ex-unit"><button class="${e.unit !== 'sec' ? 'on' : ''}" data-act="exUnit" data-u="reps">Wiederholungen</button><button class="${e.unit === 'sec' ? 'on' : ''}" data-act="exUnit" data-u="sec">⏱ Zeit statt Wiederholungen</button></div>
    <label class="lbl">Bereich (nur Arme)</label><select class="field" id="ex-sub">${['', 'Bizeps', 'Trizeps', 'Unterarme'].map(x => `<option value="${x}" ${x === (e.sub || '') ? 'selected' : ''}>${x || '–'}</option>`).join('')}</select>
    <div class="toggles"><button class="tgl ${e.perSide ? 'on' : ''}" id="ex-ps" data-act="exPs">Gewicht pro Seite (Standard)</button><button class="tgl ${e.elbow === 'e' ? 'on' : ''}" id="ex-elbow" data-act="exPs">🟢 Tennisarm-freundlich</button></div>
    <label class="lbl">Foto</label><div id="ex-photo" class="photo-hero" style="${e.photo ? `background-image:url('${e.photo}')` : 'display:none'}"></div>
    <div class="row"><button class="btn btn-ghost btn-sm" data-act="exPhoto" data-cam="1">📷 Aufnehmen</button><button class="btn btn-ghost btn-sm" data-act="exPhoto" data-cam="">🖼 Mediathek</button></div>
    <div style="height:16px"></div><button class="btn btn-red" data-act="saveEx" data-id="${e.id}">Speichern</button>
    ${id ? `<div style="height:8px"></div><button class="btn btn-danger btn-sm" data-act="hideEx" data-id="${e.id}">Übung entfernen</button><div class="hint">Bisherige Sätze bleiben im Verlauf erhalten.</div>` : ''}`);
}

/* --- Übungs-Katalog / Picker --- */
let pick = { f: null, q: '', elbow: false, mode: null };
function pickerList() {
  const q = pick.q.trim().toLowerCase();
  let exs = S.exercises.filter(e => (q ? true : pick.f === 'Körpergewicht' ? e.bw : filterOf(e) === pick.f) && (!pick.elbow || e.elbow === 'e') && (!q || e.name.toLowerCase().includes(q) || filterOf(e).toLowerCase().includes(q)));
  exs.sort((a, b) => PICK_FILTERS.indexOf(filterOf(a)) - PICK_FILTERS.indexOf(filterOf(b)) || (!!a.hidden - !!b.hidden) || a.name.localeCompare(b.name, 'de'));
  if (!exs.length) return '<div class="empty">Nichts gefunden. Eigene Übung über „Übungen verwalten“ anlegen.</div>';
  let out = '', last = '';
  exs.forEach(e => {
    const f = filterOf(e); if (q && f !== last) { out += `<div class="sec-h" style="margin:14px 2px 8px"><span>${f}</span><span class="line"></span></div>`; last = f; }
    out += `<div class="pick-row ${e.hidden ? '' : 'in'}"><div class="nm"><b>${esc(e.name)}</b><div>${e.bw ? '<span class="badge badge-warm">KG</span>' : ''}${elbowBadge(e)}${e.perSide ? '<span class="badge badge-warm">pro Seite</span>' : ''}${isSec(e) ? '<span class="badge badge-warm">Sekunden</span>' : ''}</div></div>
      ${pick.mode === 'drop' ? `<button class="btn btn-red btn-sm" style="width:auto;flex:none;padding:0 14px" data-act="pickDrop" data-id="${e.id}">Wählen</button>` : `<button class="pick-btn" data-act="pickToggle" data-id="${e.id}" aria-label="${e.hidden ? 'Hinzufügen' : 'Entfernen'}">${e.hidden ? '＋' : '✓'}</button>`}</div>`;
  });
  return out;
}
function pickerChips() {
  return (pick.mode === 'drop' ? ['Körpergewicht', ...PICK_FILTERS] : PICK_FILTERS).map(f => { const n = f === 'Körpergewicht' ? S.exercises.filter(e => e.bw).length : S.exercises.filter(e => filterOf(e) === f && !e.hidden).length; return `<button class="pchip ${pick.f === f && !pick.q ? 'on' : ''}" data-act="pickF" data-f="${f}">${f}<small>${n}</small></button>`; }).join('');
}
function openPicker(mode) {
  const act = activeSession(); const t = act ? act.type : (trainType || todayType() || 'upper');
  pick.mode = mode || null;
  if (pick.mode === 'drop') pick.f = 'Körpergewicht'; else if (!pick.f || pick.f === 'Körpergewicht') pick.f = t === 'lower' ? 'Bauch' : 'Brust';
  pick.q = '';
  if (pick.mode === 'drop') return openSheet(`<h3>Drop mit anderer Übung</h3><div class="muted small" style="margin-bottom:10px">Übung wählen – Körpergewicht-Übungen (KG) brauchen kein Gewicht.</div>
    <div class="pick-head"><input class="field" id="picker-q" type="search" placeholder="🔍 Suchen, z. B. Liegestütze, Dips…" autocomplete="off">
    <div class="pchips" id="picker-chips">${pickerChips()}</div></div>
    <div id="picker-list">${pickerList()}</div>
    <div style="height:12px"></div><button class="btn btn-ghost btn-sm" data-act="closeSheet">Abbrechen</button>`);
  openSheet(`<h3>Übungen auswählen</h3><div class="muted small" style="margin-bottom:10px">＋ nimmt die Übung in deinen Plan, ✓ entfernt sie wieder. Deine Daten bleiben erhalten.</div>
    <div class="pick-head"><input class="field" id="picker-q" type="search" placeholder="🔍 Suchen, z. B. Latzug, Curls, Kabel…" autocomplete="off">
    <div class="pchips" id="picker-chips">${pickerChips()}</div>
    <button class="tgl ${pick.elbow ? 'on' : ''}" data-act="pickElbow" style="margin-bottom:6px">🟢 Nur Tennisarm-freundlich</button></div>
    <div id="picker-list">${pickerList()}</div>
    <div style="height:12px"></div><button class="btn btn-red" data-act="pickDone">Fertig</button>`);
}
function refreshPicker() { const l = $('#picker-list'); if (l) l.innerHTML = pickerList(); const c = $('#picker-chips'); if (c) c.innerHTML = pickerChips(); }

/* ---------- Router ---------- */
function render(keepScroll) {
  const y = window.scrollY;
  timers.forEach(clearInterval); timers = [];
  const parts = (location.hash || '#/home').slice(2).split('/'); const r = parts[0] || 'home', a = parts[1];
  if (r !== 'ex') { ED = null; EDex = null; }
  let v;
  switch (r) {
    case 'train': v = viewTrain(); break;
    case 'ex': v = viewEx(a); break;
    case 'progress': v = viewProgress(a); break;
    case 'history': v = viewHistory(); break;
    case 'session': v = viewSession(a, parts[2] === 'neu'); break;
    case 'measure': v = a ? viewMetric(a) : viewMeasure(); break;
    case 'more': v = viewMore(); break;
    case 'exercises': v = viewExercises(); break;
    default: v = viewHome();
  }
  document.body.classList.toggle('home', r === 'home' || r === '');
  const tabOf = { ex: 'train', exercises: 'train', session: 'history' }[r] || r;
  $$('#tabs a').forEach(t => t.classList.toggle('on', t.dataset.tab === tabOf));
  app.innerHTML = `<div class="view" ${keepScroll ? 'style="animation:none"' : ''}>${v.html}</div>`;
  v.mount && v.mount();
  window.scrollTo(0, keepScroll ? y : 0);
  requestAnimationFrame(() => setTimeout(() => $$('.rings .fg').forEach(c => c.style.strokeDashoffset = c.dataset.off), 80));
  updateRest();
}
setInterval(() => { $$('[data-timer]').forEach(el => el.textContent = clock(Date.now() - +el.dataset.timer)); updateRest(); }, 1000);
function updateRest() {
  const el = $('#ed-rest'); if (!el) return;
  const show = restStart && activeSession() && Date.now() - restStart < 15 * 60000;
  el.innerHTML = show ? `⏱ Pause <span class="gold">${clock(Date.now() - restStart)}</span>` : '';
}

/* ---------- Actions ---------- */
const A = {
  go: d => go(d.to),
  closeSheet,
  ttype: d => { trainType = d.type; render(true); },
  start: async d => { trainType = d.type; await ensureSession(d.type); toast('Training gestartet – gib alles! 🔥'); go('#/train'); },
  finish: async () => {
    const act = activeSession(); if (!act) return;
    const st = sessionStats(act);
    if (!st.sets && !st.warm) { if (confirm('Noch keine Sätze erfasst. Training verwerfen?')) { await remove('sessions', act.id); await setMeta('activeSession', null); go('#/home'); } return; }
    if (!confirm('Training jetzt beenden?')) return;
    act.end = Date.now(); await save('sessions', act); await setMeta('activeSession', null); restStart = null;
    go('#/session/' + act.id + '/neu');
  },
  tgl: d => { readEditorInputs(); ED[d.f] = !ED[d.f]; render(true); },
  addDrop: () => { readEditorInputs(); openSheet(`<h3>Drop-Satz hinzufügen</h3><div class="muted small" style="margin-bottom:12px">Gleiche Übung mit weniger Gewicht – oder direkt eine andere Übung (z. B. Liegestütze).</div>
    <button class="btn btn-red" data-act="addDropSame">⬇ Drop gleiche Übung</button><div style="height:10px"></div>
    <button class="btn btn-outline-gold" data-act="addDropOther">⇄ Drop mit anderer Übung</button><div style="height:10px"></div>
    <button class="btn btn-ghost btn-sm" data-act="closeSheet">Abbrechen</button>`); },
  holdStart: () => holdStart(),
  holdStop: () => holdStop(),
  tgt: async d => { const ex = exById(EDex); ex.target = Math.max(5, Math.min(600, tgtOf(ex) + +d.d)); await save('exercises', ex); const t = $('#hold-tgt'); if (t) t.textContent = ex.target + ' s'; if (!TMR) { const s2 = $('#hold-sub'); if (s2) s2.textContent = 'Ziel ' + ex.target + ' s'; } else { if (TMR.hit && (Date.now() - TMR.start) / 1000 < ex.target) { TMR.hit = false; $('#hold').classList.remove('hit'); } holdTick(); } },
  addDropOther: () => openPicker('drop'),
  pickDrop: d => { const de = exById(d.id); if (!de || !ED) return; const prev = ED.drops.length ? ED.drops[ED.drops.length - 1] : { r: ED.reps };
    ED.drops.push({ ex: de.id, w: 0, r: Math.max(1, Math.round((prev.r || 10))) }); pick.mode = null; closeSheet(); render(true); },
  addDropSame: () => { closeSheet(); readEditorInputs(); const same = ED.drops.filter(x => !x.ex); const b = same.length ? same[same.length - 1] : { w: ED.weight, r: ED.reps }; ED.drops.push({ w: Math.max(0, Math.round(((b.w || 0) * .75) / 2.5) * 2.5), r: Math.max(1, Math.round((b.r || 8) * .8)) }); render(true); },
  rmDrop: d => { readEditorInputs(); ED.drops.splice(+d.i, 1); render(true); },
  saveSet,
  editSet: d => { const st = S.sets.find(x => x.id === d.id); if (!st) return; ED = { weight: st.weight, reps: st.reps, perSide: st.perSide, warmup: st.warmup, drops: (st.drops || []).map(x => ({ ...x })), note: st.note || '', editId: st.id }; render(true); setTimeout(() => { const e = $('#editor'); e && e.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50); },
  cancelEdit: () => { ED = prefill(exById(EDex), activeSession()); render(true); },
  delSet: async () => { if (!confirm('Satz löschen?')) return; await remove('sets', ED.editId); ED = prefill(exById(EDex), activeSession()); toast('Satz gelöscht'); render(true); },
  photo: d => {
    const ex = exById(d.id);
    openSheet(`<h3>Foto: ${esc(ex.name)}</h3><div class="muted small" style="margin-bottom:14px">Damit du Maschine & Einstellung sofort wiedererkennst.</div><div class="row"><button class="btn btn-red btn-sm" data-act="photoPick" data-id="${ex.id}" data-cam="1">📷 Aufnehmen</button><button class="btn btn-ghost btn-sm" data-act="photoPick" data-id="${ex.id}" data-cam="">🖼 Mediathek</button></div>${ex.photo ? `<div style="height:10px"></div><button class="btn btn-danger btn-sm" data-act="photoDel" data-id="${ex.id}">Foto entfernen</button>` : ''}`);
  },
  photoPick: async d => { closeSheet(); const img = await pickImage(!!d.cam); if (!img) return; const ex = exById(d.id); ex.photo = img; await save('exercises', ex); toast('Foto gespeichert ✓'); render(true); },
  photoDel: async d => { const ex = exById(d.id); ex.photo = null; await save('exercises', ex); closeSheet(); render(true); },
  pmetric: d => { progMetric = d.m; render(true); },
  calNav: d => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +d.d, 1); calSel = null; render(true); },
  calDay: d => { calSel = d.k && calSel !== d.k ? d.k : null; render(true); },
  feel: async d => { const s = sessById(d.id); s.feeling = s.feeling === +d.v ? null : +d.v; await save('sessions', s); render(true); },
  carter: async d => { const s = sessById(d.id); const txt = carterText(s); const ok = await copyText(txt); if (ok) toast('Kopiert ✓ – jetzt bei Carter einfügen', 2600); else openSheet(`<h3>Für Carter</h3><div class="muted small">Text markieren und kopieren:</div><textarea class="field" style="min-height:300px">${esc(txt)}</textarea>`); },
  carterLast: () => { const s = [...S.sessions].sort((a, b) => b.start - a.start)[0]; if (!s) return toast('Noch kein Training vorhanden'); A.carter({ id: s.id }); },
  delSession: async d => { if (!confirm('Diese Einheit inkl. aller Sätze löschen?')) return; for (const x of setsOf(d.id)) await remove('sets', x.id); await remove('sessions', d.id); if (S.meta.activeSession === d.id) await setMeta('activeSession', null); toast('Einheit gelöscht'); go('#/history'); },
  addMeasure: () => measureSheet(),
  saveMeasure: async () => {
    const m = { id: uid(), date: $('#m-date').value || dkey() }; let any = false;
    $$('[data-mk]').forEach(i => { const v = num(i.value); if (v != null) { m[i.dataset.mk] = v; any = true; } });
    if (!any) return toast('Bitte mindestens einen Wert eintragen');
    await save('measurements', m); closeSheet(); toast('Messung gespeichert ✓'); render(true);
  },
  delMeasure: async d => { const m = S.measurements.find(x => x.id === d.id); if (!m || !confirm('Wert löschen?')) return; delete m[d.k]; if (METRICS.some(x => m[x.k] != null)) await save('measurements', m); else await remove('measurements', m.id); render(true); },
  goal: async d => { await setMeta('weekGoal', Math.max(1, Math.min(14, (S.meta.weekGoal || 6) + +d.d))); render(true); },
  export: async () => {
    const data = JSON.stringify({ app: 'voccola-gym-log', version: APP_VERSION, exported: new Date().toISOString(), exercises: S.exercises, sessions: S.sessions, sets: S.sets, measurements: S.measurements, meta: S.meta });
    const name = `gymlog-backup-${dkey()}.json`; const blob = new Blob([data], { type: 'application/json' });
    try { const file = new File([blob], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Gym Log Backup' }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast('Backup erstellt ✓');
  },
  import: () => {
    const inp = $('#file-import'); inp.value = '';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text()); if (j.app !== 'voccola-gym-log' || !Array.isArray(j.sets)) throw new Error('keine gültige Gym-Log-Datei');
        if (!confirm(`Backup vom ${new Date(j.exported).toLocaleString('de-DE')} importieren? Aktuelle Daten werden ersetzt.`)) return;
        for (const s of STORES) await DB.clear(s);
        S.exercises = []; S.sessions = []; S.sets = []; S.measurements = []; S.meta = {};
        for (const s of ['exercises', 'sessions', 'sets', 'measurements']) for (const r of j[s] || []) await save(s, r);
        for (const [k, v] of Object.entries(j.meta || {})) await setMeta(k, v);
        toast('Import erfolgreich ✓'); go('#/home');
      } catch (e) { toast('Import fehlgeschlagen: ' + e.message, 3500); }
    };
    inp.click();
  },
  wipe: async () => { if (!confirm('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.')) return; if (!confirm('Sicher? Vorher Backup gemacht?')) return; for (const s of STORES) await DB.clear(s); location.hash = '#/home'; location.reload(); },
  editEx: d => exSheet(d.id),
  exUnit: (d, el) => $$('#ex-unit button').forEach(b => b.classList.toggle('on', b === el)),
  exPs: (d, el) => el.classList.toggle('on'),
  exPhoto: async d => { const img = await pickImage(!!d.cam); if (!img) return; exDraftPhoto = img; const p = $('#ex-photo'); p.style.display = ''; p.style.backgroundImage = `url('${img}')`; },
  saveEx: async d => {
    const name = $('#ex-name').value.trim(); if (!name) return toast('Bitte einen Namen eingeben');
    const ex = exById(d.id) || { id: 'c' + uid(), order: Math.max(0, ...S.exercises.map(e => e.order || 0)) + 1, custom: true };
    Object.assign(ex, { name, group: $('#ex-group').value, unit: $('#ex-unit .on').dataset.u, perSide: $('#ex-ps').classList.contains('on'), photo: exDraftPhoto || null, sub: $('#ex-group').value === 'Arme' ? ($('#ex-sub').value || 'Bizeps') : undefined, elbow: $('#ex-elbow').classList.contains('on') ? 'e' : (ex.elbow === 'w' ? 'w' : undefined) });
    await save('exercises', ex); closeSheet(); toast('Übung gespeichert ✓'); render(true);
  },
  picker: () => openPicker(),
  pickF: d => { pick.f = d.f; pick.q = ''; const i = $('#picker-q'); if (i) i.value = ''; refreshPicker(); },
  pickElbow: (d, el) => { pick.elbow = !pick.elbow; el.classList.toggle('on', pick.elbow); refreshPicker(); },
  pickToggle: async d => { const ex = exById(d.id); ex.hidden = !ex.hidden; await save('exercises', ex); toast(ex.hidden ? 'Aus dem Plan entfernt' : '„' + ex.name + '“ hinzugefügt ✓', 1400); refreshPicker(); },
  pickDone: () => { closeSheet(); render(true); },
  hideEx: async d => { if (!confirm('Übung aus der Liste entfernen?')) return; const ex = exById(d.id); ex.hidden = true; await save('exercises', ex); closeSheet(); render(true); }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = A[el.dataset.act]; if (!fn) return; e.preventDefault(); fn(el.dataset, el);
});
document.addEventListener('change', e => { if (e.target.dataset.change === 'progEx') go('#/progress/' + e.target.value); });
document.addEventListener('input', e => { const el = e.target; if (el.id === 'picker-q') { pick.q = el.value; refreshPicker(); return; } if (ED && el.dataset && el.dataset.f && el.closest('#editor')) setEdField(el.dataset.f, el.value, el.dataset.f !== 'note'); });
document.addEventListener('focusin', e => { if (e.target.matches('.stp input')) setTimeout(() => { try { e.target.select(); } catch (_) { } }, 30); });
// Stepper: Tippen = 1 Schritt, Gedrückthalten = schnell
let holdT, holdI;
const stopHold = () => { clearTimeout(holdT); clearInterval(holdI); };
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-step]'); if (!b) return;
  e.preventDefault(); stopHold(); doStep(b);
  holdT = setTimeout(() => { holdI = setInterval(() => doStep(b), 90); }, 450);
});
['pointerup', 'pointercancel', 'pointerleave', 'scroll'].forEach(t => document.addEventListener(t, stopHold, true));
window.addEventListener('hashchange', () => { closeSheet(); render(); });

/* ---------- Start ---------- */
(async function init() {
  try { await loadAll(); } catch (e) { app.innerHTML = `<div class="card" style="margin-top:40px"><b>Speicher nicht verfügbar</b><div class="hint">${esc(e.message)} – bitte Safari nicht im privaten Modus verwenden.</div></div>`; return; }
  S.meta.qIdx = Math.floor(Math.random() * QUOTES.length);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
  render();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
})();
