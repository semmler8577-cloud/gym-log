/* Voccola Gym Log – Ernährung (v1.8.0). Eigene IndexedDB 'vgl-food', berührt Trainings- und Hüftdaten nicht.
   Keine automatische Foto-Erkennung: Fotos sind Erinnerung/Beleg, Werte kommen aus der Datenbank bzw. vom Etikett. */
'use strict';
(function () {
const C = window.NUTCORE;
const ST = ['foods', 'combos', 'entries', 'photos', 'meta'];
const FDB = {
  db: null,
  open() { return new Promise((res, rej) => { const r = indexedDB.open('vgl-food', 1);
    r.onupgradeneeded = () => { const d = r.result; ST.forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); }); };
    r.onsuccess = () => { this.db = r.result; res(); }; r.onerror = () => rej(r.error); }); },
  tx(s, mode, fn) { return new Promise((res, rej) => { const t = this.db.transaction(s, mode); const q = fn(t.objectStore(s)); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); },
  all(s) { return this.tx(s, 'readonly', st => st.getAll()); }, get(s, id) { return this.tx(s, 'readonly', st => st.get(id)); },
  put(s, v) { return this.tx(s, 'readwrite', st => st.put(v)); }, del(s, id) { return this.tx(s, 'readwrite', st => st.delete(id)); }, clear(s) { return this.tx(s, 'readwrite', st => st.clear()); }
};
const N = { foods: [], combos: [], entries: [], meta: {} };
const fById = id => N.foods.find(f => f.id === id), cById = id => N.combos.find(c => c.id === id), eById = id => N.entries.find(e => e.id === id);
const foodMap = () => { const m = {}; N.foods.forEach(f => m[f.id] = f); return m; };
async function put(store, obj) {
  if (store === 'meta') N.meta[obj.id] = obj.value;
  else if (store !== 'photos') { const a = N[store]; const i = a.findIndex(x => x.id === obj.id); if (i >= 0) a[i] = obj; else a.push(obj); }
  try { await FDB.put(store, obj); } catch (e) { toast('Speichern fehlgeschlagen: ' + e.message, 3500); throw e; }
}
async function del(store, id) { if (store !== 'photos') N[store] = N[store].filter(x => x.id !== id); await FDB.del(store, id); }
const setM = (k, v) => put('meta', { id: k, value: v });
async function load() {
  await FDB.open();
  for (const s of ['foods', 'combos', 'entries', 'meta']) { const rows = await FDB.all(s); if (s === 'meta') rows.forEach(r => N.meta[r.id] = r.value); else N[s] = rows; }
  if ((N.meta.seedVersion || 0) < C.SEED_VERSION) {
    // Nur fehlende Start-Produkte/Kombis ergänzen – eigene Änderungen bleiben unangetastet
    for (const f of C.FOODS) if (!fById(f.id)) await put('foods', Object.assign(JSON.parse(JSON.stringify(f)), { builtin: true, updated: Date.now() }));
    for (const c of C.COMBOS) if (!cById(c.id)) await put('combos', Object.assign(JSON.parse(JSON.stringify(c)), { builtin: true }));
    await setM('seedVersion', C.SEED_VERSION);
  }
}
const targets = () => Object.assign({}, C.DEF_TARGETS, N.meta.targets || {});
const K = v => fmt(C.rK(v), 0), M = v => fmt(C.rM(v), 1);
const mealName = m => (C.MEALS.find(x => x[0] === m) || C.MEALS[3])[1];
const entriesOf = k => N.entries.filter(e => e.date === k).sort((a, b) => a.ts - b.ts);
const shift = (k, d) => { const x = fromKey(k); x.setDate(x.getDate() + d); return dkey(x); };
const dayLabel = k => k === dkey() ? 'Heute' : k === shift(dkey(), -1) ? 'Gestern' : WDL[fromKey(k).getDay()];
const srcBadge = s => { const x = C.SRC[s]; return x ? `<span class="nut-src ${x.ok ? 'ok' : 'est'}">${x.ic} ${x.l}</span>` : ''; };
const srcWorst = list => list.find(s => C.SRC[s] && !C.SRC[s].ok) || list[0] || 'frei';
const bar = (v, t) => { const p = t > 0 ? v / t : 0; return `<div class="nut-bar ${p > 1.05 ? 'over' : p >= .95 ? 'hit' : ''}"><i style="width:${Math.min(100, p * 100).toFixed(1)}%"></i></div>`; };
let curDate = null;

/* ---------- Fotos (max. 800 px JPEG + Mini-Vorschau) ---------- */
function pickPhoto(cam) {
  return new Promise(res => {
    const inp = cam ? $('#file-cam') : $('#file-lib'); inp.value = '';
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return res(null);
      try { const big = await resizeImage(f, 800); const thumb = await new Promise((ok, no) => { const im = new Image(); im.onload = () => { const s = Math.min(1, 120 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .7)); }; im.onerror = no; im.src = big; });
        res({ big, thumb }); } catch (e) { toast('Foto konnte nicht geladen werden'); res(null); } };
    inp.click();
  });
}
async function showPhoto(id, el) { if (!id || !el) return; try { const p = await FDB.get('photos', id); if (p) el.style.backgroundImage = `url('${p.data}')`; } catch (_) { } }

