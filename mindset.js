/* Voccola Gym Log – Mindset (v1.8.5). Eigene Daten in localStorage 'vgl-mind', berührt sonst nichts.
   Übungen kommen morgens per Nachricht von Rocco – hier nur abhaken + kurze Notiz. */
'use strict';
(function () {
const KEY = 'vgl-mind', C = MINDCORE;
const ld = () => { try { return C.norm(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) { return C.norm({}); } };
const sv = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (_) { toast('Speichern fehlgeschlagen'); return false; } };
const okKey = k => /^\d{4}-\d{2}-\d{2}$/.test(k || '') && k <= dkey();
let cur = null; // gewählter Tag aus der URL (#/mind/JJJJ-MM-TT), sonst heute
const sel = () => (cur && okKey(cur)) ? cur : dkey();

function viewMind(a) {
  cur = okKey(a) ? a : null;
  const d = ld(), k = sel(), today = dkey(), x = C.get(d, k), isToday = k === today;
  const st = C.streak(d, today), w = C.last7(d, today);
  const lbl = isToday ? 'Heute' : k === C.shift(today, -1) ? 'Gestern' : WDL[fromKey(k).getDay()];
  const chk = (f, t, sub) => `<button class="card mind-row ${x[f] ? 'ok' : ''}" data-act="mindTgl" data-f="${f}" data-d="${k}"><span class="mob-chk ${x[f] ? 'on' : ''}">${x[f] ? '✓' : ''}</span><span class="mind-rt"><b>${t}</b><span class="muted small">${sub}</span></span></button>`;
  return {
    html: topbar('Mindset', 'Kopf & Auftreten', null) + `
    <div class="card mind-day"><button class="icon-btn" data-act="mindDay" data-n="-1" aria-label="Tag zurück">‹</button>
      <div class="mind-date"><b>${lbl}</b><span class="muted small">${WD[fromKey(k).getDay()]} ${dateDE(k)}${isToday ? '' : ' · Nachtrag'}</span></div>
      <button class="icon-btn" data-act="mindDay" data-n="1" aria-label="Tag vor" ${isToday ? 'disabled style="opacity:.25"' : ''}>›</button></div>
    ${chk('k', '🧠 Kopf-Übung', 'z. B. Zahlen rückwärts, Merk-Test, Atmung')}
    ${chk('s', '🗣️ Souverän kommunizieren', 'z. B. 3-Sekunden-Pause, Nein ohne Begründung')}
    <input class="field mind-note" id="mind-note" data-d="${k}" maxlength="200" enterkeyhint="done" placeholder="Notiz (optional): welche Übung, wie lief's?" value="${esc(x.note)}">
    <div class="card mind-wk"><div class="mind-dots">${w.map(o => `<button class="mind-dot" data-act="mindGo" data-d="${o.k}"><i class="lv${o.lv} ${o.k === k ? 'sel' : ''}"></i><small>${WD[fromKey(o.k).getDay()]}</small></button>`).join('')}</div>
      <div class="muted small mind-st"><span class="gold" style="font-weight:800">${st}</span> ${st === 1 ? 'Tag' : 'Tage'} in Folge 🔥 · ● beide · ◐ eine</div></div>`,
    mount() { const n = document.getElementById('mind-note'); if (!n) return;
      n.addEventListener('input', () => sv(C.set(ld(), n.dataset.d, { note: n.value })));
      n.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); n.blur(); } }); }
  };
}
window.viewMind = viewMind;

Object.assign(A, {
  mindTgl: dd => { const d = ld(); const x = C.get(d, dd.d); const nd = C.set(d, dd.d, { [dd.f]: !x[dd.f] }); if (!sv(nd)) return;
    if (!x[dd.f]) { try { navigator.vibrate && navigator.vibrate(40); } catch (_) { } if (C.level(nd, dd.d) === 2) toast('Beide erledigt – stark, Markus! 💪', 1600); }
    render(true); },
  mindDay: dd => { const k = C.shift(sel(), +dd.n); if (!okKey(k)) return; go(k === dkey() ? '#/mind' : '#/mind/' + k); },
  mindGo: dd => go(dd.d === dkey() ? '#/mind' : '#/mind/' + dd.d)
});
})();