/* ---------- Tagesansicht ---------- */
function totalsCard(t, tg, compact) {
  const rest = tg.kcal - C.rK(t.kcal);
  return `<div class="card gold-frame nut-tot">
    <div class="nut-kc"><div><span class="nut-big">${K(t.kcal)}</span><small> / ${fmt(tg.kcal, 0)} kcal</small></div><div class="nut-rest ${rest < 0 ? 'over' : ''}">${rest >= 0 ? 'noch <b>' + fmt(rest, 0) + '</b> kcal' : '<b>+' + fmt(-rest, 0) + '</b> kcal drüber'}</div></div>
    ${bar(t.kcal, tg.kcal)}
    <div class="nut-mac">${[['p', 'Eiweiß'], ['c', 'Kohlenhydr.'], ['f', 'Fett']].map(([k, l]) => `<div><div class="k">${l}</div><div class="v">${M(t[k])}<small> / ${fmt(tg[k], 0)} g</small></div>${bar(t[k], tg[k])}</div>`).join('')}</div>
    ${t.inc ? '<div class="hint" style="color:#ffd60a">◐ Bei einem Produkt fehlen KH/Fett-Angaben – Summe dort unvollständig.</div>' : ''}
    ${compact ? '' : ''}</div>`;
}
function entryRow(e) {
  return `<button class="nut-row" data-act="nutEntry" data-id="${e.id}"><span class="nut-th" ${e.thumb ? `style="background-image:url('${e.thumb}')"` : ''}>${e.thumb ? '' : e.kind === 'combo' ? (e.icon || '🍽') : e.kind === 'free' ? '✎' : '•'}</span>
    <span class="nut-rt"><b>${esc(e.name)}</b><span>${esc(e.text || '')}${e.src && C.SRC[e.src] && !C.SRC[e.src].ok ? ' · <i class="est">' + C.SRC[e.src].ic + ' ' + C.SRC[e.src].l + '</i>' : ''}${e.inc ? ' · <i class="est">◐ unvollst.</i>' : ''}</span></span>
    <span class="nut-kv"><b>${K(e.kcal)}</b><small>kcal · ${M(e.p)} P</small></span></button>`;
}
function viewFood(a) {
  const k = a && /^\d{4}-\d\d-\d\d$/.test(a) ? a : dkey(); curDate = k; const today = dkey();
  const es = entriesOf(k), t = C.sumEntries(es), tg = targets(), y = entriesOf(shift(k, -1));
  const quick = N.combos.slice().sort((a, b) => (b.builtin ? 1 : 0) - (a.builtin ? 1 : 0)).map(c => { const v = C.calcCombo(c, foodMap(), 1);
    return `<button class="nut-q" data-act="nutCombo1" data-id="${c.id}"><span>${esc(c.icon || '🍽')}</span><b>${esc(c.name)}</b><small>${K(v.kcal)} kcal · ${M(v.p)} P</small></button>`; }).join('');
  const meals = C.MEALS.map(([m, n, ic]) => { const me = es.filter(e => e.meal === m), ym = y.filter(e => e.meal === m), mt = C.sumEntries(me);
    return `<div class="sec-h"><span>${ic} ${n}${me.length ? ` <small class="nut-ms">${K(mt.kcal)} kcal · ${M(mt.p)} g P</small>` : ''}</span><span class="line"></span></div>
      <div class="card nut-meal">${me.map(entryRow).join('')}
      <div class="nut-mbtns"><button class="btn btn-ghost btn-sm" data-act="nutAdd" data-meal="${m}">＋ ${n}</button>${ym.length ? `<button class="btn btn-outline-gold btn-sm" data-act="nutRepeat" data-meal="${m}">↻ Wie gestern <small>(${K(C.sumEntries(ym).kcal)} kcal)</small></button>` : ''}</div></div>`; }).join('');
  let avg = '';
  { const days = []; for (let i = 1; i <= 7; i++) { const d = entriesOf(shift(k, -i)); if (d.length) days.push(C.sumEntries(d)); }
    if (days.length) avg = `<div class="hint" style="text-align:center">Ø letzte ${days.length === 1 ? 'Tag' : days.length + ' Tage mit Einträgen'}: <b style="color:#fff">${fmt(days.reduce((s, d) => s + d.kcal, 0) / days.length, 0)} kcal</b> · ${fmt(days.reduce((s, d) => s + d.p, 0) / days.length, 0)} g Eiweiß</div>`; }
  return {
    html: topbar('Ernährung', 'Kalorien & Makros', null, `<button class="icon-btn" data-act="nutGoals" aria-label="Ziele">🎯</button>`) +
      `<div class="nut-daynav"><button class="icon-btn" data-act="go" data-to="#/food/${shift(k, -1)}" aria-label="Vortag">‹</button>
        <div><b>${dayLabel(k)}</b><span>${dateDE(k)}</span></div>
        ${k < today ? `<button class="icon-btn" data-act="go" data-to="#/food/${shift(k, 1) === today ? '' : shift(k, 1)}" aria-label="Nächster Tag">›</button>` : '<span class="icon-btn" style="opacity:.25">›</span>'}</div>
      ${k !== today ? `<button class="btn btn-ghost btn-sm" data-act="go" data-to="#/food" style="margin-bottom:10px">Zu heute springen</button>` : ''}
      ${totalsCard(t, tg)}
      <button class="btn btn-red" data-act="nutAdd" data-meal="">＋ Essen eintragen</button>
      <div class="nut-quick">${quick}<button class="nut-q add" data-act="nutComboEdit" data-id=""><span>＋</span><b>Eigene Kombi</b><small>speichern</small></button></div>
      ${meals}
      <div class="card" style="padding:4px 14px;margin-top:18px">
        <a class="list-btn" href="#/foods"><span class="ic">🗂</span><span class="tx">Lebensmittel & Kombis<span>${N.foods.length} Produkte · ${N.combos.length} Kombis · neu, ändern, löschen</span></span><span class="chev">›</span></a>
        <button class="list-btn" data-act="nutCopyDay"><span class="ic">📋</span><span class="tx">Tag für Carter kopieren<span>Kompakte Zusammenfassung als Text</span></span></button>
      </div>${avg}
      <div class="hint">📷 Fotos werden nur gespeichert, nicht automatisch erkannt. Die Werte kommen immer aus deiner Datenbank (Etikett). ≈ = Schätzung/Standardwert, ◐ = teils ergänzt.</div>`
  };
}

/* ---------- Eintragen: Auswahl ---------- */
let ADD = { meal: 's', q: '' };
function pickRow(kind, id, extra, sub) {
  const it = kind === 'c' ? cById(id) : fById(id); if (!it) return '';
  let s = sub;
  if (!s) { if (kind === 'c') { const v = C.calcCombo(it, foodMap(), 1); s = `Kombi · ${K(v.kcal)} kcal · ${M(v.p)} g P`; }
    else s = it.per100 ? `${K(it.per100.kcal)} kcal · ${M(it.per100.p)} g P pro 100 ${it.unit === 'ml' ? 'ml' : 'g'}` : (it.portions[0] && it.portions[0].v ? `${K(it.portions[0].v.kcal)} kcal pro ${esc(it.portions[0].n)}` : ''); }
  return `<button class="nut-row" data-act="nutPick" data-k="${kind}" data-id="${id}" ${extra || ''}><span class="nut-th">${kind === 'c' ? esc(it.icon || '🍽') : it.fav ? '★' : (it.photo ? '📷' : '•')}</span><span class="nut-rt"><b>${esc(it.name)}</b><span>${s}${kind === 'f' && C.SRC[it.src] && !C.SRC[it.src].ok ? ' · <i class="est">' + C.SRC[it.src].ic + '</i>' : ''}</span></span><span class="chev">›</span></button>`;
}
function addList() {
  const q = ADD.q.trim();
  if (q) {
    const cs = N.combos.filter(c => C.matches(c.name, q)), fs = N.foods.filter(f => C.matches(f.name + ' ' + (f.brand || ''), q)).sort((a, b) => !!b.fav - !!a.fav || a.name.localeCompare(b.name, 'de'));
    if (!cs.length && !fs.length) return `<div class="empty" style="padding:16px">Nichts gefunden.<br><button class="btn btn-outline-gold btn-sm" style="margin-top:10px" data-act="nutFoodEdit" data-id="" data-name="${esc(q)}">＋ „${esc(q)}“ als Produkt anlegen</button></div>`;
    return cs.map(c => pickRow('c', c.id)).join('') + fs.map(f => pickRow('f', f.id)).join('');
  }
  const rec = C.rankRecent(N.entries, dkey(), 30).slice(0, 8);
  const recHTML = rec.map(r => { const e = r.e; if (e.kind === 'combo') return cById(e.comboId) ? pickRow('c', e.comboId, `data-amt="${e.amount}"`, `zuletzt ${fmt(e.amount, 2)}× · ${r.n}× in 30 Tagen`) : '';
    const f = fById(e.foodId); if (!f) return ''; const ok = e.mode === 'g' || (f.portions[e.pi || 0]);
    return ok ? pickRow('f', e.foodId, `data-amt="${e.amount}" data-mode="${e.mode}" data-pi="${e.pi || 0}"`, `zuletzt ${esc(C.amountText(f, e.mode, e.amount, e.pi))} · ${r.n}×`) : ''; }).join('');
  const recIds = new Set(rec.map(r => r.key));
  const favs = N.foods.filter(f => f.fav && !recIds.has('f:' + f.id)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const rest = N.foods.filter(f => !f.fav && !recIds.has('f:' + f.id)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const sec = (t, h) => h ? `<div class="sec-h" style="margin:14px 2px 6px"><span>${t}</span><span class="line"></span></div>${h}` : '';
  return sec('Zuletzt & oft', recHTML) + sec('Kombis', N.combos.filter(c => !recIds.has('c:' + c.id)).map(c => pickRow('c', c.id)).join('')) + sec('★ Favoriten', favs.map(f => pickRow('f', f.id)).join('')) + sec('Alle Produkte', rest.map(f => pickRow('f', f.id)).join(''));
}
function addSheet(meal) {
  ADD = { meal: meal || C.defaultMeal(new Date().getHours()), q: '' };
  openSheet(`<h3>Eintragen · ${mealName(ADD.meal)}</h3><div class="muted small">${dayLabel(curDate || dkey())}, ${dateDE(curDate || dkey())}</div>
    <input class="field" id="nut-q" type="search" placeholder="🔍 Produkt oder Kombi suchen …" autocomplete="off" style="margin-top:10px">
    <div class="row" style="margin-top:10px"><button class="btn btn-ghost btn-sm" data-act="nutFree">✎ Freie Eingabe / Foto</button><button class="btn btn-ghost btn-sm" data-act="nutFoodEdit" data-id="">＋ Neues Produkt</button></div>
    <div id="nut-list" style="margin-top:6px">${addList()}</div>`);
}

/* ---------- Eintragen: Menge ---------- */
let AM = null;
function amLive() {
  if (!AM) return C.calcItem(null);
  if (AM.kind === 'c') return C.calcCombo(cById(AM.id), foodMap(), AM.amount);
  return C.calcItem(fById(AM.id), AM.mode, AM.amount, AM.pi);
}
function liveHTML() {
  const v = amLive(); if (!v.ok && !(v.items && v.items.length)) return `<div class="nut-live off">Menge eingeben</div>`;
  return `<div class="nut-live"><div><b>${K(v.kcal)}</b><small>kcal</small></div><div><b>${M(v.p)}</b><small>g Eiweiß</small></div><div><b>${M(v.c)}</b><small>g KH</small></div><div><b>${M(v.f)}</b><small>g Fett</small></div></div>${v.inc ? '<div class="hint" style="color:#ffd60a">◐ Unvollständige Angaben – fehlende Werte zählen als 0.</div>' : ''}`;
}
const mealSeg = m => `<label class="lbl">Mahlzeit</label><div class="seg sm" id="nut-meal">${C.MEALS.map(([k, n]) => `<button class="${k === m ? 'on' : ''}" data-act="nutMeal" data-m="${k}">${n.replace('essen', '')}</button>`).join('')}</div>`;
const photoBox = () => `<label class="lbl">Foto (optional)</label><div id="nut-ph" class="nut-ph" style="${AM.thumb ? `background-image:url('${AM.big || AM.thumb}')` : 'display:none'}"></div>
  <div class="row"><button class="btn btn-ghost btn-sm" data-act="nutPhoto" data-cam="1">📷 Foto</button><button class="btn btn-ghost btn-sm" data-act="nutPhoto" data-cam="">🖼 Mediathek</button>${AM.thumb ? '<button class="btn btn-danger btn-sm" data-act="nutPhotoDel" style="flex:.5">✕</button>' : ''}</div>`;
function amountSheet(o) {
  AM = Object.assign({ meal: ADD.meal || C.defaultMeal(new Date().getHours()) }, o);
  const isC = AM.kind === 'c'; const it = isC ? cById(AM.id) : fById(AM.id); if (!it) return toast('Nicht gefunden');
  if (!isC) { if (AM.mode == null) AM.mode = it.portions.length ? 'p' : 'g'; if (AM.mode === 'g' && !it.per100) AM.mode = 'p'; if (AM.pi == null) AM.pi = 0;
    if (AM.amount == null) AM.amount = AM.mode === 'p' ? 1 : 100; }
  else if (AM.amount == null) AM.amount = 1;
  const u = !isC && it.unit === 'ml' ? 'ml' : 'g';
  const modes = isC ? '' : `<div class="seg sm" style="margin:12px 0 8px;flex-wrap:wrap">${it.portions.map((p, i) => `<button class="${AM.mode === 'p' && AM.pi === i ? 'on' : ''}" data-act="nutMode" data-mode="p" data-pi="${i}">${esc(p.n)}</button>`).join('')}${it.per100 ? `<button class="${AM.mode === 'g' ? 'on' : ''}" data-act="nutMode" data-mode="g">${u === 'ml' ? 'Milliliter' : 'Gramm'}</button>` : ''}</div>`;
  const chips = (isC || AM.mode === 'p' ? [0.5, 1, 1.5, 2, 3] : u === 'ml' ? [100, 200, 250, 300, 500] : [10, 30, 50, 100, 150, 200]).map(x => `<button class="pchip" data-act="nutChip" data-v="${x}">${fmt(x, 1)}</button>`).join('');
  const per = isC ? '' : `<div class="muted small" style="margin-top:4px">${it.per100 ? `pro 100 ${u}: ${K(it.per100.kcal)} kcal · ${M(it.per100.p)} P · ${M(it.per100.c)} KH · ${M(it.per100.f)} F` : ''} ${srcBadge(it.src)}</div>`;
  const items = isC ? `<div id="nut-items" class="muted small" style="margin-top:8px">${C.calcCombo(it, foodMap(), AM.amount).items.map(x => `• ${esc(x.name)}: ${esc(x.text)} – ${K(x.kcal)} kcal`).join('<br>')}</div>` : '';
  openSheet(`<h3>${esc(it.name)}</h3>${per}${modes}
    <label class="lbl">${isC ? 'Anzahl (× Kombi)' : AM.mode === 'p' ? 'Anzahl ' + esc(it.portions[AM.pi].n) : 'Menge in ' + u}</label>
    <input class="field nut-amt" id="nut-amt" inputmode="decimal" enterkeyhint="done" value="${fmtIn(AM.amount)}" autocomplete="off">
    <div class="nut-chips">${chips}</div>
    <div id="nut-livebox">${liveHTML()}</div>${items}
    ${mealSeg(AM.meal)}${photoBox()}
    <div style="height:14px"></div><button class="btn btn-red" data-act="nutSave">${AM.editId ? 'Änderung speichern' : 'Eintragen'}</button>
    ${!isC ? `<div style="height:8px"></div><button class="btn btn-ghost btn-sm" data-act="nutFoodEdit" data-id="${it.id}">Produkt bearbeiten</button>` : ''}`);
  const inp = $('#nut-amt'); if (inp && !AM.noFocus) { try { inp.focus(); inp.select(); } catch (_) { } }
}
function refreshLive() { const b = $('#nut-livebox'); if (b) b.innerHTML = liveHTML(); const its = $('#nut-items'); if (its && AM && AM.kind === 'c') its.innerHTML = C.calcCombo(cById(AM.id), foodMap(), AM.amount).items.map(x => `• ${esc(x.name)}: ${esc(x.text)} – ${K(x.kcal)} kcal`).join('<br>'); }
async function savePhotoFor(entry, ph) {
  if (!ph) return;
  if (ph.big) { const pid = entry.photoId || ('ph-' + uid()); await put('photos', { id: pid, data: ph.big }); entry.photoId = pid; entry.thumb = ph.thumb; }
}
function buildEntry(base) {
  const isC = AM.kind === 'c'; const it = isC ? cById(AM.id) : fById(AM.id); const v = amLive();
  if (!v.ok) return null;
  const e = Object.assign(base, { meal: AM.meal, kind: isC ? 'combo' : 'food', name: it.name, amount: C.r2(AM.amount), kcal: v.kcal, p: v.p, c: v.c, f: v.f, inc: !!v.inc });
  if (isC) Object.assign(e, { comboId: it.id, icon: it.icon, mode: null, pi: null, text: (AM.amount === 1 ? '' : fmt(AM.amount, 2) + '× · ') + v.items.map(x => x.name.split(' (')[0].replace(/^(EDEKA|ALDI|Lidl|Peak|ESN) /, '') ).join(', '), items: v.items, src: srcWorst(v.items.map(x => x.src)) });
  else Object.assign(e, { foodId: it.id, mode: AM.mode, pi: AM.mode === 'p' ? AM.pi : null, text: C.amountText(it, AM.mode, AM.amount, AM.pi), src: it.src, items: null });
  return e;
}
function vibe() { try { navigator.vibrate && navigator.vibrate(30); } catch (_) { } }

/* ---------- Freie Eingabe ---------- */
function freeSheet(e) {
  AM = { kind: 'free', meal: e ? e.meal : ADD.meal, editId: e ? e.id : null, thumb: e && e.thumb, photoId: e && e.photoId };
  const f = (id, l, v, ph) => `<div><label class="lbl">${l}</label><input class="field" id="${id}" inputmode="decimal" value="${v != null ? fmtIn(v) : ''}" placeholder="${ph || ''}"></div>`;
  openSheet(`<h3>${e ? 'Eintrag bearbeiten' : 'Freie Eingabe'}</h3><div class="muted small">Z. B. Restaurant, Familienessen. Werte so gut wie möglich – Foto als Erinnerung.</div>
    <label class="lbl">Was?</label><input class="field" id="nf-name" value="${esc(e ? e.name : '')}" placeholder="z. B. Hähnchen mit Reis">
    <div class="mform">${f('nf-kcal', 'kcal *', e && e.kcal, 'z. B. 650')}${f('nf-p', 'Eiweiß (g)', e && e.p)}${f('nf-c', 'Kohlenhydrate (g)', e && e.c)}${f('nf-f', 'Fett (g)', e && e.f)}</div>
    ${mealSeg(AM.meal)}${photoBox()}
    <div style="height:14px"></div><button class="btn btn-red" data-act="nutFreeSave">${e ? 'Speichern' : 'Eintragen'}</button>`);
  if (AM.photoId) { const el = $('#nut-ph'); if (el) { el.style.display = ''; showPhoto(AM.photoId, el); } }
}

/* ---------- Eintrag-Details ---------- */
function entrySheet(id) {
  const e = eById(id); if (!e) return;
  const its = e.items ? `<div class="card" style="padding:6px 12px;margin-top:10px">${e.items.map(x => `<div class="pr-row"><span>${esc(x.name)}<br><small class="muted">${esc(x.text)}</small></span><span><b>${K(x.kcal)}</b> <small class="muted">kcal · ${M(x.p)} P</small></span></div>`).join('')}</div>` : '';
  openSheet(`<h3>${esc(e.name)}</h3><div class="muted small">${mealName(e.meal)} · ${dateDE(e.date)} · ${new Date(e.ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · ${esc(e.text || '')}</div>
    <div class="nut-live" style="margin-top:12px"><div><b>${K(e.kcal)}</b><small>kcal</small></div><div><b>${M(e.p)}</b><small>g Eiweiß</small></div><div><b>${M(e.c)}</b><small>g KH</small></div><div><b>${M(e.f)}</b><small>g Fett</small></div></div>
    <div style="margin-top:8px">${srcBadge(e.src)}${e.inc ? ' <span class="nut-src est">◐ unvollständig</span>' : ''}</div>${its}
    ${e.photoId ? `<div id="nut-ph-full" class="nut-ph" style="margin-top:12px;background-image:url('${e.thumb || ''}')"></div>` : ''}
    <div style="height:14px"></div>
    <div class="row"><button class="btn btn-ghost btn-sm" data-act="nutEdit" data-id="${e.id}">✎ Ändern</button><button class="btn btn-ghost btn-sm" data-act="nutAgain" data-id="${e.id}">↻ Nochmal${e.date !== (curDate || dkey()) ? ' (dieser Tag)' : ''}</button></div>
    <div style="height:8px"></div><button class="btn btn-danger btn-sm" data-act="nutDel" data-id="${e.id}">Eintrag löschen</button>`);
  if (e.photoId) showPhoto(e.photoId, $('#nut-ph-full'));
}

/* ---------- Produkte ---------- */
let FQ = '';
function foodsList() {
  const fs = N.foods.filter(f => !FQ || C.matches(f.name, FQ)).sort((a, b) => !!b.fav - !!a.fav || a.name.localeCompare(b.name, 'de'));
  return fs.map(f => `<button class="nut-row" data-act="nutFoodEdit" data-id="${f.id}"><span class="nut-th" ${f.thumb ? `style="background-image:url('${f.thumb}')"` : ''}>${f.thumb ? '' : f.fav ? '★' : '•'}</span><span class="nut-rt"><b>${esc(f.name)}</b><span>${f.per100 ? `100 ${f.unit === 'ml' ? 'ml' : 'g'}: ${K(f.per100.kcal)} kcal · ${M(f.per100.p)} P · ${M(f.per100.c)} KH · ${M(f.per100.f)} F` : f.portions[0] && f.portions[0].v ? `1 ${esc(f.portions[0].n)}: ${K(f.portions[0].v.kcal)} kcal · ${M(f.portions[0].v.p)} P` : ''}${f.portions.length ? ' · ' + f.portions.map(p => esc(p.n) + (p.g ? ' ' + fmt(p.g, 1) + (f.unit === 'ml' ? ' ml' : ' g') : '')).join(', ') : ''}</span>${srcBadge(f.src)}</span><span class="chev">›</span></button>`).join('') || '<div class="empty">Nichts gefunden.</div>';
}
function viewFoods() {
  const cs = N.combos.map(c => { const v = C.calcCombo(c, foodMap(), 1); return `<button class="nut-row" data-act="nutComboEdit" data-id="${c.id}"><span class="nut-th">${esc(c.icon || '🍽')}</span><span class="nut-rt"><b>${esc(c.name)}</b><span>${K(v.kcal)} kcal · ${M(v.p)} P · ${M(v.c)} KH · ${M(v.f)} F${v.ok ? '' : ' · <i class="est">Produkt fehlt!</i>'}</span></span><span class="chev">›</span></button>`; }).join('');
  return { html: topbar('Lebensmittel', 'Datenbank & Kombis', '#/food') +
    `<div class="row"><button class="btn btn-red btn-sm" data-act="nutFoodEdit" data-id="">＋ Neues Produkt</button><button class="btn btn-outline-gold btn-sm" data-act="nutComboEdit" data-id="">＋ Neue Kombi</button></div>
    <div class="sec-h"><span>Kombis (ein Tipp)</span><span class="line"></span></div><div class="card nut-meal">${cs || '<div class="empty">Noch keine Kombi.</div>'}</div>
    <div class="sec-h"><span>Produkte (${N.foods.length})</span><span class="line"></span></div>
    <input class="field" id="nut-fq" type="search" placeholder="🔍 Suchen …" value="${esc(FQ)}" autocomplete="off" style="margin-bottom:10px">
    <div class="card nut-meal" id="nut-flist">${foodsList()}</div>
    <div class="hint">Quellen: 📷 Packungsfoto · 🏷 Hersteller-Etikett · 🗂 Datenbank · ◐ Etikett + ergänzt · ≈ Standardwert/Schätzung. kcal immer vom Etikett übernehmen – nicht aus den Makros rechnen.</div>` };
}
let FE = null;
function foodSheet(id, preName) {
  const f = fById(id) || { id: '', name: preName || '', unit: 'g', per100: { kcal: null, p: null, c: null, f: null }, portions: [], src: 'foto', note: '', fav: false };
  const open = document.body.classList.contains('sheet-open');
  FE = { id: f.id, photoId: f.photoId, thumb: f.thumb, big: null, fav: !!f.fav, unit: f.unit, ret: open && $('#nut-amt') && AM ? 'amount' : open && $('#nut-q') ? 'add' : 'list' };
  const p100 = f.per100 || {}; const p0 = f.portions[0] || {}, p1 = f.portions[1] || {};
  const inp = (id2, l, v, ph) => `<div><label class="lbl">${l}</label><input class="field" id="${id2}" inputmode="decimal" value="${v != null ? fmtIn(v) : ''}" placeholder="${ph || ''}"></div>`;
  openSheet(`<h3>${f.id ? 'Produkt bearbeiten' : 'Neues Produkt'}</h3><div class="muted small">Werte 1:1 vom Etikett abschreiben (Spalte „pro 100 g“).</div>
    <label class="lbl">Name</label><input class="field" id="fe-name" value="${esc(f.name)}" placeholder="z. B. Lidl Skyr Natur">
    <label class="lbl">Einheit</label><div class="seg sm" id="fe-unit"><button class="${f.unit !== 'ml' ? 'on' : ''}" data-act="nutFeUnit" data-u="g">pro 100 g</button><button class="${f.unit === 'ml' ? 'on' : ''}" data-act="nutFeUnit" data-u="ml">pro 100 ml</button></div>
    <div class="mform">${inp('fe-kcal', 'kcal *', p100.kcal, 'z. B. 275')}${inp('fe-p', 'Eiweiß (g)', p100.p)}${inp('fe-c', 'Kohlenhydrate (g)', p100.c)}${inp('fe-f', 'Fett (g)', p100.f)}</div>
    <div id="fe-chk"></div>
    <label class="lbl">Portion 1 (optional)</label><div class="row"><input class="field" id="fe-pn0" value="${esc(p0.n || '')}" placeholder="z. B. Brötchen"><input class="field" id="fe-pg0" inputmode="decimal" value="${p0.g ? fmtIn(p0.g) : ''}" placeholder="g / ml" style="max-width:110px"></div>
    <div class="row" style="margin-top:6px"><input class="field" id="fe-pk0" inputmode="decimal" value="${p0.v ? fmtIn(p0.v.kcal) : ''}" placeholder="kcal/Portion lt. Etikett"><input class="field" id="fe-pp0" inputmode="decimal" value="${p0.v ? fmtIn(p0.v.p) : ''}" placeholder="Eiweiß/Portion"></div>
    <div class="hint" style="margin-top:4px">Nur wenn das Etikett eigene Werte pro Portion nennt (z. B. „1 Brötchen = 209 kcal“). Sonst leer lassen – dann wird aus 100 g gerechnet.</div>
    <label class="lbl">Portion 2 (optional)</label><div class="row"><input class="field" id="fe-pn1" value="${esc(p1.n || '')}" placeholder="z. B. Scheibe"><input class="field" id="fe-pg1" inputmode="decimal" value="${p1.g ? fmtIn(p1.g) : ''}" placeholder="g / ml" style="max-width:110px"></div>
    <label class="lbl">Quelle der Werte</label><select class="field" id="fe-src">${Object.entries(C.SRC).filter(([k]) => k !== 'frei').map(([k, s]) => `<option value="${k}" ${k === f.src ? 'selected' : ''}>${s.ic} ${s.l}</option>`).join('')}</select>
    <label class="lbl">Notiz</label><input class="field" id="fe-note" value="${esc(f.note || '')}" placeholder="z. B. Packungsfoto 10.11.">
    <div class="toggles" style="margin-top:12px"><button class="tgl ${FE.fav ? 'on' : ''}" id="fe-fav" data-act="nutFeFav">★ Favorit (oben in der Liste)</button></div>
    <label class="lbl">Etikett-Foto</label><div id="fe-ph" class="nut-ph" style="${f.photoId ? `background-image:url('${f.thumb}')` : 'display:none'}"></div>
    <div class="row"><button class="btn btn-ghost btn-sm" data-act="nutFePhoto" data-cam="1">📷 Etikett</button><button class="btn btn-ghost btn-sm" data-act="nutFePhoto" data-cam="">🖼 Mediathek</button></div>
    <div style="height:14px"></div><button class="btn btn-red" data-act="nutFoodSave">Speichern</button>
    ${f.id ? `<div style="height:8px"></div><button class="btn btn-danger btn-sm" data-act="nutFoodDel" data-id="${f.id}">Produkt löschen</button><div class="hint">Bisherige Einträge behalten ihre Werte.</div>` : ''}`);
  if (f.photoId) showPhoto(f.photoId, $('#fe-ph'));
  feCheck();
}
function feVals() { const g = id => num(($('#' + id) || {}).value); return { kcal: g('fe-kcal'), p: g('fe-p'), c: g('fe-c'), f: g('fe-f') }; }
function feCheck() { const el = $('#fe-chk'); if (!el) return; const v = feVals(); const ch = C.labelCheck(v);
  el.innerHTML = v.kcal > 0 && v.p != null && v.c != null && v.f != null ? (ch.ok ? `<div class="hint" style="color:#30d158">✓ Etikett plausibel (Makros ≈ ${fmt(ch.est, 0)} kcal)</div>` : `<div class="hint" style="color:#ffd60a">⚠️ kcal passen nicht zu den Makros (≈ ${fmt(ch.est, 0)} kcal). Bitte Etikett prüfen – Zuckeralkohole/Ballaststoffe können das erklären.</div>`) : ''; }

/* ---------- Kombis ---------- */
let CE = null;
function comboSheet(id) {
  if (id !== undefined) { const c = cById(id); CE = c ? { id: c.id, name: c.name, icon: c.icon || '🍽', items: c.items.map(x => Object.assign({}, x)) } : { id: '', name: '', icon: '🍽', items: [] }; }
  const opts = sel => N.foods.slice().sort((a, b) => a.name.localeCompare(b.name, 'de')).map(f => `<option value="${f.id}" ${f.id === sel ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
  const rows = CE.items.map((it, i) => { const f = fById(it.foodId); const ms = f ? [...f.portions.map((p, j) => `<option value="p:${j}" ${it.mode === 'p' && (it.pi || 0) === j ? 'selected' : ''}>× ${esc(p.n)}</option>`), f.per100 ? `<option value="g" ${it.mode === 'g' ? 'selected' : ''}>${f.unit === 'ml' ? 'ml' : 'g'}</option>` : ''].join('') : '';
    return `<div class="nut-ci"><select class="field" data-ci="${i}" data-cf="food">${opts(it.foodId)}</select><div class="row"><input class="field" data-ci="${i}" data-cf="amount" inputmode="decimal" value="${fmtIn(it.amount)}"><select class="field" data-ci="${i}" data-cf="mode">${ms}</select><button class="icon-btn" data-act="nutCiDel" data-i="${i}" style="flex:none">✕</button></div></div>`; }).join('');
  openSheet(`<h3>${CE.id ? 'Kombi bearbeiten' : 'Neue Kombi'}</h3><div class="muted small">Mahlzeit, die du oft isst – danach mit einem Tipp eintragen.</div>
    <div class="row"><div style="flex:.3"><label class="lbl">Icon</label><input class="field" id="ce-icon" value="${esc(CE.icon)}" maxlength="4"></div><div><label class="lbl">Name</label><input class="field" id="ce-name" value="${esc(CE.name)}" placeholder="z. B. Abend-Shake"></div></div>
    <label class="lbl">Zutaten</label>${rows || '<div class="muted small">Noch keine Zutat.</div>'}
    <button class="btn btn-ghost btn-sm" data-act="nutCiAdd" style="margin-top:8px">＋ Zutat</button>
    <div id="ce-live" style="margin-top:10px"></div>
    <div style="height:14px"></div><button class="btn btn-red" data-act="nutComboSave">Speichern</button>
    ${CE.id ? `<div style="height:8px"></div><button class="btn btn-danger btn-sm" data-act="nutComboDel" data-id="${CE.id}">Kombi löschen</button>` : ''}`);
  ceLive();
}
function ceRead() { if (!CE) return; const n = $('#ce-name'), ic = $('#ce-icon'); if (n) CE.name = n.value; if (ic) CE.icon = ic.value || '🍽';
  $$('[data-ci]').forEach(el => { const it = CE.items[+el.dataset.ci]; if (!it) return; const k = el.dataset.cf;
    if (k === 'food' && it.foodId !== el.value) { it.foodId = el.value; const f = fById(el.value); it.mode = f && f.portions.length ? 'p' : 'g'; it.pi = 0; it.amount = it.mode === 'p' ? 1 : 100; }
    else if (k === 'amount') it.amount = num(el.value) || 0; else if (k === 'mode') { if (el.value === 'g') { it.mode = 'g'; it.pi = null; } else { it.mode = 'p'; it.pi = +el.value.split(':')[1]; } } }); }
function ceLive() { const el = $('#ce-live'); if (!el || !CE) return; const v = C.calcCombo(CE, foodMap(), 1); el.innerHTML = CE.items.length ? `<div class="nut-live"><div><b>${K(v.kcal)}</b><small>kcal</small></div><div><b>${M(v.p)}</b><small>g Eiweiß</small></div><div><b>${M(v.c)}</b><small>g KH</small></div><div><b>${M(v.f)}</b><small>g Fett</small></div></div>` : ''; }

/* ---------- Ziele ---------- */
function goalsSheet() {
  const t = targets(); let kg = null; try { const s = metricSeries('weight'); if (s.length) kg = s[s.length - 1].y; } catch (_) { }
  const inp = (id, l, v) => `<div><label class="lbl">${l}</label><input class="field" id="${id}" inputmode="decimal" value="${fmtIn(v)}"></div>`;
  openSheet(`<h3>Tagesziele</h3><div class="muted small">Lean Bulk: leichter Überschuss, viel Eiweiß.</div>
    <div class="mform">${inp('g-kcal', 'kcal', t.kcal)}${inp('g-p', 'Eiweiß (g)', t.p)}${inp('g-c', 'Kohlenhydrate (g)', t.c)}${inp('g-f', 'Fett (g)', t.f)}</div>
    <div class="hint">Empfehlung Muskelaufbau: 1,6–2,2 g Eiweiß pro kg Körpergewicht${kg ? ` – bei ${fmt(kg, 1)} kg also ${fmt(kg * 1.8, 0)}–${fmt(kg * 2.2, 0)} g (aktuell ${fmt(t.p / kg, 1)} g/kg)` : ''}. Fett mind. ca. 0,8 g/kg. Rest Kohlenhydrate. Standard: 2.800 kcal · 170 g Eiweiß · 350 g KH · 80 g Fett.</div>
    <div id="g-chk" class="hint"></div>
    <div style="height:14px"></div><button class="btn btn-red" data-act="nutGoalsSave">Speichern</button><div style="height:8px"></div><button class="btn btn-ghost btn-sm" data-act="nutGoalsReset">Standard wiederherstellen</button>`);
}

/* ---------- Text für Carter ---------- */
function dayText(k) {
  const es = entriesOf(k), t = C.sumEntries(es), tg = targets();
  const out = [`Ernährung – ${WD[fromKey(k).getDay()]} ${dateDE(k)}`, `Gesamt: ${K(t.kcal)} / ${fmt(tg.kcal, 0)} kcal · Eiweiß ${M(t.p)} / ${fmt(tg.p, 0)} g · KH ${M(t.c)} g · Fett ${M(t.f)} g${t.inc ? ' (teils unvollständig)' : ''}`];
  for (const [m, n] of C.MEALS) { const me = es.filter(e => e.meal === m); if (!me.length) continue; out.push('', n + ':'); me.forEach(e => out.push(`• ${e.name}${e.text ? ' (' + e.text + ')' : ''}: ${K(e.kcal)} kcal, ${M(e.p)} g P${e.src && C.SRC[e.src] && !C.SRC[e.src].ok ? ' [' + C.SRC[e.src].l + ']' : ''}`)); }
  return out.join('\n');
}

/* ---------- Aktionen ---------- */
async function logCombo(id, meal, factor) {
  const c = cById(id); const v = C.calcCombo(c, foodMap(), factor || 1); if (!v.items.length) return toast('Kombi ist leer oder ein Produkt fehlt');
  AM = { kind: 'c', id, amount: factor || 1, meal }; const e = buildEntry({ id: uid(), date: curDate || dkey(), ts: Date.now() });
  await put('entries', e); vibe(); return e;
}
Object.assign(A, {
  nutAdd: d => addSheet(d.meal),
  nutPick: d => { const o = { kind: d.k, id: d.id, meal: ADD.meal }; if (d.amt) o.amount = +d.amt; if (d.mode) { o.mode = d.mode; o.pi = +d.pi || 0; } amountSheet(o); },
  nutMode: d => { const f = fById(AM.id); const was = AM.mode; const g = C.gramsOf(f, AM.mode, AM.amount, AM.pi);
    AM.mode = d.mode; AM.pi = d.mode === 'p' ? +d.pi : null;
    if (d.mode === 'g') AM.amount = was === 'p' && g ? g : (was === 'g' ? AM.amount : 100); else if (was === 'g') AM.amount = 1;
    AM.noFocus = true; amountSheet(AM); },
  nutChip: d => { AM.amount = +d.v; const i = $('#nut-amt'); if (i) i.value = fmtIn(AM.amount); refreshLive(); },
  nutMeal: (d, el) => { AM.meal = d.m; $$('#nut-meal button').forEach(b => b.classList.toggle('on', b === el)); },
  nutPhoto: async d => { const ph = await pickPhoto(!!d.cam); if (!ph) return; AM.big = ph.big; AM.thumb = ph.thumb; AM.newPhoto = ph; const el = $('#nut-ph'); if (el) { el.style.display = ''; el.style.backgroundImage = `url('${ph.big}')`; } toast('Foto übernommen ✓', 1200); },
  nutPhotoDel: () => { AM.big = null; AM.thumb = null; AM.newPhoto = null; AM.dropPhoto = true; const el = $('#nut-ph'); if (el) el.style.display = 'none'; },
  nutSave: async () => {
    const inp = $('#nut-amt'); if (inp) AM.amount = num(inp.value);
    const old = AM.editId ? eById(AM.editId) : null;
    const e = buildEntry(old ? Object.assign({}, old) : { id: uid(), date: curDate || dkey(), ts: Date.now() });
    if (!e) return toast('Bitte gültige Menge eingeben');
    if (AM.dropPhoto && !AM.newPhoto && e.photoId) { await del('photos', e.photoId); e.photoId = null; e.thumb = null; }
    await savePhotoFor(e, AM.newPhoto); await put('entries', e); vibe();
    closeSheet(); toast(`✓ ${e.name}: ${K(e.kcal)} kcal · ${M(e.p)} g P`, 1800); AM = null; render(true);
  },
  nutCombo1: async d => { const e = await logCombo(d.id, C.defaultMeal(new Date().getHours())); if (!e) return; toast(`✓ ${e.name} → ${mealName(e.meal)} (${K(e.kcal)} kcal)`, 2200); render(true); },
  nutRepeat: async d => { const k = curDate || dkey(); const ys = entriesOf(shift(k, -1)).filter(e => e.meal === d.meal); if (!ys.length) return;
    let n = 0; for (const y of ys) { const c = Object.assign({}, y, { id: uid(), date: k, ts: Date.now() + n++, photoId: null, thumb: null }); await put('entries', c); }
    vibe(); toast(`✓ ${mealName(d.meal)} wie gestern übernommen`, 1800); render(true); },
  nutEntry: d => entrySheet(d.id),
  nutEdit: d => { const e = eById(d.id); if (!e) return;
    if (e.kind === 'free' || (e.kind === 'food' && !fById(e.foodId)) || (e.kind === 'combo' && !cById(e.comboId))) return freeSheet(e);
    ADD.meal = e.meal; amountSheet(e.kind === 'combo' ? { kind: 'c', id: e.comboId, amount: e.amount, meal: e.meal, editId: e.id, thumb: e.thumb, noFocus: true } : { kind: 'f', id: e.foodId, mode: e.mode, pi: e.pi || 0, amount: e.amount, meal: e.meal, editId: e.id, thumb: e.thumb, noFocus: true });
    if (e.photoId) showPhoto(e.photoId, $('#nut-ph')); },
  nutAgain: async d => { const e = eById(d.id); if (!e) return; const c = Object.assign({}, e, { id: uid(), date: curDate || dkey(), ts: Date.now(), photoId: null, thumb: null }); await put('entries', c); vibe(); closeSheet(); toast(`✓ ${e.name} nochmal eingetragen`); render(true); },
  nutDel: async d => { const e = eById(d.id); if (!e || !confirm(`„${e.name}“ löschen?`)) return; if (e.photoId && !N.entries.some(x => x !== e && x.photoId === e.photoId)) await del('photos', e.photoId); await del('entries', e.id); closeSheet(); toast('Gelöscht'); render(true); },
  nutFree: () => freeSheet(null),
  nutFreeSave: async () => {
    const g = id => num($('#' + id).value); const name = $('#nf-name').value.trim() || 'Mahlzeit'; const kcal = g('nf-kcal');
    if (!(kcal >= 0) || kcal == null) return toast('Bitte kcal eintragen');
    const old = AM.editId ? eById(AM.editId) : null;
    const e = Object.assign(old ? Object.assign({}, old) : { id: uid(), date: curDate || dkey(), ts: Date.now() }, { kind: 'free', name, meal: AM.meal, kcal: C.r2(kcal), p: C.r2(g('nf-p') || 0), c: C.r2(g('nf-c') || 0), f: C.r2(g('nf-f') || 0), inc: false, src: 'frei', text: 'freie Eingabe', foodId: null, comboId: null, items: null, mode: null, amount: null });
    if (AM.dropPhoto && !AM.newPhoto && e.photoId) { await del('photos', e.photoId); e.photoId = null; e.thumb = null; }
    await savePhotoFor(e, AM.newPhoto); await put('entries', e); vibe(); closeSheet(); toast(`✓ ${name}: ${K(e.kcal)} kcal`); AM = null; render(true);
  },
  nutFoodEdit: d => foodSheet(d.id, d.name),
  nutFeUnit: (d, el) => { FE.unit = d.u; $$('#fe-unit button').forEach(b => b.classList.toggle('on', b === el)); },
  nutFeFav: (d, el) => { FE.fav = !FE.fav; el.classList.toggle('on', FE.fav); },
  nutFePhoto: async d => { const ph = await pickPhoto(!!d.cam); if (!ph) return; FE.big = ph.big; FE.thumb = ph.thumb; const el = $('#fe-ph'); el.style.display = ''; el.style.backgroundImage = `url('${ph.big}')`; },
  nutFoodSave: async () => {
    const name = $('#fe-name').value.trim(); if (!name) return toast('Bitte Namen eingeben');
    const v = feVals(); const g = id => num($('#' + id).value);
    const portions = []; for (const i of [0, 1]) { const n = $('#fe-pn' + i).value.trim(), gw = g('fe-pg' + i); const pk = i === 0 ? g('fe-pk0') : null, pp = i === 0 ? g('fe-pp0') : null;
      if (n || gw || pk != null) { const p = { n: n || 'Portion', g: gw > 0 ? gw : null }; if (pk != null) p.v = { kcal: pk, p: pp, c: null, f: null }; portions.push(p); } }
    if (v.kcal == null && !portions.some(p => p.v)) return toast('Bitte kcal pro 100 g (oder pro Portion) eintragen');
    if (v.kcal != null && !C.labelCheck(v).ok && !confirm('Die kcal passen nicht zu den Makros. Trotzdem so speichern (Etikett geprüft)?')) return;
    for (const p of portions) if (p.v && v.kcal != null && p.g) { // fehlende Makros pro Portion aus 100 g ergänzen
      for (const k of ['p', 'c', 'f']) if (p.v[k] == null && v[k] != null) p.v[k] = C.r2(v[k] * p.g / 100); }
    if (portions.some(p => !p.v && !p.g)) return toast('Portion braucht ein Gewicht (g/ml)');
    if (v.kcal == null && portions.some(p => !p.v)) return toast('Ohne 100-g-Werte braucht jede Portion eigene kcal');
    const old = fById(FE.id) || {};
    const f = Object.assign({}, old, { id: FE.id || 'u-' + uid(), name, unit: FE.unit === 'ml' ? 'ml' : 'g', per100: v.kcal != null ? { kcal: v.kcal, p: v.p ?? 0, c: v.c ?? 0, f: v.f ?? 0 } : null, portions, src: $('#fe-src').value, note: $('#fe-note').value.trim(), fav: FE.fav, updated: Date.now() });
    if (FE.big) { const pid = f.photoId || 'lab-' + uid(); await put('photos', { id: pid, data: FE.big }); f.photoId = pid; f.thumb = FE.thumb; }
    const ret = FE.ret; await put('foods', f); toast('Produkt gespeichert ✓'); FE = null;
    if (ret === 'amount' && AM && AM.kind === 'f' && AM.id === f.id) { amountSheet({ kind: 'f', id: f.id, meal: AM.meal, editId: AM.editId, thumb: AM.thumb, newPhoto: AM.newPhoto, big: AM.big, noFocus: true }); }
    else if (ret === 'add' || ret === 'amount') { amountSheet({ kind: 'f', id: f.id, meal: ADD.meal }); }
    else { closeSheet(); render(true); }
  },
  nutFoodDel: async d => { const f = fById(d.id); if (!f) return; const inC = N.combos.filter(c => c.items.some(i => i.foodId === f.id));
    if (!confirm(`„${f.name}“ löschen?${inC.length ? '\nAchtung: wird in Kombi(s) verwendet: ' + inC.map(c => c.name).join(', ') : ''}`)) return;
    if (f.photoId) await del('photos', f.photoId); await del('foods', f.id); closeSheet(); toast('Produkt gelöscht'); render(true); },
  nutComboEdit: d => comboSheet(d.id || ''),
  nutCiAdd: () => { ceRead(); const f = N.foods.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'))[0]; if (!f) return; CE.items.push({ foodId: f.id, mode: f.portions.length ? 'p' : 'g', pi: 0, amount: f.portions.length ? 1 : 100 }); comboSheet(); },
  nutCiDel: d => { ceRead(); CE.items.splice(+d.i, 1); comboSheet(); },
  nutComboSave: async () => { ceRead(); if (!CE.name.trim()) return toast('Bitte Namen eingeben'); const items = CE.items.filter(i => i.amount > 0 && fById(i.foodId)); if (!items.length) return toast('Mindestens eine Zutat mit Menge');
    const old = cById(CE.id) || {}; await put('combos', Object.assign({}, old, { id: CE.id || 'uc-' + uid(), name: CE.name.trim(), icon: CE.icon, items })); CE = null; closeSheet(); toast('Kombi gespeichert ✓'); render(true); },
  nutComboDel: async d => { const c = cById(d.id); if (!c || !confirm(`Kombi „${c.name}“ löschen?`)) return; await del('combos', c.id); closeSheet(); toast('Kombi gelöscht'); render(true); },
  nutGoals: () => goalsSheet(),
  nutGoalsSave: async () => { const g = id => num($('#' + id).value); const t = { kcal: g('g-kcal'), p: g('g-p'), c: g('g-c'), f: g('g-f') };
    if (Object.values(t).some(v => !(v > 0))) return toast('Bitte alle Ziele > 0 eintragen'); await setM('targets', t); closeSheet(); toast('Ziele gespeichert ✓'); render(true); },
  nutGoalsReset: async () => { await setM('targets', null); closeSheet(); toast('Standardziele aktiv'); render(true); },
  nutCopyDay: async () => { const txt = dayText(curDate || dkey()); const ok = await copyText(txt); if (ok) toast('Kopiert ✓ – jetzt bei Carter einfügen', 2600); else openSheet(`<h3>Für Carter</h3><textarea class="field" style="min-height:300px">${esc(txt)}</textarea>`); }
});
document.addEventListener('input', e => { const el = e.target;
  if (el.id === 'nut-q') { ADD.q = el.value; const l = $('#nut-list'); if (l) l.innerHTML = addList(); }
  else if (el.id === 'nut-amt' && AM) { AM.amount = num(el.value); refreshLive(); }
  else if (el.id === 'nut-fq') { FQ = el.value; const l = $('#nut-flist'); if (l) l.innerHTML = foodsList(); }
  else if (el.id && el.id.startsWith('fe-')) feCheck();
  else if (el.dataset && el.dataset.cf === 'amount' && CE) { ceRead(); ceLive(); } });
document.addEventListener('change', e => { const el = e.target; if (el.dataset && (el.dataset.cf === 'food' || el.dataset.cf === 'mode') && CE) { ceRead(); comboSheet(); } });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'nut-amt') { e.preventDefault(); A.nutSave(); } });

/* ---------- Schnittstellen für app.js ---------- */
window.viewFood = viewFood; window.viewFoods = viewFoods;
window.NUT = {
  ready: load().catch(e => { console.warn('Ernährung: Speicher nicht verfügbar', e); }),
  homeCard() { const k = dkey(); const t = C.sumEntries(entriesOf(k)), tg = targets();
    return `<a class="card nut-home" href="#/food"><div class="sec-h" style="margin:0 0 8px"><span>🍽 Ernährung heute</span><span class="line"></span></div>
      <div class="nut-kc"><div><span class="nut-big" style="font-size:24px">${K(t.kcal)}</span><small> / ${fmt(tg.kcal, 0)} kcal</small></div><div class="nut-rest"><b>${M(t.p)}</b> / ${fmt(tg.p, 0)} g Eiweiß</div></div>${bar(t.kcal, tg.kcal)}${bar(t.p, tg.p)}</a>`; },
  async dump() { const o = {}; for (const s of ST) o[s] = await FDB.all(s); return o; },
  _cache: null, prefetch() { this._cache = null; this.dump().then(d => { this._cache = { d, t: Date.now() }; }).catch(() => { }); }, cached() { const c = this._cache; return c && Date.now() - c.t < 60000 ? c.d : null; },
  async restore(d) { if (!d || !Array.isArray(d.entries)) return false; for (const s of ST) { await FDB.clear(s); for (const r of d[s] || []) await FDB.put(s, r); }
    N.foods = []; N.combos = []; N.entries = []; N.meta = {}; await load(); return true; },
  count: () => ({ entries: N.entries.length, foods: N.foods.length }),
  _N: N, dayText
};
})();
