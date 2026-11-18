/* Voccola Gym Log – Hüft-Beweglichkeit (v1.9.2: Hüft-Reha ohne Sekunden-Timer, Wdh. pro Seite; v1.9.1: weitere MRT-Pausen und Cues nach Doc-Regeln, kein Vorbeugen mit überkreuzten Beinen; v1.9.0: HipFit + Seitlage-Abduktion, Gluteus-medius-Seitstütz, einbeinige Brücke; Pause bis nach MRT; Schmerz-Ampel; Alltag/Schlaf/Gym; MRT-Fragen LCE/Torsion/Zweitmeinung). Eigene Daten in localStorage 'vgl-mob', berührt Trainingsdaten nicht. */
'use strict';
(function () {
const KEY = 'vgl-mob';
const ld = () => { try { return Object.assign({ today: null, history: [] }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) { return { today: null, history: [] }; } };
const sv = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (_) { } };
const tk = () => dkey();
function day() { const d = ld(); if (!d.today || d.today.date !== tk()) { d.today = { date: tk(), done: {}, sets: {}, log: {}, reps: {}, extra: { m: [], a: [] } }; sv(d); } if (!d.today.extra) d.today.extra = { m: [], a: [] }; if (!Array.isArray(d.today.extra.m)) d.today.extra.m = []; if (!Array.isArray(d.today.extra.a)) d.today.extra.a = []; if (!d.today.reps) d.today.reps = {}; return d; }

/* ---------- Strichfiguren ---------- */
const FG = '#ececee', FAR = '#8d8d94', ARW = '#D4AF37', GR = '#3a3a40';
const L = (a, b, c, w = 4.5) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const PL = (pts, c, w = 4.5) => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
function fig(p) {
  let s = p.x || '';
  if (p.k2) s += PL([p.p, p.k2, p.f2], FAR);
  if (p.e2) s += PL([p.n, p.e2, p.w2], FAR);
  s += p.c ? `<path d="M${p.n} Q${p.c} ${p.p}" fill="none" stroke="${FG}" stroke-width="5" stroke-linecap="round"/>` : L(p.n, p.p, FG, 5);
  if (p.k1) s += PL([p.p, p.k1, p.f1], FG);
  if (p.e1) s += PL([p.n, p.e1, p.w1], FG);
  s += `<circle cx="${p.h[0]}" cy="${p.h[1]}" r="7.5" fill="#0b0b0c" stroke="${FG}" stroke-width="3.5"/>`;
  return s;
}
const arrow = (d, id) => `<path d="${d}" fill="none" stroke="${ARW}" stroke-width="3" stroke-linecap="round" marker-end="url(#ah${id})"/>`;
let SVGN = 0;
function panel(label, pose, arrows = '') { return { label, pose, arrows }; }
function svg(panels) {
  const id = ++SVGN; const W = 180, H = 104;
  const g = panels.map((pn, i) => `<g transform="translate(${i * (W + 12)} 0)"><rect x="0" y="0" width="${W}" height="${H + 18}" rx="12" fill="rgba(255,255,255,.035)" stroke="rgba(212,175,55,.18)"/>
    <line x1="8" y1="94" x2="${W - 8}" y2="94" stroke="${GR}" stroke-width="2"/><g transform="translate(0 4)">${fig(pn.pose)}${pn.arrows}</g>
    <text x="${W / 2}" y="${H + 11}" text-anchor="middle" font-size="11" font-weight="700" fill="${i ? ARW : '#a9a9b0'}" letter-spacing="1">${pn.label}</text></g>`).join('');
  const tw = panels.length * W + (panels.length - 1) * 12;
  return `<svg class="mob-svg" viewBox="0 0 ${tw} ${H + 18}" xmlns="http://www.w3.org/2000/svg" role="img"><defs><marker id="ah${id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${ARW}"/></marker></defs>${g.replace(/url\(#ah\d+\)/g, `url(#ah${id})`)}</svg>`;
}
// Grundposen
const quad = (o = {}) => Object.assign({ h: [28, 58], n: [42, 56], p: [112, 56], k1: [112, 90], f1: [148, 90], k2: [108, 90], f2: [144, 90], e1: [42, 73], w1: [42, 90], e2: [46, 73], w2: [46, 90] }, o);
const ILL = {
  catcow: () => svg([panel('KATZE', quad({ c: [77, 26], h: [32, 74] }), arrow('M77 46 V24', 0)), panel('KUH', quad({ c: [77, 74], h: [26, 44] }), arrow('M77 54 V76', 0))]),
  hipflex: () => { const b = { k1: [62, 60], f1: [62, 90], k2: [116, 90], f2: [150, 86], e1: [108, 40], w1: [100, 56], e2: [86, 40], w2: [94, 56] };
    return svg([panel('START', Object.assign({}, b, { h: [90, 12], n: [90, 26], p: [92, 60] })), panel('DEHNEN', Object.assign({}, b, { k1: [62, 60], h: [100, 12], n: [100, 26], p: [102, 60], e1: [118, 40], w1: [110, 56], e2: [96, 40], w2: [104, 56] }), arrow('M84 72 H112', 0) + arrow('M126 52 q8 10 0 20', 0))]); },
  wgs: () => { const b = { h: [50, 40], n: [62, 46], p: [102, 62], k1: [56, 62], f1: [50, 90], k2: [130, 76], f2: [160, 88] };
    return svg([panel('START', Object.assign({}, b, { e1: [52, 68], w1: [42, 90], e2: [56, 68], w2: [46, 90] }), arrow('M70 70 q-6 10 -14 16', 0)), panel('AUFDREHEN', Object.assign({}, b, { h: [56, 34], e1: [52, 68], w1: [42, 90], e2: [64, 26], w2: [66, 6] }), arrow('M40 52 q4 -28 18 -40', 0))]); },
  n9090: () => { const b = { h: [90, 22], n: [90, 36], p: [90, 80] };
    return svg([panel('KNIE LINKS', Object.assign({}, b, { k1: [52, 86], f1: [40, 66], k2: [126, 86], f2: [104, 72], e1: [118, 58], w1: [130, 88], e2: [64, 58], w2: [52, 88] }), arrow('M58 44 q32 -22 64 0', 0)), panel('KNIE RECHTS', Object.assign({}, b, { k1: [128, 86], f1: [140, 66], k2: [54, 86], f2: [76, 72], e1: [62, 58], w1: [50, 88], e2: [116, 58], w2: [128, 88] }), arrow('M122 44 q-32 -22 -64 0', 0))]); },
  bridge: () => { const b = { h: [22, 82], k1: [118, 60], f1: [140, 90], k2: [114, 60], f2: [136, 90], e1: [64, 88], w1: [86, 89] };
    return svg([panel('UNTEN', Object.assign({}, b, { n: [38, 84], p: [96, 84] })), panel('OBEN 2 s', Object.assign({}, b, { n: [40, 82], p: [96, 58], e1: [62, 88], w1: [84, 89] }), arrow('M96 86 V66', 0))]); },
  birddog: () => svg([panel('START', quad()), panel('STRECKEN 3 s', quad({ e1: [22, 54], w1: [4, 52], k1: [142, 56], f1: [174, 54] }), arrow('M30 42 H8', 0) + arrow('M146 44 H170', 0))]),
  deadbug: () => { const b = { h: [22, 82], n: [38, 84], p: [100, 84] };
    return svg([panel('START', Object.assign({}, b, { e1: [42, 62], w1: [44, 40], e2: [38, 62], w2: [40, 40], k1: [100, 56], f1: [130, 56], k2: [104, 56], f2: [134, 56] })), panel('STRECKEN', Object.assign({}, b, { e1: [42, 62], w1: [44, 40], e2: [20, 68], w2: [4, 80], k1: [102, 56], f1: [132, 56], k2: [136, 76], f2: [170, 82] }), arrow('M34 46 q-20 6 -26 24', 0) + arrow('M138 50 q22 4 30 22', 0))]); },
  kneel: () => { const b = { k1: [62, 60], f1: [62, 90], k2: [116, 90], f2: [150, 86] };
    return svg([panel('KNIESTAND', Object.assign({}, b, { h: [92, 12], n: [92, 26], p: [94, 60], e1: [108, 40], w1: [100, 56], e2: [86, 40], w2: [94, 56] })), panel('ARM HOCH', Object.assign({}, b, { h: [100, 14], n: [100, 28], p: [102, 60], e1: [92, 12], w1: [82, 0], e2: [96, 42], w2: [106, 56] }), arrow('M80 72 H110', 0))]); },
  pigeon: () => { const b = { k1: [60, 90], f1: [100, 88], k2: [130, 92], f2: [172, 92] };
    return svg([panel('AUFRECHT', Object.assign({}, b, { h: [86, 28], n: [88, 42], p: [96, 84], e1: [78, 64], w1: [70, 90], e2: [96, 64], w2: [104, 90] })), panel('VORBEUGEN', Object.assign({}, b, { h: [32, 70], n: [46, 72], p: [96, 84], e1: [30, 82], w1: [14, 90], e2: [34, 84], w2: [18, 92] }), arrow('M80 30 q-30 4 -42 30', 0))]); },
  turtle: () => svg([panel('SITZEN', { h: [56, 22], n: [58, 36], p: [62, 84], k1: [104, 64], f1: [140, 90], k2: [100, 64], f2: [136, 90], e1: [72, 56], w1: [96, 66] }), panel('SCHILDKRÖTE', { h: [112, 76], n: [98, 70], c: [72, 58], p: [62, 84], k1: [108, 62], f1: [146, 90], k2: [104, 62], f2: [142, 90], e1: [118, 84], w1: [146, 94] }, arrow('M60 26 q34 0 48 30', 0))])
  ,tuer: () => { const x = '<path d="M30 92 V6 H150 V92" fill="none" stroke="#8d8d94" stroke-width="3" opacity=".7"/>';
    const b = { x, h: [90, 18], n: [90, 32], k1: [84, 66], f1: [100, 92], k2: [96, 66], f2: [80, 92] };
    return svg([panel('EINSPANNEN', Object.assign({}, b, { p: [90, 62], e1: [62, 34], w1: [32, 40], e2: [118, 34], w2: [148, 40] }), arrow('M74 76 H58', 0) + arrow('M106 76 H122', 0)), panel('HÜFTE RAUS', Object.assign({}, b, { h: [102, 18], n: [100, 32], c: [92, 46], p: [76, 62], k1: [80, 66], f1: [100, 92], k2: [92, 66], f2: [80, 92], e1: [120, 18], w1: [146, 8], e2: [112, 50], w2: [118, 62] }), arrow('M70 52 H44', 0) + arrow('M128 30 q10 -10 6 -22', 0))]); }
  ,froll_g: () => { const r = '<circle cx="92" cy="82" r="9" fill="none" stroke="#D4AF37" stroke-width="3" opacity=".8"/>';
    const b = { x: r, h: [60, 34], n: [70, 46], p: [92, 70], k1: [124, 56], f1: [146, 90], k2: [120, 58], f2: [142, 90], e1: [58, 70], w1: [48, 90] };
    return svg([panel('AUF ROLLE', b), panel('ROLLEN', Object.assign({}, b, { x: r.replace('92', '86'), p: [86, 70], n: [64, 46], h: [54, 34], e1: [52, 70], w1: [42, 90] }), arrow('M70 100 H112', 0) + arrow('M112 100 H70', 0))]); }
  ,froll_t: () => { const b = { x: '<circle cx="122" cy="85" r="8" fill="none" stroke="#D4AF37" stroke-width="3" opacity=".8"/>', h: [30, 58], n: [44, 64], p: [100, 72], e1: [44, 90], w1: [68, 90], k1: [140, 76], f1: [172, 82] };
    return svg([panel('OBERSCHENKEL', b), panel('LANGSAM ROLLEN', Object.assign({}, b, { x: b.x.replace('122', '146'), n: [56, 64], h: [42, 58], e1: [56, 90], w1: [80, 90], p: [112, 72] }), arrow('M100 56 H150', 0) + arrow('M150 56 H100', 0))]); }
  ,ballpir: () => { const b = { x: '<circle cx="94" cy="88" r="5" fill="#D4AF37" opacity=".85"/>', h: [60, 34], n: [70, 46], p: [94, 76], k2: [124, 58], f2: [146, 90], k1: [120, 56], f1: [104, 66], e1: [58, 70], w1: [48, 90] };
    return svg([panel('BALL UNTERM GESÄSS', b), panel('KREISEN', Object.assign({}, b), '<ellipse cx="94" cy="88" rx="16" ry="6" fill="none" stroke="#D4AF37" stroke-width="2.5" stroke-dasharray="4 3"/>')]); }
  ,duoball: () => { const x = '<circle cx="84" cy="86" r="5.5" fill="#D4AF37" opacity=".85"/><circle cx="95" cy="86" r="5.5" fill="#D4AF37" opacity=".85"/>';
    const b = { x, h: [22, 82], n: [38, 84], c: [84, 76], p: [110, 84], k1: [132, 60], f1: [152, 90], k2: [128, 60], f2: [148, 90], e1: [56, 88], w1: [74, 89] };
    return svg([panel('DUOBALL LWS', b), panel('ATMEN · ROLLEN', b, '<text x="90" y="64" text-anchor="middle" font-size="10" fill="#ff6b6b">NICHT auf Wirbel</text>' + arrow('M90 68 V76', 0))]); }
  ,shakti: () => { const x = '<rect x="20" y="88" width="150" height="5" rx="2" fill="none" stroke="#D4AF37" stroke-dasharray="2 2"/>';
    return svg([panel('SHAKTI-MATTE', { x, h: [30, 80], n: [46, 84], p: [104, 84], k1: [136, 84], f1: [168, 84], e1: [72, 86], w1: [96, 86] }), panel('10 MIN ATMEN', { x, h: [30, 80], n: [46, 84], p: [104, 84], k1: [126, 62], f1: [146, 86], k2: [124, 62], f2: [144, 86], e1: [72, 86], w1: [96, 86] }, '<text x="70" y="50" font-size="14" fill="#D4AF37">z z z</text>')]); }
};

/* ---------- Übungen ---------- */
const EX = [
  { id: 'warmwalk', core: 1, n: 'Aufwärmen: locker gehen (Balkon)', sub: 'Kreislauf & Gewebe anwärmen · frische Luft', dose: '2–5 Min locker gehen', t: 'time', sets: 1, secs: 180,
    steps: ['Direkt nach dem Aufstehen: Jacke oder Pulli an und raus auf den Balkon (oder durch die Wohnung gehen).', 'Locker im normalen Tempo gehen, aufrecht, Arme schwingen entspannt mit.', 'Ruhig durch die Nase ein- und durch den Mund ausatmen, Schultern locker.', '2–5 Minuten (Timer 3 Min), dann direkt mit Katze-Kuh weitermachen.'],
    cues: ['Frische Luft macht wach – aber Jacke an, nicht durchfrieren (kalte Muskeln verspannen eher)', 'Normales, lockeres Tempo – kein Sport', 'Aufrecht gehen, Blick nach vorn', 'Kribbeln, Ausstrahlung ins Bein oder einschießender Schmerz → stoppen'],
    err: ['Im T-Shirt in der Kälte stehen und auskühlen', 'Gleich schnell oder mit großen Schritten loslegen', 'Direkt kalt ins Dehnen starten'] },
  { id: 'catcow', core: 1, n: 'Katze-Kuh', sub: 'Vierfüßlerstand', dose: '10 langsame Wdh.', t: 'reps', sets: 1, reps: 10,
    steps: ['Vierfüßlerstand: Hände unter den Schultern, Knie unter den Hüften.', 'Ausatmen: Rücken wie eine Katze rund nach oben schieben, Kinn Richtung Brust, Bauchnabel einziehen.', 'Einatmen: Langsam in die Kuh – Becken kippt nur leicht nach vorn, Brustbein nach vorn, Blick leicht nach vorn. Kleiner Bewegungsumfang, kein tiefes Hohlkreuz.', 'Wirbel für Wirbel bewegen, ca. 3–4 s pro Richtung.'],
    cues: ['Kleiner Bewegungsumfang – bei der Kuh NICHT tief ins Hohlkreuz (Streckung ist dein Auslöser)', 'Bewegung startet aus dem Becken', 'Ruhig mit dem Atem koppeln', 'Arme bleiben gestreckt, Schultern weg von den Ohren', 'Kribbeln, Ausstrahlung ins Bein oder einschießender Schmerz → Übung heute weglassen'],
    err: ['Zu großer Bewegungsumfang – tief ins Hohlkreuz durchhängen', 'Zu schnell / ruckartig', 'Nur den Nacken bewegen statt die ganze Wirbelsäule', 'In der Kuh ins Hohlkreuz „fallen“ – kontrolliert bleiben'] },
  { id: 'n9090', core: 1, n: '90/90 Hüftrotation', sub: 'Sitzend, Knie wechseln', dose: '8 Wechsel', t: 'reps', sets: 1, reps: 8,
    steps: ['Aufrecht sitzen, beide Knie ca. 90° gebeugt, Füße etwas breiter als hüftbreit.', 'Hände hinter dem Körper abstützen.', 'Beide Knie gleichzeitig zur einen Seite zum Boden sinken lassen (vorderes Bein 90°, hinteres Bein 90°).', 'Kontrolliert über die Mitte zur anderen Seite wechseln. Ein Wechsel = eine Wdh.'],
    cues: ['Brust aufrecht, Wirbelsäule lang', 'Nur so tief, wie es schmerzfrei geht', 'Langsam durch die Mitte', 'Kribbeln, Ausstrahlung ins Bein oder einschießender Schmerz → Übung heute weglassen'],
    err: ['Knie auf den Boden zwingen', 'Rundrücken / zusammensacken', 'Knie verdrehen statt aus der Hüfte rotieren'] },
  { id: 'hipflex', core: 1, n: 'Aktiver Hüftbeuger-Stretch im Ausfallschritt', sub: 'Becken nach vorn schieben & lösen · Gesäß aktiv', dose: '20 Wdh. pro Seite', t: 'reps', sets: 1, reps: 20, ps: true,
    steps: ['Großer Ausfallschritt: hinteres Knie auf einer weichen Unterlage (oder Bein lang), vorderer Fuß flach, Oberkörper aufrecht, Hände an die Hüfte.', 'Gesäß der hinteren Seite fest anspannen und das Becken leicht nach hinten kippen (Schambein Richtung Bauchnabel).', 'Becken ruhig nach vorn schieben, bis vorne in der Hüfte/Leiste ein Ziehen kommt – dann wieder lösen (zurücknehmen).', '20 langsame Wiederholungen, dann Seite wechseln.'],
    cues: ['Erst Po anspannen und Becken aufrichten – dann schieben. Solange Strecken im Rücken zieht: weniger tief', 'Becken aufgerichtet, nur ein kurzer Weg – nicht weit in die Streckung', 'Dehnung vorne an der Hüfte/Leiste des hinteren Beins', 'Rippen unten, Bauch leicht fest – nur die Hüfte bewegt sich', 'Kleine, fließende Bewegung ohne Schwung', 'Vorderes Knie über dem Fuß', 'Kribbeln, Ausstrahlung ins Bein oder einschießender Schmerz → Übung heute weglassen'],
    err: ['Ins Hohlkreuz ausweichen statt Becken zu kippen', 'Zu weit nach vorn schieben – weniger ist mehr', 'Gesäß locker lassen', 'Wippen mit Schwung'] },
  { id: 'hamfloss', core: 1, n: 'Hamstring-Floss in Rückenlage', sub: 'Beinrückseite & Nervengleiten · ohne Vorbeugen', dose: '10 pro Seite, langsam', t: 'reps', sets: 1, reps: 10, ps: true,
    steps: ['Rückenlage, Kopf liegt ab. Ein Bein aufgestellt (Fuß am Boden), der Rücken bleibt flach.', 'Das andere Bein anheben, bis die Hüfte ca. 90° gebeugt ist. Oberschenkel mit beiden Händen (oder Gurt/Handtuch) hinten halten, Knie gebeugt.', 'Knie langsam strecken, bis hinten am Oberschenkel ein sanfter Zug kommt – dann wieder beugen.', 'Ca. 2–3 s pro Richtung, 10× pro Seite. Optional: Fuß beim Strecken anziehen, beim Beugen locker lassen.'],
    cues: ['Ersetzt den Hamstring-Walk: morgens kein Vorbeugen – Bandscheiben sind morgens am vollsten', 'Rücken und Becken bleiben flach am Boden', 'Hüfte bleibt in Neutralstellung – Knie zeigt zur Decke, nicht nach innen drehen oder über die Körpermitte ziehen', 'Nur bis sanfter Zug (max. 3–4/10) – das Knie muss nicht ganz gerade werden, nicht ins Endgefühl strecken', 'Langsam und fließend, ruhig atmen', 'Kribbeln, Ausstrahlung ins Bein oder einschießender Schmerz → Übung heute weglassen'],
    err: ['Mit Schwung strecken', 'Unterer Rücken / Becken hebt ab', 'Kopf hochziehen', 'Kribbeln ignorieren'] },
  { id: 'bridge', core: 1, n: 'Glute Bridge', sub: 'Gesäßbrücke', dose: '2×12, 2 s oben halten', t: 'reps', sets: 2, reps: 12,
    steps: ['Rückenlage, Knie gebeugt, Füße hüftbreit flach am Boden, Arme neben dem Körper.', 'Bauch leicht anspannen, Becken leicht nach hinten kippen.', 'Über die Fersen drücken und das Becken heben – oben nur bis zur geraden Linie Schulter–Hüfte–Knie, nicht höher (nicht überstrecken).', 'Oben 2 s halten, Gesäß fest anspannen, langsam absenken.'],
    cues: ['Oben nur bis zur geraden Linie Schulter–Hüfte–Knie – nicht überstrecken', 'Druck über die Fersen', 'Arbeit im Gesäß, nicht im unteren Rücken', 'Knie zeigen nach vorn', 'Kribbeln, Ausstrahlung ins Bein oder einschießender Schmerz → Übung heute weglassen'],
    err: ['Zu hoch drücken → Hohlkreuz', 'Knie fallen nach innen', 'Oben nicht halten / zu schnell'] },
  { id: 'birddog', core: 1, n: 'Bird Dog', sub: 'Vierfüßlerstand, diagonal', dose: '2×8 pro Seite, 3 s halten', t: 'reps', sets: 2, reps: 8, ps: true,
    steps: ['Vierfüßlerstand, Rücken neutral (gerade wie ein Tisch).', 'Bauch leicht anspannen.', 'Gleichzeitig rechten Arm nach vorn und linkes Bein nach hinten lang strecken – bis auf Rumpfhöhe.', '3 s halten, kontrolliert zurück, dann Seite wechseln.'],
    cues: ['Bein nur bis Rumpfhöhe – kein Hohlkreuz', 'Becken bleibt waagrecht – stell dir ein Glas Wasser auf dem Rücken vor', 'Lang machen statt hoch heben', 'Blick zum Boden, Nacken lang', 'Kribbeln, Ausstrahlung ins Bein oder einschießender Schmerz → Übung heute weglassen'],
    err: ['Bein zu hoch → Hohlkreuz', 'Becken kippt zur Seite', 'Hektisch, ohne Halten'] },
  { id: 'deadbug', core: 1, n: 'Dead Bug', sub: 'Rücken flach', dose: '2×8 pro Seite, Rücken flach', t: 'reps', sets: 2, reps: 8, ps: true,
    steps: ['Rückenlage, Arme senkrecht zur Decke, Beine angehoben: Hüfte und Knie 90°.', 'Unteren Rücken sanft in den Boden drücken – er bleibt die ganze Zeit flach.', 'Ausatmen: rechten Arm nach hinten und linkes Bein nach vorn lang strecken, knapp über dem Boden.', 'Zurück in die Mitte, Seite wechseln.'],
    cues: ['Zieht es im unteren Rücken: nur das Bein bewegen, Arme oben lassen', 'Rücken flach am Boden – das ist die eigentliche Übung', 'Langsam ausatmen beim Strecken', 'Nur so weit strecken, wie der Rücken unten bleibt', 'Kribbeln, Ausstrahlung ins Bein oder einschießender Schmerz → Übung heute weglassen'],
    err: ['Hohlkreuz beim Strecken', 'Luft anhalten', 'Zu schnell, Schwung'] },
  { id: 'sideplank', core: 1, n: 'Seitstütz auf den Knien', sub: 'Seitlicher Rumpf & Hüfte · schützt den unteren Rücken', dose: '2×15–20 s pro Seite', t: 'time', sets: 2, secs: 20, ps: true,
    steps: ['Seitlage, Unterarm am Boden, Ellbogen genau unter der Schulter.', 'Knie ca. 90° gebeugt, Unterschenkel nach hinten, Knie übereinander. Obere Hand an die Hüfte.', 'Bauch leicht fest, dann die Hüfte heben, bis Kopf, Hüfte und Knie eine gerade Linie bilden.', '15–20 s halten, ruhig weiteratmen, langsam ablegen. Seite wechseln, 2 Runden.', 'Variante Wand (wenn es links unten zieht): seitlich zur Wand stellen, Unterarm (oder Hand) an die Wand, Körper gerade, Hüfte sanft Richtung Wand schieben und halten.'],
    cues: ['Doc: Zieht es links unten – erst nur 10 s oder die Wand-Variante', 'Kopf–Hüfte–Knie eine Linie, Hüfte nicht durchhängen lassen', 'Schulter weg vom Ohr, Ellbogen unter der Schulter', 'Weiteratmen, nicht pressen', 'Kribbeln, Ausstrahlung ins Bein oder einschießender Schmerz → Übung heute weglassen'],
    err: ['Hüfte sackt durch oder schiebt nach hinten', 'Ins Hohlkreuz kippen', 'Luft anhalten', 'Schulter hochziehen'] },
  { id: 'wgs', n: "World's Greatest Stretch", sub: 'Ausfallschritt + Rotation', dose: '5 pro Seite', t: 'reps', sets: 1, reps: 5, ps: true,
    steps: ['Großer Ausfallschritt nach vorn, hinteres Bein lang, Hände innen neben dem vorderen Fuß aufsetzen.', 'Hüfte sanft Richtung Boden sinken lassen.', 'Den Arm auf der Seite des vorderen Beins zur Decke aufdrehen, Blick folgt der Hand.', 'Langsam zurück, Hand absetzen. 5× wiederholen, dann Seite wechseln.'],
    cues: ['Bis einschließlich Di 17.11. pausiert (Hexenschuss)', 'Rotation kommt aus der Brustwirbelsäule', 'Hinteres Bein aktiv lang', 'Bewegung ruhig, 2 s oben halten'],
    err: ['Vorderes Knie fällt nach innen', 'Rund im unteren Rücken hängen', 'Mit Schwung aufdrehen'] },
  { id: 'rolle', n: 'Bein über die Rolle', sub: 'Sitzend · Blackroll · Hüfte aktiv & kontrolliert', dose: '10 Wdh. pro Seite', t: 'reps', sets: 1, reps: 10, ps: true,
    steps: ['Aufrecht sitzen (Stuhl oder Boden), die Blackroll liegt quer vor dem Fuß am Boden.', 'Oberkörper bleibt aufrecht, Hände stützen seitlich oder an den Oberschenkeln.', 'Ein Bein kontrolliert anheben und über die Blackroll führen, ohne Schwung.', 'Langsam wieder zurückführen. 10 Wdh., dann Seite wechseln. Fortgeschritten: Rolle höher stellen (hochkant).'],
    cues: ['Rücken lang, Bauch leicht fest – das Becken bleibt ruhig', 'Langsam heben, langsam zurück', 'Nur so hoch, wie es mittig und schmerzfrei bleibt – Rolle nicht hochkant stellen, nicht ins Endgefühl', 'Bei Leistenstechen, Blockieren oder Einklemmen aufhören', 'Kein Vorbeugen – bleib aufrecht'],
    err: ['Mit Schwung über die Rolle schleudern', 'Oberkörper kippt zur Seite oder nach hinten', 'Rundrücken'] }
];
// v1.8.6: Hamstring-Walk (Vorbeuge) aus der Morgen-Routine entfernt – bleibt für alte Verlaufs-Einträge erhalten
const MRET = [
  { id: 'hamwalk', ret: 1, n: 'Hamstring-Walk (Vorbeuge, Knie wechseln)', sub: 'Beinrückseite · Knie abwechselnd beugen/strecken', dose: '8–10 Wechsel, langsam', t: 'reps', sets: 1, reps: 10,
    steps: ['Hüftbreit stehen, Knie zunächst leicht gebeugt.', 'Mit langem Rücken aus der Hüfte nach vorn neigen, Hände auf die Schienbeine oder auf einen Block legen – der Boden muss nicht erreicht werden.', 'Ein Knie beugen, das andere sanft strecken, bis hinten am Oberschenkel/in der Wade ein leichtes Ziehen kommt.', 'Langsam wechseln, wie auf der Stelle gehen. Ruhig atmen, ca. 2–3 s pro Wechsel. Zum Schluss mit gebeugten Knien und Händen auf den Oberschenkeln langsam aufrichten.'],
    cues: ['Markus, Bandscheibe zuerst: Knie anfangs ruhig etwas mehr beugen, Rücken lang statt rund', 'Hände stützen auf Schienbeinen oder Block – nicht zum Boden zwingen', 'Langsam ein- und ausatmen, Dehnung nur sanft (max. 3–4/10)', 'Kribbeln in den Zehen oder Ziehen ins Bein → sofort lockerer lassen bzw. abbrechen'],
    err: ['Mit rundem Rücken tief „hängen“ statt aus der Hüfte zu beugen', 'Knie durchdrücken oder federn', 'Luft anhalten', 'Weitermachen trotz Kribbeln/Ausstrahlen ins Bein'] }
];
const EX_OLD = ['catcow', 'hamwalk', 'hipflex', 'wgs', 'n9090', 'bridge', 'birddog', 'deadbug', 'rolle']; // Plan vor v1.7.15 (nur Verlauf)
/* v1.8.3: hipwallrot/hipwallstep Texte exakt nach Zac-Video, je 4 Schritt-Bilder (pics: Start, Bewegung, Ende, Fehler) */
/* v1.7.29: hipwallstep Seitenregel klar: Wandfuß = hohe Seite, Hand Wandseite → vorderes Knie */
/* v1.7.25: hipwallrot korrigiert (Zac Cupples) + Diagonalschritt an der Wand (hipwallstep) – Abend-Kern, Zähler 11/11 */
/* v1.7.24: +Hüft-Rotation an der Wand (Seitlage) – Abend-Kern (core), Zähler 10/10 */
/* v1.7.23: +Hüftbeuger-Dehnung im Stehen (Fuß erhöht) – Abend-Kern (core), Zähler 9/9 */
const EVE = [
  { id: 'tuer', eve: 1, n: 'Seitdehnung im Türrahmen', sub: 'Abend · seitliche Rumpfmuskulatur, Hüftabduktoren, Außenhüfte', dose: '3×60 s links, 2×60 s rechts', t: 'time', sets: 3, setsL: 3, setsR: 2, secs: 60, ps: true,
    steps: ['Aufwärmen: beide Hände seitlich im Türrahmen einspannen, 5–8 langsame Hüftkreise bzw. Pendeln links-rechts.', 'Im Türrahmen stehen, Beine überkreuzen (für die Dehnung der linken Seite: rechtes Bein vor das linke).', 'Linke Hand greift oben an den Türrahmen.', 'Hüfte langsam nach links/außen rausschieben und den Oberkörper zur Gegenseite ziehen, bis Zug in der linken Flanke, im unteren Rücken und an der Außenhüfte entsteht.', 'Ruhig in die Flanke atmen, 60 s halten. Seite wechseln.'],
    cues: ['Nicht nach vorne kippen – Rumpf bleibt in einer Ebene', 'Bauch leicht fest', 'Nur bis angenehmer Zug', 'Kein Kribbeln/Ausstrahlen ins Bein (Bandscheibe) – sonst lockerer'], err: ['Ins Hohlkreuz fallen', 'Schulter hochziehen', 'Ruckartig wippen'] },
  { id: 'couch', eve: 1, n: 'Couch Stretch', sub: 'Abend · Hüftbeuger & Quadrizeps', dose: '1×2 min pro Seite', t: 'time', sets: 1, secs: 120, ps: true,
    steps: ['Knie auf einer weichen Unterlage (Kissen/Matte) vor dem Sofa absetzen, vorderer Fuß flach, Knie ca. 90°.', 'Den hinteren Fuß erhöht aufs Sofa legen, Schienbein an der Lehne.', 'Gesäß der hinteren Seite fest anspannen und das Becken leicht nach hinten kippen, dann Becken nach vorn schieben, bis vorne an Hüfte und Oberschenkel ein Zug kommt.', 'Oberkörper aufrecht, 2 min ruhig atmen. Seite wechseln.'],
    cues: ['Bis einschließlich Di 17.11. pausiert (Hexenschuss)', 'Dehnung vorne an Hüfte und Oberschenkel des hinteren Beins', 'Rippen unten, Bauch leicht fest – nicht ins Hohlkreuz', 'Knie weiter vom Sofa weg = sanfter', 'Nur bis angenehmer Zug – nichts erzwingen'],
    err: ['Ins Hohlkreuz ausweichen', 'Knieschmerz ignorieren', 'Zu aggressiv ins Sofa pressen'] },
  { id: 'pigeonq', eve: 1, n: 'Taube – Schienbein quer', sub: 'Abend · Gesäß/Piriformis außen', dose: '3×60 s links, 2×60 s rechts', t: 'time', sets: 3, setsL: 3, setsR: 2, secs: 60, ps: true,
    steps: ['Aus dem Vierfüßlerstand das linke Knie nach vorn bringen und das Schienbein QUER vor den Körper legen – so parallel zur vorderen Mattenkante, wie es angenehm ist. Die Wade zeigt Richtung Bauchnabel, der Fuß liegt Richtung andere Hüfte.', 'Hinteres Bein lang nach hinten ausstrecken.', 'Hüfte gerade ausrichten, aufrecht abstützen.', 'Dann langsam mit dem Oberkörper über das vordere Schienbein nach vorn sinken, Unterarme oder Stirn ablegen. 60 s halten, ruhig atmen, Seite wechseln.'],
    cues: ['In zwei Phasen: zuerst aufrecht halten, dann mit dem Oberkörper nach vorne unten sinken', 'Bis einschließlich Di 17.11. (Hexenschuss): nur aufrecht bzw. auf die Unterarme, nicht tief nach vorn sinken; aufrecht nicht ins Hohlkreuz', 'Kissen unter die linke Pobacke, wenn du nicht runterkommst', 'Knie ca. 90°, Fuß aktiv (Zehen angezogen) schützt das Knie', 'Dehnung tief im Gesäß, nicht im Knie'], err: ['Hüfte kippt zur Seite', 'Schienbein erzwingen – lieber Fuß näher zum Körper', 'Knieschmerz ignorieren'] },
  { id: 'turtle', eve: 1, n: 'Schildkröte (Yoga)', sub: 'Abend · Kurmasana, sanfte Variante', dose: '2×60 s', t: 'time', sets: 2, secs: 60,
    steps: ['Sitzen, Beine weit gegrätscht, Knie gebeugt, Füße am Boden.', 'Oberkörper langsam nach vorn sinken lassen.', 'Arme unter den Knien nach außen schieben, Handflächen am Boden.', 'Locker lassen, 60 s ruhig atmen. Langsam wieder aufrollen.'],
    cues: ['Bis einschließlich Di 17.11. pausiert (Hexenschuss)', 'Nur bis kurz vor Kribbeln – dann etwas zurück', 'Nur abends – nichts erzwingen', 'Knie so weit gebeugt wie nötig'], err: ['Mit Kraft nach unten drücken', 'Bei Rücken-/Ausstrahlungsschmerz weitermachen → sofort abbrechen'] },
  { id: 'rollbecken', eve: 1, n: 'Rolle unterm Becken – Grätsche', sub: 'Abend · Blackroll · Adduktoren/Leiste & Hüftbeuger', dose: '2×30 s, sanft', t: 'time', sets: 2, secs: 30,
    steps: ['Rückenlage, Knie gebeugt, Füße am Boden. Becken kurz anheben und die Blackroll quer unter das Kreuzbein (flacher Knochen am Beckenende) legen – NICHT unter die Lendenwirbelsäule.', 'Becken wieder sanft auf der Rolle ablegen.', 'Beine langsam weit in eine Grätsche öffnen, Knie leicht gebeugt.', 'Arme seitlich ausbreiten, locker lassen und ruhig atmen – 30 s halten. Beine schließen, Becken anheben, Rolle entfernen.'],
    cues: ['Bis einschließlich Di 17.11. pausiert (Hexenschuss)', 'Rolle unters Kreuzbein – bei dumpfem Druckgefühl im unteren Rücken die Rolle tiefer Richtung Steiß legen oder flacher/weicher unterlagern (z. B. gefaltetes Handtuch)', 'Dumpfe Dehnung in der Leiste ist ok – stechender, ausstrahlender Schmerz oder Kribbeln → sofort abbrechen', 'Linke Seite nur so weit öffnen, wie es angenehm ist', 'Lange Ausatmung, loslassen statt drücken'],
    err: ['Rolle unter der Lendenwirbelsäule → Hohlkreuz/Druck auf die Bandscheibe', 'Beine mit Kraft nach unten drücken', 'Dumpfen Rückendruck aushalten statt Rolle zu verschieben'] },
  { id: 'rollschien', eve: 1, n: 'Rolle unterm Schienbein – Hüftrotation im Vierfüßler', sub: 'Abend · Blackroll · Gesäß/Außenrotatoren & Adduktoren', dose: '2–3×30–40 s pro Seite, links etwas länger', t: 'time', sets: 3, setsL: 3, setsR: 2, secs: 35, ps: true,
    steps: ['Vierfüßlerstand, Hände unter den Schultern, Knie unter der Hüfte. Blackroll hochkant neben dich stellen.', 'Ein Bein seitlich abspreizen und anheben, Knie gebeugt.', 'Die Rückseite von Schienbein/Fuß oben auf die stehende Rolle legen – die Hüfte ist dabei abgespreizt und gedreht.', 'Position halten, ruhig atmen, 30–40 s. Langsam lösen, Seite wechseln. Links etwas länger halten.'],
    cues: ['Rücken neutral, Bauch leicht fest – nicht ins Hohlkreuz sinken', 'Zug tief in Gesäß/Hüfte und Innenseite, nicht im Knie', 'Rolle näher an den Körper = sanfter'],
    err: ['Becken kippt stark zur Seite', 'Rücken hängt durch', 'Schwung statt ruhigem Halten'] },
  { id: 'rollknie', eve: 1, n: 'Rolle zwischen den Knien – liegende Hüftrotation', sub: 'Abend · Blackroll · LWS (QL) & Gesäß/Piriformis', dose: '2–3×30–40 s pro Seite', t: 'time', sets: 3, secs: 35, ps: true,
    steps: ['Rückenlage, Knie gebeugt, Füße am Boden, Arme seitlich ausgebreitet.', 'Blackroll senkrecht zwischen bzw. an Knie und Fuß eines Beins klemmen.', 'Knie langsam und sanft zu einer Seite sinken lassen – Rotation in LWS und Hüfte. Schultern bleiben am Boden.', '30–40 s ruhig atmen, langsam zur Mitte zurück, Seite wechseln.'],
    cues: ['Nur so weit sinken lassen, wie es angenehm ist – kein Ziehen ins Bein', 'Lange Ausatmung, Flanke und Gesäß loslassen', 'Kribbeln/ausstrahlender Schmerz → weniger tief oder abbrechen'],
    err: ['Knie fallen lassen / ruckartig drehen', 'Schulter hebt ab', 'Druck im unteren Rücken ignorieren'] },
  // v1.8.7: optionale Abend-Übung im Wechsel; Hexenschuss-Pause bis 17.11. (LWS-Rotation)
  { id: 'rumpfrot', eve: 1, n: 'Liegende Rumpfrotation (Knie zur Seite)', sub: 'Abend · im Wechsel · sanfte LWS-Rotation, kleiner Umfang', dose: '2×30 s pro Seite', t: 'time', sets: 2, secs: 30, ps: true,
    steps: ['Rückenlage, Arme seitlich ausgebreitet, Schultern fest am Boden. Knie angewinkelt, Füße flach oder leicht angehoben, Knie und Füße bleiben zusammen.', 'Beide Knie langsam und kontrolliert zu einer Seite sinken lassen – nur ein kleiner Bewegungsumfang, nicht bis zum Boden.', 'Schultern und Schulterblätter bleiben die ganze Zeit am Boden. 30 s ruhig atmen.', 'Langsam zur Mitte zurück, Seite wechseln. 2 Runden pro Seite.'],
    cues: ['Nur ein sehr kleiner Weg – Knie nicht Richtung Boden und nicht ins Endgefühl', 'Schultern bleiben am Boden, die Drehung ist klein und ruhig', 'Kein Ziehen ins Bein, kein Druck im unteren Rücken, keine Rotation unter Last', 'Kribbeln, Ausstrahlung ins Bein oder einschießender Schmerz → abbrechen'],
    err: ['Knie fallen lassen / zu weit drehen', 'Schulter hebt vom Boden ab', 'Ruckartig oder mit Schwung drehen', 'Ausstrahlung oder Kribbeln ignorieren'] },
  { id: 'beckenreset', core: 1, eve: 1, n: 'Becken-Reset (Shotgun)', sub: 'Abend · ISG/Becken ausgleichen, sanfte Muskelspannung', dose: '3 Teile à 3×5 s', t: 'reps', sets: 3, reps: 3,
    steps: ['Rückenlage, Knie gebeugt, Füße hüftbreit am Boden.', 'Teil 1 – Knie auseinander: Gürtel um die Knie oder Hände außen an die Knie. 5 s mit ca. halber Kraft nach außen drücken, lösen. 3×.', 'Teil 2 – Knie zusammen: Ball oder gefaltetes Kissen zwischen die Knie. 3× kurz und kräftig zusammendrücken, je ca. 5 s. Ein leises Klacken ist okay.', 'Teil 3 – Gegeneinander: Linkes Knie zur Brust ziehen und gegen die Hand drücken, gleichzeitig rechtes Bein gestreckt in den Boden drücken. 5 s halten, 3×, dann Seiten tauschen.', 'Danach vor dem Spiegel oder in der Badewanne die Beinlänge vergleichen. Auch vor langem Stehen gut.'],
    cues: ['Nur Spannung, kein Ruck und kein Knacken erzwingen', 'Knie zur Brust nur so weit wie schmerzfrei, nicht ins Endgefühl', 'Ruhig weiteratmen, nicht pressen', 'Halbe Kraft reicht'],
    err: ['Stechender Schmerz → sofort abbrechen', 'Luft anhalten', 'Hohlkreuz beim Drücken'] },
  { id: 'psoasreset', core: 1, eve: 1, n: 'Psoas-Reset an der Wand (links betont)', sub: 'Abend · Hüftbeuger/Psoas lösen, Becken links zurückdrehen', dose: '1 Satz · 5–10 tiefe Atemzüge', t: 'reps', sets: 1, reps: 10,
    steps: ['Rückenlage, Füße flach an der Wand, Hüfte und Knie je 90°. Faszienrolle zwischen die Oberschenkel klemmen, Kinn locker zur Decke.', 'Fersen an der Wand nach unten ziehen, ohne zu rutschen – der untere Rücken wird flach, die hinteren Oberschenkel spannen.', 'Spannung halten, linkes Knie sanft nach unten, rechtes Knie nach oben bewegen – die Rolle bleibt dabei eingeklemmt (aktiviert linke Hamstrings + Adduktoren, dreht das Becken links zurück).', '5–10 langsame Bauchatmungen, dabei Spannung und Knieposition halten. Danach lösen und Beine ablegen.'],
    cues: ['Sanft arbeiten – keine große Kraft, nicht in den Schmerz', 'Unterer Rücken bleibt flach am Boden', 'Spannung kommt aus den hinteren Oberschenkeln und der Innenseite – kein Ruck', 'Rolle die ganze Zeit eingeklemmt halten', 'Lange, ruhige Bauchatmung – nicht pressen'],
    err: ['Fersen rutschen an der Wand ab', 'Hohlkreuz statt flachem Rücken', 'Rolle fällt raus / wird nicht gehalten', 'Luft anhalten oder Schultern hochziehen'] },
  // v1.8.7: feste Abend-Übung, auch im Hexenschuss (rückenschonende Gesäßdehnung)
  { id: 'fig4', core: 1, eve: 1, n: 'Figure-4-Dehnung (Rückenlage)', sub: 'Abend · Gesäß/Piriformis, rückenschonend', dose: '2×30 s pro Seite', t: 'time', sets: 2, secs: 30, ps: true,
    steps: ['Rückenlage, Kopf und gesamter Rücken bleiben flach am Boden, Arme entspannt.', 'Den einen Knöchel auf das gegenüberliegende Knie legen (Figur 4), Fuß aktiv angezogen.', 'Den stützenden Fuß am Boden lassen oder das Bein nur ganz leicht heranziehen – nicht fest zur Brust ziehen und nicht ins Endgefühl gehen.', '30 s ruhig atmen, langsam ablegen, Seite wechseln. 2 Runden pro Seite.'],
    cues: ['Nur schmerzfrei, kein Druck am Endpunkt', 'Kein festes Ziehen zur Brust – Knöchel aufs Knie legen reicht, Schwerkraft arbeitet', 'Kein Ziehen im Rücken – nur eine leichte Dehnung im Gesäß', 'Kopf und Rücken bleiben am Boden, nicht einrollen', 'Ruhig atmen, nicht tiefer in den Endpunkt gehen', 'Bei Kribbeln oder ausstrahlendem Schmerz abbrechen'],
    err: ['Kopf oder Schultern anheben / Rücken einrollen', 'Am Knie statt am Oberschenkel ziehen', 'In den Schmerz oder ins Ziehen im Rücken gehen', 'Kribbeln oder Ausstrahlung ignorieren'] },
  { id: 'kniefersenrock', core: 1, eve: 1, n: 'Kniestand-Fersensitz-Rock (links betont)', sub: 'Abend · Hüfte, Lenden & Rücken lang ziehen, links betont', dose: '5 Wdh × 20 s halten · links 1–2 mehr', t: 'time', sets: 6, setsL: 6, setsR: 5, secs: 20, ps: true,
    steps: ['Vierfüßlerstand, Zehen aufgestellt bzw. Fußrücken am Boden.', 'Das Gesäß langsam Richtung Fersen nach hinten schieben.', 'Arme lang nach vorn strecken, Rücken lang lassen.', '20 s halten, ruhig ausatmen. 5 Wiederholungen – links 1–2 mehr (6–7), da es links stark zieht und rechts gut geht.'],
    cues: ['Nur ein kurzer Weg nach hinten – nicht auf die Fersen setzen, nicht ins Endgefühl', 'Wird es im Rücken stärker statt lockerer: weniger weit nach hinten', 'Links nicht tiefer oder länger ins Endgefühl als rechts', 'Lange, ruhige Ausatmung beim Halten', 'Rücken bleibt lang, nicht rund einsinken'],
    err: ['Bis in den Schmerz gehen', 'Rücken rundet sich / Arme verkürzt', 'Ruckartig nach hinten schieben', 'Luft anhalten'] },
  { id: 'hipflexstand', core: 1, eve: 1, n: 'Hüftbeuger-Dehnung im Stehen (Fuß erhöht)', sub: 'Abend · Hüftbeuger, hinteres Bein gestreckt', dose: '2×30–45 s pro Seite', t: 'time', sets: 2, secs: 40, ps: true,
    steps: ['Vorderen Fuß auf eine Erhöhung stellen (Stufe oder Bank), hinteres Bein gestreckt am Boden.', 'Gesäß des hinteren Beins fest anspannen und das Becken leicht nach hinten kippen (Schambein Richtung Bauchnabel).', 'Dann die Hüfte nur ein kleines Stück nach vorn Richtung vorderes Knie schieben, bis es im Hüftbeuger des hinteren Beins zieht.', 'Oberkörper aufrecht, ruhig atmen, 30–45 s halten. Seite wechseln – 2 Sätze pro Seite.'],
    cues: ['Kein Hohlkreuz – Rippen unten, Bauch leicht fest. Erst Po anspannen, dann schieben; solange Strecken zieht: weniger tief', 'Oberkörper bleibt aufrecht', 'Ruhig atmen, Zug deutlich aber nie stechend', 'Nicht nachfedern'],
    err: ['Ins Hohlkreuz ausweichen', 'Zu weit nach vorn schieben / wippen', 'Stechenden Schmerz ignorieren', 'Oberkörper nach vorn kippen'] },
  { id: 'hipwallrot', core: 1, eve: 1, n: 'Hüft-Rotation an der Wand (Seitlage)', sub: 'Abend · Hüft-Innenrotation, hohe Seite oben · Zac Cupples', dose: '3×60 s · beidseitig (bis hohe Seite geklärt)', t: 'time', sets: 3, secs: 60, ps: true,
    steps: ['Seitlage, hohe Hüfte OBEN (vorerst beidseitig, bis die hohe Seite fachlich geklärt ist). Kopf auf einen festen, rechteckigen Block bzw. ein Polster legen.', 'Arme: Unterer Arm gerade nach vorn auf den Boden, Handfläche nach unten. Obere Hand hinter Kopf/Nacken, Ellbogen zeigt nach oben.', 'Unteres Bein am Boden: Hüfte ca. 45° gebeugt, Knie ca. 90° gebeugt. Die Außenseite vom unteren Oberschenkel liegt am Boden.', 'Oberes Bein ganz gestreckt an der Wand hochlegen, etwa auf Hüfthöhe (waagrecht in der Luft). Ferse UND Fußballen flach in die Wand drücken, Zehen zeigen nach vorn – in dieselbe Richtung wie die Brust.', 'Oberes Knie nach vorn schieben – dadurch drehen Becken und Oberkörper Richtung Boden (Hüft-Innenrotation). Der untere Oberschenkel bleibt am Boden, die Hüfte NICHT Richtung Rippen hochziehen. Position halten.', 'Lang und langsam durch die Nase einatmen, so voll wie möglich, ohne zu pressen; sanft durch den Mund ausatmen. 60 s, 3 Runden pro Seite.'],
    cues: ['Oberes Bein bleibt komplett gestreckt, etwa auf Hüfthöhe', 'Ferse und Fußballen flach in die Wand, Zehen nach vorn', 'Knie nach vorn = Becken und Oberkörper drehen Richtung Boden', 'Unterer Oberschenkel bleibt am Boden', 'Obere Hand hinter dem Kopf (Ellbogen hoch), unterer Arm vorn am Boden', 'Nase ein, Mund aus – nicht pressen', 'Deutlicher, aber angenehmer Zug; kein Stechen, kein Kribbeln oder Ausstrahlen ins Bein', 'Folgetag: wenn Stehtoleranz oder Ziehen schlechter → zurückfahren', 'Beidseitig, bis die hohe Seite fachlich geklärt ist'],
    err: ['Arme falsch: unterer Arm unter dem Kopf (statt gerade nach vorn auf dem Boden)', 'Hüfte Richtung Rippen hochziehen statt nach vorn drehen', 'Oberes Bein beugen', 'Fuß nur mit den Zehen an der Wand (Ferse nicht an der Wand)', 'Unteren Oberschenkel abheben', 'Einatmen erzwingen / pressen', 'Stechen, Kribbeln oder Ausstrahlung ignorieren'],
    pics: [{ f: 'hipwallrot_1', c: '1 · Startposition' }, { f: 'hipwallrot_2', c: '2 · Bewegung' }, { f: 'hipwallrot_3', c: '3 · Endposition' }, { f: 'hipwallrot_4', c: '4 · Häufige Fehler' }] },
  { id: 'hipwallstep', core: 1, eve: 1, n: 'Diagonalschritt an der Wand (Stand)', sub: 'Abend · Hüft-Rotation stehend · Zac Cupples', dose: '3×60 s · beidseitig (bis hohe Seite geklärt)', t: 'time', sets: 3, secs: 60, ps: true,
    steps: ['Welche Seite? Der Fuß an der Wand ist immer die Seite, die du trainierst = die HOHE Hüfte. „Links“ in der App heißt: linker Fuß hinten an der Wand, rechter Fuß vorne. Vorerst beide Seiten machen, bis die hohe Seite geklärt ist.', 'Hinterer Fuß (Wandseite): ganzer Fuß flach, Ferse an die Unterkante der Wand, Zehen gerade nach vorn. Vorderer Fuß hüftbreit nach vorn, leicht ausgedreht, flach.', 'Beide Knie leicht gebeugt – nur entriegelt, kein tiefer Ausfallschritt.', 'Mit der hinteren Ferse die Wand wegschieben und das Gewicht auf die vordere FERSE legen – die Hüfte der Wandseite sinkt leicht ab.', 'Die Hand der Wandseite greift diagonal Richtung vorderes (gegenüberliegendes) Knie (Beispiel links: linker Fuß an der Wand → linke Hand zum rechten Knie). Der andere Arm hängt locker. Oberkörper leicht nach vorn neigen und zum vorderen Bein drehen.', 'Spüren: Po auf der Wandseite, Oberschenkel vorne am vorderen Bein. Beide Füße bleiben flach.', 'Lang durch die Nase einatmen, sanft durch den Mund ausatmen. 60 s halten, 3 Runden pro Seite.'],
    cues: ['Beide Füße flach – nichts heben oder rollen', 'Wand mit der hinteren Ferse wegschieben, Gewicht auf die vordere Ferse', 'Hüfte der Wandseite sinkt ab', 'Hand der Wandseite → vorderes Knie, anderer Arm hängt locker', 'Oberkörper leicht nach vorn und zum vorderen Bein gedreht', 'Nase ein, Mund aus', 'Deutlicher, aber angenehmer Zug; kein Stechen, kein Kribbeln oder Ausstrahlen ins Bein', 'Folgetag: wenn Stehtoleranz oder Ziehen schlechter → zurückfahren', 'Wandfuß = hohe Seite = Seite, die trainiert wird', 'Beidseitig, bis die hohe Seite fachlich geklärt ist'],
    err: ['Falsche Hand am Knie (Hand der vorderen Seite statt der Wandseite)', 'Ferse oder Zehen heben / Füße rollen', 'Zu tiefer Ausfallschritt / wippen', 'Oberkörper nicht zum vorderen Bein drehen', 'Stechen, Kribbeln oder Ausstrahlung ignorieren', 'Atem anhalten'],
    pics: [{ f: 'hipwallstep_1', c: '1 · Startposition' }, { f: 'hipwallstep_2', c: '2 · Bewegung' }, { f: 'hipwallstep_3', c: '3 · Endposition' }, { f: 'hipwallstep_4', c: '4 · Häufige Fehler' }] },
];

const FAS = [
  { id: 'froll_g', core: 1, fas: 1, n: 'Blackroll Gesäß', sub: 'Faszien · Gesäßmuskulatur', dose: '90 s links, 60 s rechts', t: 'time', sets: 1, secs: 90, secsL: 90, secsR: 60, ps: true,
    steps: ['Auf die Blackroll setzen, Hände hinten abstützen.', 'Gewicht auf eine Gesäßhälfte verlagern. Beide Füße bleiben am Boden – das Bein nicht überschlagen.', 'Langsam vor und zurück rollen, ca. 2–3 cm pro Sekunde.', 'Auf festen Punkten 10–20 s verweilen und ausatmen. Dann Seite wechseln.'],
    cues: ['Druck nur „angenehm-intensiv“ (max. 6–7 von 10), nicht ins Endgefühl pressen', 'Bein nicht überschlagen, beide Füße am Boden', 'Ruhig atmen, nicht verkrampfen'], err: ['Zu schnell rollen', 'Auf das Steißbein/Kreuzbein rollen'] },
  { id: 'froll_t', fas: 1, n: 'Blackroll Oberschenkel außen/vorne', sub: 'Faszien · Quadrizeps & Außenseite', dose: '60 s pro Seite', t: 'time', sets: 1, secs: 60, ps: true,
    steps: ['Unterarmstütz, Blackroll unter dem vorderen Oberschenkel.', 'Langsam von knapp über dem Knie bis zur Hüfte rollen.', 'Für die Außenseite leicht auf die Seite drehen (nicht direkt auf den Knochen/Tractus pressen).', '60 s, dann anderes Bein.'],
    cues: ['Bauch fest, kein Durchhängen im Rücken – zieht es im unteren Rücken: Außenseite in Seitlage rollen statt im Unterarmstütz', 'Gewicht mit dem anderen Bein/Armen dosieren'], err: ['Über das Knie rollen', 'Hohlkreuz im Unterarmstütz', 'Zähne zusammenbeißen – zu viel Druck'] },
  { id: 'ballpir', fas: 1, n: 'Faszien Ball Piriformis', sub: 'Faszien · tiefe Hüftmuskulatur', dose: '90 s links, 60 s rechts', t: 'time', sets: 1, secs: 90, secsL: 90, secsR: 60, ps: true,
    steps: ['Sitzen, kleinen (oder großen) Ball mittig unter eine Gesäßhälfte legen.', 'Beide Füße bleiben am Boden – das Bein nicht überschlagen.', 'Kleine Kreise und Vor-zurück-Bewegungen, druckempfindliche Stelle suchen.', 'Dort ruhig atmen und lösen lassen, dann Seite wechseln.'],
    cues: ['Beide Füße am Boden, Bein nicht überschlagen', 'Sanfter Druck, nicht ins Endgefühl pressen', 'Kribbeln/Ausstrahlen ins Bein → Ball verschieben'], err: ['Auf den Ischiasnerv drücken (Kribbeln ignorieren)', 'Zu lange auf einem Punkt (> 30 s)'] },
  { id: 'duoball', fas: 1, n: 'Duoball LWS – Atmen & Sinken + Triggerpunkt rollen', sub: 'Faszien · Rückenstrecker · 2 Phasen', dose: '2 Phasen à 60–90 s', t: 'time', sets: 1, secs: 180,
    steps: ['Vorbereitung: Rückenlage, Knie gebeugt, Füße am Boden. Becken kurz anheben und den Duoball quer unter die Lendenwirbelsäule legen – die Ballhälften liegen links und rechts neben der Wirbelsäule, NIE auf der Wirbelsäule selbst. Dann sanft ablegen.', 'Phase 1 – Duoball LWS – Atmen & Sinken (60–90 s): Tief einatmen, lang ausatmen und dich mit jedem Atemzug ein Stück tiefer auf den Ball sinken lassen.', 'Phase 2 – Duoball LWS – Triggerpunkt rollen (60–90 s gesamt): Langsam über den Ball hoch und runter rollen, druckempfindliche Stellen suchen.', 'Auf jeder empfindlichen Stelle 20–30 s verweilen und ruhig weiteratmen. Linke Seite etwas länger bearbeiten.'],
    cues: ['Bis einschließlich Di 17.11. pausiert (Hexenschuss)', 'Abbrechen, wenn Schmerz ausstrahlt oder Kribbeln beginnt', 'NIE direkt auf der Wirbelsäule', 'Lange Ausatmung – loslassen statt drücken', 'Sanfter Druck – Bandscheibe schonen'], err: ['Ball auf den Dornfortsätzen', 'Ins Hohlkreuz drücken', 'Zu schnell oder mit viel Gewicht rollen', 'Ausstrahlung/Kribbeln ignorieren'] },
  { id: 'shakti', fas: 1, n: 'Shakti-Matte Entspannung', sub: 'Faszien · Entspannung', dose: '10 Min', t: 'time', sets: 1, secs: 600,
    steps: ['Matte auf eine ebene Unterlage legen, langsam darauf hinlegen (Rücken, ggf. dünnes Shirt am Anfang).', 'Beine lang oder angewinkelt, Arme locker neben den Körper.', 'Die ersten 1–2 Minuten sind intensiv – ruhig weiteratmen.', '10 Min liegen bleiben, langsam über die Seite aufstehen.'],
    cues: ['Lange, ruhige Ausatmung', 'Ideal abends vor dem Schlafen'], err: ['Schnell aufspringen (Kreislauf)', 'Sich auf die Matte „fallen lassen“'] }
];
// v1.7.5: Abwechslung – Pool (täglich 3 nach Datum); v1.7.21: +Halber Frosch, +Seitlicher Ausfallschritt im Knien
const ROT = [
  { id: 'rbutter', rot: 1, n: 'Liegender Schmetterling', sub: 'Abwechslung · Adduktoren/Leiste & Hüfte', dose: '1×30 s', t: 'time', sets: 1, secs: 30,
    steps: ['Rückenlage, Knie gebeugt, Füße am Boden.', 'Fußsohlen aneinanderlegen und die Knie langsam nach außen sinken lassen.', 'Arme locker neben dem Körper, unterer Rücken bleibt entspannt am Boden.', '30 s ruhig atmen und mit jeder Ausatmung etwas mehr loslassen. Knie mit den Händen zusammenführen und lösen.'],
    cues: ['Schwerkraft arbeiten lassen – nicht mit den Händen drücken, nicht ins Endgefühl', 'Kissen unter die Knie, linkes Knie darf höher bleiben', 'Kribbeln in den Zehen → Füße weiter weg vom Becken, lockerer'],
    err: ['Knie aktiv nach unten pressen', 'Hohlkreuz', 'Luft anhalten'] },
  { id: 'kneechest', rot: 1, n: 'Knie zur Brust', sub: 'Abwechslung · unterer Rücken & Gesäß', dose: '8 pro Seite, im Wechsel', t: 'reps', sets: 1, reps: 8, ps: true,
    steps: ['Rückenlage, beide Beine lang ausgestreckt.', 'Ein Knie mit beiden Händen (unterhalb der Kniescheibe oder an der Kniekehle) sanft zur Brust ziehen.', 'Das andere Bein bleibt lang am Boden liegen.', '2–3 s halten, ablegen, Seite wechseln – 8 pro Seite.'],
    cues: ['Nur ein kurzer Weg – nicht fest an die Brust, nicht ins Endgefühl', 'Knie bleibt in der Linie zur Schulter, nicht über die Körpermitte ziehen', 'Kopf und Schultern bleiben am Boden', 'Langsam, ruhig ausatmen beim Heranziehen', 'Kribbeln in den Zehen → weniger weit ziehen'],
    err: ['Ruckartig ziehen', 'Langes Bein hebt mit ab', 'Kopf zum Knie heben'] },
  { id: 'recpig', rot: 1, n: 'Liegende Taube (Figur 4)', sub: 'Abwechslung · Gesäß/Piriformis', dose: '30 s pro Seite, links 40 s', t: 'time', sets: 1, secs: 30, secsL: 40, secsR: 30, ps: true,
    steps: ['Rückenlage, beide Knie gebeugt, Füße am Boden.', 'Linken Knöchel auf das rechte Knie legen (Figur 4), Fuß aktiv angezogen.', 'Den stützenden Fuß am Boden lassen – nicht fest zu dir ziehen, nicht ins Endgefühl gehen.', 'Links 40 s, rechts 30 s halten, ruhig atmen.'],
    cues: ['Nur schmerzfrei, kein Druck am Endpunkt', 'Kein festes Ziehen – Knöchel aufs Knie legen reicht', 'Dehnung im Gesäß der oberen Seite, nicht im Knie', 'Becken und Kopf bleiben am Boden', 'Links nicht tiefer ins Endgefühl als rechts', 'Kribbeln in den Zehen → weniger ziehen'],
    err: ['Becken hebt ab / rollt ein', 'Am Knie statt am Oberschenkel ziehen', 'Schultern verkrampfen'] },
  { id: 'halfhero', rot: 1, n: 'Halber Held', sub: 'Abwechslung · Oberschenkel vorne & Hüftbeuger', dose: '30 s pro Seite', t: 'time', sets: 1, secs: 30, ps: true,
    steps: ['Aufrecht sitzen, ein Bein lang nach vorn.', 'Das andere Bein nach hinten beugen, der Fuß liegt neben der Hüfte, Fußrücken am Boden.', 'Mit den Händen hinter dir abstützen und vorsichtig nur so weit zurücklehnen, wie es angenehm ist.', '30 s ruhig atmen, langsam aufrichten, Seite wechseln.'],
    cues: ['Bis einschließlich Di 17.11. pausiert (Hexenschuss)', 'Vorsicht mit dem Knie – bei Knieschmerz Kissen unters Gesäß oder aufrecht bleiben', 'Bauch leicht fest, Becken nach hinten kippen – kein Hohlkreuz, lieber aufrecht bleiben als zurücklehnen', 'Kribbeln in den Zehen → sofort lockerer'],
    err: ['Ins Hohlkreuz zurücklehnen', 'Knie zeigt nach außen', 'Zu weit nach hinten erzwingen'] },
  { id: 'sphinx', rot: 1, n: 'Sphinx', sub: 'Abwechslung · Wirbelsäule/Bauch, sanfte Streckung', dose: '1×30 s', t: 'time', sets: 1, secs: 30,
    steps: ['Bauchlage, Beine lang, Stirn am Boden.', 'Ellbogen unter die Schultern, Unterarme parallel ablegen.', 'Brust sanft anheben, Blick nach vorn unten, Nacken lang.', 'Gesäß locker lassen, 30 s ruhig in den Bauch atmen, dann langsam ablegen.'],
    cues: ['Bis einschließlich Di 17.11. pausiert (Hexenschuss)', 'Nur flach auf den Unterarmen, nie auf gestreckte Arme hochdrücken – Streckung ist aktuell dein Auslöser', 'Oft angenehm für die Bandscheibe', 'Gesäß entspannt, Schultern weg von den Ohren', 'Strahlt es ins Bein aus oder kribbeln die Zehen → sofort abbrechen'],
    err: ['Gesäß anspannen', 'Schultern hochziehen', 'Kopf in den Nacken'] },
  { id: 'sphinxrot', rot: 1, n: 'Sphinx mit Öffnung', sub: 'Abwechslung · Brustwirbelsäule-Rotation', dose: '8 pro Seite', t: 'reps', sets: 1, reps: 8, ps: true,
    steps: ['Aus der Sphinx: Unterarme unter den Schultern, Brust leicht angehoben.', 'Einen Arm seitlich nach außen und oben öffnen, Blick folgt der Hand.', 'Brustkorb dreht mit auf, das Becken bleibt am Boden.', 'Langsam zurück, 8 pro Seite.'],
    cues: ['Bis einschließlich Di 17.11. pausiert (Hexenschuss)', 'Drehung aus der Brust, nicht aus dem unteren Rücken', 'Stützarm aktiv, Schulter stabil', 'Ausstrahlen oder Zehen-Kribbeln → kleiner bewegen oder abbrechen'],
    err: ['Becken dreht mit', 'Schwung statt Kontrolle', 'Ins Hohlkreuz sinken'] },
  { id: 'sidehip', rot: 1, n: 'Seitliche Hüftdehnung', sub: 'Abwechslung · Adduktoren & Hüfte innen', dose: '30 s pro Seite', t: 'time', sets: 1, secs: 30, ps: true,
    steps: ['Aus dem Ausfallschritt am Boden (ein Knie unten).', 'Das vordere Bein seitlich nach außen stellen, Fuß flach, Zehen leicht nach außen.', 'Mit der Hand am Boden oder Knie abstützen.', 'Hüfte sanft zur Seite/nach unten schieben, 30 s halten, Seite wechseln.'],
    cues: ['Nur eine kleine Verschiebung, nicht ins Endgefühl drücken', 'Dehnung an der Innenseite des Oberschenkels', 'Rücken lang, Bauch leicht fest', 'Linke Seite nicht tiefer ins Endgefühl als rechts', 'Kribbeln in den Zehen → weniger tief'],
    err: ['Knie fällt nach innen', 'Rundrücken', 'Wippen'] },
  { id: 'sideadd', rot: 1, n: 'Adduktion in Seitlage', sub: 'Abwechslung · Adduktoren kräftigen', dose: '10 pro Seite', t: 'reps', sets: 1, reps: 10, ps: true,
    steps: ['Seitlage, Kopf auf dem Arm abgelegt.', 'Oberes Bein gebeugt vor dir auf den Boden stellen.', 'Unteres Bein gestreckt, Fuß angezogen.', 'Unteres Bein langsam anheben und ablegen – 10 pro Seite.'],
    cues: ['Kleine, kontrollierte Bewegung', 'Becken stabil, nicht nach hinten kippen', 'Kribbeln in den Zehen → Pause'],
    err: ['Schwung holen', 'Becken rollt nach hinten', 'Bein zu hoch reißen'] },
  { id: 'bearrock', rot: 1, n: 'Bärengang zum Rolling Rock', sub: 'Abwechslung · Rumpf, Hüfte & Schultern', dose: '8 Wiederholungen', t: 'reps', sets: 1, reps: 8,
    steps: ['Vierfüßlerstand, Hände unter den Schultern, Knie unter der Hüfte.', 'Knie wenige Zentimeter vom Boden abheben (schweben).', 'Einen kleinen Schritt vor und zurück machen, Rücken flach.', 'Knie ablegen und das Gesäß sanft Richtung Fersen zurückschaukeln, dann wieder nach vorn – 8 Wiederholungen.'],
    cues: ['Rücken neutral wie ein Tisch', 'Ruhig atmen, Bauch fest', 'Nur ein kleines Schaukeln – nicht Richtung Fersen in die tiefe Beugung, nicht ins Endgefühl', 'Kribbeln in den Zehen → abbrechen'],
    err: ['Hohlkreuz oder Rundrücken', 'Gesäß zu hoch', 'Hektisch'] },
  { id: 'armbeinwisch', rot: 1, n: 'Arm-Bein-Wischübung in Bauchlage (diagonal)', sub: 'Abwechslung · Hüfte & seitlicher Rumpf, Gesäß leicht aktiv · links betont', dose: '1×8 pro Seite · 6–8 Wdh, links ein paar mehr', t: 'reps', sets: 1, reps: 8, ps: true,
    steps: ['Bauchlage, Stirn auf der Matte, Arme und Beine lang.', 'Diagonal einen Arm und das gegenüberliegende Bein gestreckt seitlich über den Boden nach außen wischen (Arm nach oben-außen, Bein nach außen).', 'Kurz halten, dann zurück in die Mitte, Seite wechseln.', 'Langsam, Bauch leicht angespannt, Becken bleibt am Boden. 6–8 Wdh pro Seite – links ein paar mehr (links betont).'],
    cues: ['Nur im schmerzfreien Bereich', 'Arme und Beine nur flach über den Boden wischen – nicht anheben (kein Hohlkreuz)', 'Wenn der Rücken zwickt: Bewegung kleiner machen', 'Becken bleibt am Boden, Bauch leicht fest', 'Links ein paar Wiederholungen mehr als rechts', 'Langsam wischen, kurz halten – kein Schwung'],
    err: ['Becken hebt ab oder dreht mit', 'Ins Hohlkreuz drücken', 'Mit Schwung und zu hektisch', 'Bewegung erzwingen, obwohl der Rücken zwickt'] },
  { id: 'halbfrosch', rot: 1, n: 'Halber Frosch', sub: 'Abwechslung · Adduktoren-Stretch (Half Frog)', dose: '1×10 Wdh. pro Seite, ohne Endhaltung', t: 'reps', sets: 1, reps: 10, ps: true,
    steps: ['Vierfüßlerstand: Hände unter den Schultern, Knie unter den Hüften.', 'Ein Bein gestreckt zur Seite abspreizen, Fuß flach am Boden, Zehen zeigen nach vorn.', 'Hüfte langsam Richtung Ferse des knienden Beins nach hinten schaukeln und wieder nach vorn – Rücken bleibt lang.', '10 Wiederholungen, dann Seite wechseln – beide Seiten gleich, ohne lange Endhaltung.'],
    cues: ['Schmerzfrei, nur ein kurzer Weg, nicht ins Endgefühl', 'Keine lange Endhaltung', 'Beide Seiten gleich belasten', 'Rücken lang, Bauch leicht fest', 'Bein geht zur Seite – nicht nach hinten'],
    err: ['Bein nach hinten statt zur Seite', 'Ins Hohlkreuz sinken / Rücken runden', 'Mit Schwung wippen', 'In den Schmerz gehen'] },
  { id: 'seitausfall', rot: 1, n: 'Seitlicher Ausfallschritt im Knien', sub: 'Abwechslung · Adduktoren-Rock (Kneeling side lunge)', dose: '1×8 pro Seite', t: 'reps', sets: 1, reps: 8, ps: true,
    steps: ['Auf ein Knie knien, Oberkörper aufrecht.', 'Das andere Bein gestreckt zur Seite abspreizen, Fuß flach am Boden.', 'Gewicht seitlich über das gestreckte Bein schieben, bis innen am Oberschenkel ein sanfter Zug entsteht – dann wieder zurück zur Mitte.', '8 Wiederholungen, Seite wechseln – beide Seiten gleich.'],
    cues: ['Schmerzfrei, nur eine kleine Seitverschiebung, nicht ins Endgefühl', 'Beide Seiten gleich', 'Oberkörper bleibt aufrecht', 'Kleine, kontrollierte Bewegung – kein Schwung'],
    err: ['Oberkörper nach vorn kippen', 'Knie des gestreckten Beins nach innen fallen lassen', 'Zu weit / in den Schmerz schieben', 'Mit Schwung wippen'] },
  // v1.8.6: Bausteine für langes Stehen/Gehen (Leiter): seitliche Hüfte (Gluteus medius) + Waden/Fuß
  { id: 'calfraise', rot: 1, n: 'Wadenheben', sub: 'Abwechslung · Waden & Fuß · langes Stehen auf der Leiter', dose: '2×15, oben 1 s halten', t: 'reps', sets: 2, reps: 15,
    steps: ['Hüftbreit stehen, eine Hand leicht an Wand oder Türrahmen für das Gleichgewicht.', 'Aufrecht, Bauch leicht fest, Knie gestreckt (nicht durchgedrückt).', 'Langsam über den Fußballen hoch auf die Zehen drücken, oben 1 s halten.', 'In 2–3 s kontrolliert absenken. 15×, 2 Runden. Später: auf einer Stufe (Fersen unter Stufenhöhe) oder einbeinig.'],
    cues: ['Gewicht über dem Großzehenballen – Knöchel kippen nicht nach außen', 'Langsam runter ist der wichtige Teil', 'Körper bleibt aufrecht, kein Hohlkreuz', 'Hilft gegen schwere Beine und Fußermüdung beim langen Stehen'],
    err: ['Hüpfen / federn', 'Nach außen auf die kleine Zehe rollen', 'Ins Hohlkreuz kippen', 'Zu schnell absenken'] }

];
const ROT_PLAN = ['aei', 'abc', 'def', 'ghi', 'adg', 'beh', 'cfi']; // So..Sa
const rotForOld = k => ROT_PLAN[fromKey(k).getDay()].split('').map(c => ROT['abcdefghi'.indexOf(c)]); // nur für Verlauf vor v1.7.15
// v1.7.0: aus dem Plan entfernt, bleibt nur für alte Verlaufs-Einträge (vgl-mob) erhalten
const RET = [
  { id: 'pigeon', eve: 1, n: 'Taube – Ferse eng', sub: 'Abend · Gesäß/Hüfte außen', dose: '3×60 s links, 2×60 s rechts', t: 'time', sets: 3, setsL: 3, setsR: 2, secs: 60, ps: true,
    steps: ['Aus dem Vierfüßlerstand das linke Knie nach vorn zur Hand bringen, die Ferse eng Richtung Leiste ziehen (Wade liegt am Oberschenkel).', 'Hinteres Bein lang nach hinten ausstrecken.', 'Hüfte gerade ausrichten, aufrecht abstützen – oder, wenn angenehm, auf die Unterarme sinken.', '60 s halten, ruhig atmen, Seite wechseln.'],
    cues: ['Kissen unter die linke Pobacke, wenn du nicht runterkommst', 'Bei Knieschmerz: Ferse näher zur Hüfte oder Kissen unter das Gesäß', 'Dehnung im Gesäß, nicht im Knie'], err: ['Hüfte kippt zur Seite', 'Knie erzwingen / Schmerz im Knie ignorieren'] },
  { id: 'kneel', eve: 1, n: 'Kniestand-Hüftbeuger-Dehnung', sub: 'Abend · Arm über Kopf', dose: '2×60 s pro Seite', t: 'time', sets: 2, secs: 60, ps: true,
    steps: ['Halbkniestand wie morgens, hinteres Knie gepolstert.', 'Gesäß anspannen, Becken leicht nach hinten kippen.', 'Arm der hinteren Seite über den Kopf strecken, leicht zur Gegenseite neigen.', 'Hüfte minimal nach vorn, 60 s ruhig atmen, dann Seite wechseln.'],
    cues: ['Dehnung vorn an der Hüfte bis in die Flanke', 'Oberkörper aufrecht'], err: ['Hohlkreuz', 'Zu tief nach vorn schieben'] }
];

/* v1.8.8/v1.9.0: Hüft-Reha (HipFit) Phase 1 – ab 18.11.2026, Ziel 3×/Woche, täglich optional.
   Keine Duplikate von bridge / birddog / hipflex; abduct ist nach v1.9.0 in diesen Block verschoben. */
const HIP_AMPEL = {
  title: 'Schmerz-Ampel',
  items: [
    'Bis 3/10 ist okay, wenn du am nächsten Morgen wieder auf dem Ausgangsniveau bist.',
    'Ziehen Richtung Steißbein ist nur ein Stopp, wenn es zunimmt.',
    'Stopp bei: Leistenstechen, hartes Anstoßgefühl, Blockieren oder Einklemmen, Instabilität links oder Wegknicken, Ausstrahlung, Nachtschmerz, Hinken, schmerzhaftes Knacken (schmerzloses Knacken ist meist harmlos). Dann aufhören und beim Arzt ansprechen.'
  ]
};
const STOP = HIP_AMPEL.items.join(' ');

const HIP_ALLTAG = {
  title: 'Alltag, Schlaf & Gym – bis zum MRT',
  items: [
    'Schlaf: Rückenlage oder rechte Seite mit Kissen zwischen den Knien.',
    'Bis zum MRT nicht: Vorbeugen mit überkreuzten Beinen und ähnliches tiefes Vorbeugen im Stand.',
    'Nicht im Hüftstand stehen, keine überschlagenen Beine.',
    'Tiefe Sitze und die Hocke meiden; bei Montagen knien mit Kniekissen.',
    'Langes Stehen alle 20–30 Min auflockern. Einlage weiter tragen.',
    'Radfahren mit etwas höherem Sattel.',
    'Keine harten Stoßbelastungen: keine Sprünge, kein Joggen auf hartem Boden, keine schweren Lasten tief in der Hüfte.',
    'Gut geeignet: Rad, Crosstrainer, Gehen, Schwimmen (kein Brustbeinschlag, lieber Kraul-Beine).',
    'Bei Beinen und Hüfte lieber mehr Wiederholungen mit moderatem Gewicht als wenige schwere.',
    'Gym: Beinpresse und Hackenschmidt max. ca. 90° Hüftbeugung, Knie nicht nach innen.',
    'Abduktoren-Maschine und Hip Thrust okay, wenn schmerzfrei.',
    'Keine Rotation unter Last. Schwere Seitbeugen weglassen.'
  ]
};
const HIP_MRT_Q = {
  title: 'Fragen für das MRT-Gespräch',
  items: [
    'Ist die Verkalkung eine Verdichtung am Pfannendach, Kalk im Knorpel oder Labrum, oder ein freier Gelenkkörper?',
    'Wie ist der Knorpel an der Stelle – gibt es Knorpelschäden oder ein Knochenödem?',
    'Falls Kalk im Knorpel: Blutwerte beim Hausarzt (Calcium, Parathormon, Ferritin/Eisen, Magnesium, Phosphat)?',
    'Ändert der Befund etwas am Training oder an der OP-Frage?',
    'Normales MRT oder MR-Arthrografie / 3 Tesla?',
    'Wurde die Torsion von Oberschenkel und Pfanne mitgemessen?',
    'LCE-Winkel, Tönnis-Winkel, vordere Überdachung – echte oder grenzwertige Dysplasie?',
    'Wie sind Labrum und Knorpel, welcher Tönnis-Grad?',
    'Gibt es eine Cam-Form, wie ist der Alpha-Winkel (Mischform)?',
    'Erklärt die Hüfte die Beschwerden in Rücken und Steißbein, oder die LWS mitbeurteilen?',
    'Ab welchen Befunden wäre eine OP sinnvoll, und wie lange ist eine Trainingschance (3–6 Monate)?',
    'Physio-Rezept mit Fokus Hüftstabilisation, Freigabe für Training und Arbeit?',
    'Bei der OP-Frage eine Zweitmeinung in einem Zentrum für Hüftgelenkerhalt einholen?'
  ]
};
function hipAdviceHtml() {
  const ul = (a) => `<ul class="mob-ul">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  return `<div class="sec-h muted small" style="margin:18px 2px 2px">◇ BIS ZUM MRT</div>
    <div class="card mob-ampel"><h3 class="mob-h3">${esc(HIP_AMPEL.title)}</h3>${ul(HIP_AMPEL.items)}</div>
    <div class="card mob-alltag"><h3 class="mob-h3">${esc(HIP_ALLTAG.title)}</h3>${ul(HIP_ALLTAG.items)}</div>
    <div class="card mob-mrt"><h3 class="mob-h3">${esc(HIP_MRT_Q.title)}</h3>${ul(HIP_MRT_Q.items)}</div>`;
}

const HIP = [
  { id: 'hipabdst', hip: 1, core: 1, n: 'Hüftabduktion im Stehen', sub: 'Hüft-Reha · HipFit · äußere Hüfte / Gesäß', dose: '10–15 pro Seite, 3 s halten', t: 'reps', sets: 1, reps: 15, ps: true, hold: 3,
    yt: 'https://www.youtube.com/watch?v=yiGPgws33Hg',
    steps: ['Füße geschlossen zusammenstellen. Hände seitlich am Rumpf abstützen – bei Bedarf an einer Stuhllehne festhalten.', 'Gesäßmuskulatur anspannen und ein Bein vom Boden abheben, das Knie dabei etwa 45° gebeugt.', 'Becken, Oberkörper und Schultern bleiben aufrecht. Das Knie aus der Körpermitte nach außen zur Seite öffnen.', '3 Sekunden halten, dann kontrolliert in die Ausgangsstellung zurück. Das Gesäß bleibt an, die Beinachse des Standbeins bleibt stabil. 10–15 Wiederholungen, dann Seite wechseln.'],
    cues: ['Aufrichtung: Becken waagrecht, Oberkörper und Schultern gerade', 'Standbein stabil, Knie in der Beinachse', 'Gesäß die ganze Zeit anspannen', 'Knie 45° gebeugt aus der Körpermitte nach außen öffnen – kein Schwung, kein Knieheben nach vorn', 'Jede Wdh. 3 s halten, selbst zählen', STOP],
    err: ['Standbein sackt ein oder das Knie fällt nach innen', 'Oberkörper oder Becken kippt zur Seite', 'Mit Schwung öffnen statt 3 s halten'] },
  { id: 'wallsit', hip: 1, core: 1, n: 'Wandrutschen', sub: 'Hüft-Reha · HipFit · Oberschenkel & Gesäß', dose: '10×15 s, 5 s Pause', t: 'reps', sets: 1, reps: 10, hold: 15, pause: 5,
    yt: 'https://www.youtube.com/watch?v=OLALc2fsmtM',
    steps: ['Hüftbreiter Stand, Rücken an die Wand gelehnt, Hände seitlich am Rumpf. Die Füße eine Fußlänge von der Wand entfernt aufstellen.', 'Mit aufrechtem Oberkörper an der Wand nach unten rutschen, bis die Knie 45–60° gebeugt sind – nicht tiefer.', 'Knie nicht über die Zehen hinausschieben, Knie bleiben in der Beinachse.', '15 Sekunden halten, dann nach oben in die Ausgangsstellung drücken. 5 Sekunden Pause, insgesamt 10 Wiederholungen.'],
    cues: ['Knie nur leicht 45–60° beugen – Oberschenkel nicht waagrecht, nicht in die tiefe Hocke', 'Füße eine Fußlänge von der Wand, Knie nicht über die Zehen, in der Beinachse bleiben', 'Oberkörper aufrecht, Rücken bleibt an der Wand', 'Jede Wdh. 15 s halten, selbst zählen', STOP],
    err: ['Zu tief rutschen (unter 60°)', 'Knie wandern über die Zehen oder nach innen', 'Oberkörper löst sich von der Wand'] },
  { id: 'slbalance', hip: 1, core: 1, n: 'Einbeiniges Gleichgewicht an der Wand', sub: 'Hüft-Reha · HipFit · Standbein & Hüftstabilität', dose: '10–15×5 s pro Seite, 5 s Pause', t: 'reps', sets: 1, reps: 15, ps: true, hold: 5, pause: 5,
    yt: 'https://www.youtube.com/watch?v=ILpQHqdF5Xc',
    steps: ['Schulterbreiter Stand seitlich an einer Wand, sodass ein Bein die Wand berührt – das ist das Spielbein, nicht das Standbein.', 'Der Arm dieser Seite lehnt mit der Außenseite ebenfalls gegen die Wand.', 'Dieses wandseitige Bein 90° in Knie und Hüfte anbeugen und den Kontakt halten. Dann den Oberschenkel bzw. das Knie mit Spannung seitlich gegen die Wand drücken.', 'Auf dem anderen Bein (Standbein) bei leicht gebeugtem Knie die Balance halten und auf die Beinachse achten. 5 Sekunden halten, zurück in die Ausgangsstellung.', '10–15 Wiederholungen mit 5 Sekunden Pause dazwischen, dann die andere Seite (Wand auf der anderen Seite).'],
    cues: ['Die Wand ist seitlich, nicht vor dir', 'Spielbein und Arm-Außenseite derselben Seite berühren die Wand', 'Spielbein 90° in Hüfte und Knie, mit Spannung seitlich gegen die Wand drücken', 'Standbein = das andere Bein, Knie leicht gebeugt, in der Beinachse', 'Jede Wdh. 5 s halten, selbst zählen', STOP],
    err: ['Die Wand vor den Körper stellen und mit der Handfläche dagegen stützen', 'Das Standbein gegen die Wand drücken statt das Spielbein', 'Standbein durchdrücken oder Knie nach innen fallen lassen', 'Becken zur Seite kippen', 'Den Wandkontakt verlieren'] },
  { id: 'sidewalk', hip: 1, core: 1, n: 'Seitwärts gehen', sub: 'Hüft-Reha · HipFit · äußere Hüfte, Rumpfstabilität', dose: '4 Bahnen à 5 Schritte hin und zurück', t: 'reps', sets: 1, reps: 4,
    yt: 'https://www.youtube.com/watch?v=jy55DMhen_k',
    steps: ['Hüftbreiter Stand, Fußspitzen zeigen gerade nach vorn, Arme zur Seite ausgestreckt, Knie leicht gebeugt.', 'Gleichmäßige, große Seitwärtsschritte in eine Richtung. Balance und Stabilität im Oberkörper halten – der Oberkörper neigt sich nicht zur Seite.', '5 Schritte hin, dann 5 Schritte zurück. Das ist eine Bahn.', 'Die Übung viermal wiederholen (4 Bahnen).'],
    cues: ['Fußspitzen bleiben nach vorn, Knie leicht gebeugt', 'Keine tiefen Seitausfallschritte, nur kontrollierte Schritte', 'Oberkörper nicht zur Seite neigen', 'Gleichmäßige, kontrollierte Schritte', STOP],
    err: ['Oberkörper schwankt oder neigt sich', 'Fußspitzen drehen nach außen', 'Schritte zu klein oder mit Schwung'] },
  { id: 'sidetap', hip: 1, core: 1, n: 'Seit-Tippen', sub: 'Hüft-Reha · HipFit · äußere Hüfte', dose: '10–15 pro Seite', t: 'reps', sets: 1, reps: 15, ps: true,
    yt: 'https://www.youtube.com/watch?v=Z01xasXBQrw',
    steps: ['Schulterbreiter Stand, Hände seitlich am Rumpf abstützen.', 'Ein Bein zur Seite strecken und mit der Fußspitze auf den Boden tippen – kein tiefer Ausfallschritt.', 'Das Bein anschließend in den schulterbreiten Stand zurückstellen.', 'Rumpf stabil, Oberkörper aufrecht. 10–15 Mal auf einer Seite, dann wechseln.'],
    cues: ['Nur tippen, nicht in die Tiefe gehen', 'Rumpf stabil, Oberkörper aufrecht', 'Standbein bleibt in der Beinachse', STOP],
    err: ['Zu weit oder zu tief zur Seite sinken', 'Oberkörper zur Seite neigen', 'Das Standbein einknicken'] },
  { id: 'smalllunge', hip: 1, core: 1, n: 'Kleine Ausfallschritte', sub: 'Hüft-Reha · HipFit · Gesäß & Beinachse', dose: '10–15 pro Seite à 5 s', t: 'reps', sets: 1, reps: 15, ps: true, hold: 5,
    yt: 'https://www.youtube.com/watch?v=qKQJMwesjnM',
    steps: ['Hüftbreiter Stand, Hände seitlich am Rumpf. Nur einen kleinen Ausfallschritt nach vorn – kurze Schrittstellung.', 'Beinachse: das vordere Knie zeigt in Richtung der Fußspitze. Vorderes Knie beugen und 5 Sekunden halten.', 'Die Ferse des hinteren Fußes bleibt am Boden, Becken gerade, Oberkörper aufrecht.', 'Spannung lösen, Knie wieder strecken. 10–15 Mal auf einer Seite, dann wechseln.'],
    cues: ['Nur wenn der untere Rücken ruhig bleibt', 'Kurze Schrittstellung, hintere Ferse bleibt unten – hintere Hüfte nicht in die Streckung drücken', 'Vordere Hüfte nicht tief beugen, nicht ins Endgefühl', 'Vorderes Knie in Richtung Fußspitze, nicht nach innen', 'Becken gerade, Oberkörper aufrecht', 'Jede Wdh. 5 s halten, selbst zählen', STOP],
    err: ['Lange Schrittstellung oder hintere Ferse hebt ab', 'Vorderes Knie fällt nach innen', 'Hohlkreuz oder Ziehen im unteren Rücken – dann heute weglassen', 'Wippen statt 5 s halten'] },
  { id: 'abduct', hip: 1, core: 1, n: 'Seitlage-Abduktion', sub: 'Hüft-Reha · äußere Hüfte / Gluteus medius', dose: '3×10–15 pro Seite, 2 s halten', t: 'reps', sets: 3, reps: 15, ps: true, hold: 2,
    steps: ['Seitlage, Kopf auf dem unteren Arm, obere Hand vor der Brust am Boden. Unteres Bein leicht gebeugt.', 'Oberes Bein gestreckt, leicht hinter der Körperlinie. Fußspitze neutral oder leicht nach unten, nicht zur Decke drehen.', 'Bein langsam anheben, 2 Sekunden halten, kontrolliert ablegen.', '10–15 Wiederholungen, dann Seite wechseln. 3 Sätze pro Seite.'],
    cues: ['Bein leicht hinter der Körperlinie, nicht nach vorn', 'Fußspitze neutral oder leicht nach unten – nicht zur Decke', 'Becken bleibt übereinander, nicht nach hinten rollen', 'Lieber niedrig und sauber als hoch', 'Jede Wdh. 2 s halten, selbst zählen', STOP],
    err: ['Bein zu hoch reißen → Becken kippt, Rücken arbeitet', 'Zehen zur Decke drehen', 'Bein nach vorn ziehen (Hüftbeuger statt Po)', 'Schwung'] },
  { id: 'medplank', hip: 1, core: 1, n: 'Gluteus-medius-Seitstütz', sub: 'Hüft-Reha · Knie-Seitstütz, oberes Bein abheben', dose: '2×8–10 pro Seite, 2 s halten', t: 'reps', sets: 2, reps: 10, ps: true, hold: 2,
    steps: ['Knie-Seitstütz: unterer Unterarm und unteres Knie am Boden, Hüfte anheben, Körper in einer Linie von Kopf bis Knie.', 'Das obere Bein langsam abheben, Fußspitze neutral, 2 Sekunden halten, kontrolliert ablegen – das Becken bleibt oben und nicht verdrehen.', '8–10 Wiederholungen, dann Seite wechseln. 2 Sätze.'],
    cues: ['Knie-Seitstütz halten, dann das obere Bein abheben', 'Becken bleibt oben und zeigt nach vorn, nicht einknicken', 'Fußspitze neutral, keine Schwungbewegung', 'Jede Wdh. 2 s halten, selbst zählen', STOP],
    err: ['Hüfte sackt ab oder dreht nach vorn', 'Oberes Bein mit Schwung reißen', 'In der Lende ein Hohlkreuz machen'] },
  { id: 'slbridge', hip: 1, core: 1, n: 'Einbeinige Brücke', sub: 'Hüft-Reha · Gesäß, nur wenn beidbeinig schmerzfrei', dose: '2×8–10 pro Seite', t: 'reps', sets: 2, reps: 10, ps: true, hold: 'kurz',
    steps: ['Nur wenn die beidbeinige Brücke schmerzfrei gelingt.', 'Rückenlage, ein Fuß fest am Boden, das andere Bein strecken oder zur Decke halten.', 'Gesäß anspannen und das Becken heben, bis Schulter, Hüfte und Standknie eine Linie bilden – nicht überstrecken, kein Hohlkreuz.', 'Kurz halten, kontrolliert ablegen. 8–10 Wiederholungen, dann Seite wechseln. 2 Sätze.'],
    cues: ['Nur wenn die beidbeinige Brücke schmerzfrei ist', 'Nicht überstrecken – Rippen unten, kein Hohlkreuz', 'Gewicht fest auf dem Standfuß, Becken bleibt waagrecht', 'Jede Wdh. kurz halten, selbst zählen', STOP],
    err: ['Überstrecken / Hohlkreuz', 'Becken kippt zur Seite', 'Trotz Schmerz in der beidbeinigen Brücke einbeinig weitermachen'] }
];
const HIP2 = [

  { id: 'stepdown', hip: 1, locked: 1, n: 'Herabsteigen', sub: 'Hüft-Reha · HipFit · Phase 2', dose: '10–15 pro Seite', t: 'reps', sets: 1, reps: 15, ps: true,
    yt: 'https://www.youtube.com/watch?v=__zvHYMJYvk',
    steps: ['Seitlich auf einer Treppenstufe oder einem Stepper stehen. Bei Bedarf am Geländer festhalten oder Hände seitlich am Rumpf abstützen.', 'Oberkörper aufrecht. Ein Bein seitlich der Stufe absenken, bis die Ferse den Boden berührt – dazu das Standbein in Hüfte und Knie beugen.', 'Das gebeugte Bein auf der Stufe bleibt in der Beinachse. Sobald die Ferse den Boden berührt, wieder nach oben in die Ausgangsstellung drücken.', '10–15 Wiederholungen auf einer Seite, dann Seite wechseln.'],
    cues: ['Phase 2: nach MRT und wenn der Rücken ruhig ist – noch nicht aktiv', 'Standbein in der Beinachse', 'Oberkörper aufrecht', STOP],
    err: ['Knie des Standbeins fällt nach innen', 'Zu tief oder unkontrolliert absenken'] },
  { id: 'slsquat', hip: 1, locked: 1, n: 'Einbeinige Kniebeuge', sub: 'Hüft-Reha · HipFit · Phase 2', dose: '10–15 pro Seite, 45–60°', t: 'reps', sets: 1, reps: 15, ps: true,
    yt: 'https://www.youtube.com/watch?v=ofKEb-bQUHk',
    steps: ['Auf einem Bein stehen, das andere Bein 90° im Knie anbeugen. Bei Bedarf an einer Stuhllehne festhalten oder die Arme locker hängen lassen.', 'Das Standbein zwischen 45 und 60° beugen, dann das Knie wieder strecken und in die Ausgangsstellung zurückkehren.', 'Knie nicht über die Zehen hinausschieben, Knie bleibt in der Beinachse.', '10–15 Wiederholungen auf einer Seite, dann Seite wechseln.'],
    cues: ['Phase 2: nach MRT und wenn der Rücken ruhig ist – noch nicht aktiv', 'Nur 45–60°, nicht tiefer', 'Knie in der Beinachse, nicht über die Zehen', STOP],
    err: ['Knie wandert über die Zehen oder nach innen', 'Zu tief beugen', 'Oberkörper kippt nach vorn'] }
];

const ALL = [...EX, ...ROT, ...EVE, ...FAS, ...RET, ...MRET, ...HIP];
const byId = id => ALL.find(e => e.id === id);
const im = ex => ex.img || ex.id;

/* ---------- v1.7.15: Tages-Rotation ----------
   Jeder Block hat feste Kern-Übungen (core: 1, täglich) + einen Wechsel-Pool. Aus dem Pool kommen pro Tag k Übungen,
   deterministisch nach Datum (Tag-Nr. × k mod Poolgröße → lückenlos, jede Übung kommt regelmäßig dran). */
// v1.8.6: Morgen k=1 – 9 Kern-Übungen + 1 im Wechsel (World's Greatest Stretch / Bein über die Rolle), damit die Routine kurz bleibt
const BLK = { m: { pool: EX, k: 1 }, w: { pool: ROT, k: 3 }, a: { pool: EVE, k: 3 }, f: { pool: FAS, k: 3 }, h: { pool: HIP, k: 9 } };
// v1.8.6: Logik in MOBCORE.planIds (getestet) – pausierte Übungen (Hexenschuss bis 17.11.) fallen raus, zählen nicht im Zähler
function lineup(b, key) { if (b === 'h' && !MOBCORE.hipOpen(key)) return []; const B = BLK[b]; return MOBCORE.planIds(B.pool, B.k, key).map(byId); }
const pausedNow = b => (b === 'a' ? [...BLK[b].pool, ...RET] : BLK[b].pool).filter(e => MOBCORE.pauseInfo(e.id, tk()));
const pauseNote = b => { const p = pausedNow(b); return p.length ? `<div class="mob-pause muted small">⏸ ${p.map(e => esc(e.n)).join(', ')} – ${esc(MOBCORE.pauseInfo(p[0].id, tk()).label)}</div>` : ''; };
const isRotToday = (e, b) => b !== 'w' && !e.core;
const blockOf = e => e.hip ? 'h' : e.eve ? 'a' : e.fas ? 'f' : e.rot ? 'w' : (EX.includes(e) || MRET.includes(e)) ? 'm' : null;
// heutige Liste eines Blocks: Tages-Lineup + heute bereits Abgehaktes (z. B. vor dem Update), damit nichts verschwindet
function todayList(b, d) { const lu = lineup(b, tk()); return lu.concat([...BLK[b].pool, ...(b === 'm' ? MRET : [])].filter(e => !lu.includes(e) && d.today.done[e.id])); }

/* ---------- v1.7.26: optionale Zusatzübungen (Morgen/Abend) ----------
   Extras liegen in d.today.extra.{m|a}; zählen NICHT zum Block-Zähler, werden aber geloggt. */
const extraPool = b => (b === 'm' ? [...EX, ...ROT] : b === 'a' ? [...EVE, ...RET] : []).filter(e => !MOBCORE.pauseInfo(e.id, tk()));
function extrasOf(b, d) { const ids = (d.today.extra && d.today.extra[b]) || []; return ids.map(byId).filter(Boolean); }
function blockList(b, d) {
  const base = todayList(b, d); const seen = new Set(base.map(e => e.id));
  return base.concat(extrasOf(b, d).filter(e => !seen.has(e.id)));
}
function planCount(b, d) { return lineup(b, tk()).length; } // Zähler ohne Extras
function isExtra(ex, b, d) { return !!(d.today.extra && (d.today.extra[b] || []).includes(ex.id)) && !lineup(b, tk()).some(e => e.id === ex.id); }

// Plan eines gespeicherten Tages: neue Einträge haben h.lineup, ältere (vor v1.7.15) bekommen den damaligen Plan
function planOf(h, b) { if (h.lineup && h.lineup[b]) return h.lineup[b].map(byId).filter(Boolean);
  if (b === 'm') return EX_OLD.map(byId);
  if (b === 'w') return rotForOld(h.date);
  if (b === 'a') return EVE.filter(e => e.id !== 'psoasreset' && e.id !== 'kniefersenrock' && e.id !== 'hipflexstand' && e.id !== 'hipwallrot' && e.id !== 'hipwallstep' && e.id !== 'fig4' && e.id !== 'rumpfrot');
  if (b === 'f') return FAS.slice();
  return []; } // h (HipFit) und Unbekanntes: bei alten Einträgen ohne lineup nicht nachträglich einfügen


function hipDoneKeys(d, key) {
  const keys = [];
  (d.history || []).forEach(h => { const plan = planOf(h, 'h'); if (plan.length && plan.every(e => h.done.includes(e.id))) keys.push(h.date); });
  if (key && MOBCORE.hipOpen(key) && d.today && d.today.date === key && !keys.includes(key)) {
    const plan = lineup('h', key);
    if (plan.length && plan.every(e => d.today.done[e.id])) keys.push(key);
  }
  return keys;
}
function hipWeekDone(d, key) { return MOBCORE.hipWeekCount(hipDoneKeys(d, key), key); }

/* ---------- Statistik ---------- */
function stats() {
  const d = ld(); const days = new Set(d.history.map(h => h.date));
  let st = 0; const c = new Date(); if (!days.has(dkey(c))) c.setDate(c.getDate() - 1);
  while (days.has(dkey(c))) { st++; c.setDate(c.getDate() - 1); }
  const wk = weekStart().getTime(); const week = d.history.filter(h => fromKey(h.date).getTime() >= wk).length;
  return { streak: st, total: d.history.length, week, todayDone: days.has(tk()) };
}

/* ---------- Timer ---------- */
let T = null; // {id, segs:[{set,side}], i, left, run, last}
function segsOf(ex) { const a = []; const nL = ex.setsL || ex.sets, nR = ex.setsR || ex.sets, mx = ex.ps ? Math.max(nL, nR) : ex.sets; const pz = ex.pause != null ? ex.pause : 12;
  if (!ex.ps) { for (let s = 1; s <= ex.sets; s++) a.push({ set: s, side: '', secs: ex.secs, n: ex.sets }); }
  else if (ex.sideThen) { for (let s = 1; s <= nL; s++) a.push({ set: s, side: 'Links', secs: ex.secsL || ex.secs, n: nL }); for (let s = 1; s <= nR; s++) a.push({ set: s, side: 'Rechts', secs: ex.secsR || ex.secs, n: nR }); }
  else { for (let s = 1; s <= mx; s++) { if (s <= nL) a.push({ set: s, side: 'Links', secs: ex.secsL || ex.secs, n: nL }); if (s <= nR) a.push({ set: s, side: 'Rechts', secs: ex.secsR || ex.secs, n: nR }); } }
  const b = []; a.forEach((g, k) => { b.push(g); if (k < a.length - 1 && pz) { const nx = a[k + 1]; b.push({ pause: true, set: nx.set, side: 'Pause → ' + (nx.side || 'nächster Satz'), secs: pz, n: nx.n }); } });
  return b; }
function logSeg(id, sg, secs) { const d = day(); const L = d.today.log || (d.today.log = {}); (L[id] || (L[id] = [])).push({ side: sg.side, set: sg.set, secs: Math.round(secs) }); sv(d); }
function beep(n = 1, f = 880) {
  try { const C = beep.c || (beep.c = new (window.AudioContext || window.webkitAudioContext)()); C.resume && C.resume();
    for (let i = 0; i < n; i++) { const o = C.createOscillator(), g = C.createGain(); o.frequency.value = f; o.connect(g); g.connect(C.destination); const t0 = C.currentTime + i * .28;
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.4, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + .22); o.start(t0); o.stop(t0 + .25); } } catch (_) { }
  try { navigator.vibrate && navigator.vibrate(n > 1 ? [200, 100, 200, 100, 300] : 250); } catch (_) { }
}
function tInit(ex) { if (!T || T.id !== ex.id) T = { id: ex.id, segs: segsOf(ex), i: 0, left: 0, run: false, done: false }, T.left = T.segs[0].secs; }
function tTick() {
  if (!T || !T.run) return; const now = Date.now(); const pl = Math.ceil(T.left); T.left -= (now - T.last) / 1000; T.last = now;
  const cl = Math.ceil(T.left); if (cl < pl && cl >= 1 && cl <= 3) beep(1, 660);
  if (T.left <= 0) {
    const ex = byId(T.id);
    if (!T.segs[T.i].pause) logSeg(T.id, T.segs[T.i], T.segs[T.i].secs);
    if (T.i < T.segs.length - 1) { T.i++; T.left = T.segs[T.i].secs; beep(1); toast(T.segs[T.i].pause ? '⏸ 12 s Pause – in Ruhe umsetzen' : (T.segs[T.i].side ? 'Los → ' + T.segs[T.i].side : 'Los – nächster Satz'), 1600); }
    else { T.run = false; T.left = 0; T.done = true; beep(3, 990); markDone(T.id, true); toast('Übung geschafft ✓', 1600); wakeSync(); }
  }
  tPaint();
}
setInterval(tTick, 200);
/* Wake Lock: Bildschirm bleibt an, solange ein Timer läuft (Fallback: stummes Loop-Video) */
let WL = null, WLp = false, WV = null;
function wvStart() { try { if (!WV) { WV = document.createElement('video'); WV.src = 'assets/keepawake.mp4'; WV.muted = true; WV.loop = true; WV.setAttribute('muted', ''); WV.setAttribute('playsinline', ''); WV.setAttribute('aria-hidden', 'true');
  WV.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0.01;left:0;bottom:0;pointer-events:none'; document.body.appendChild(WV); } const p = WV.play(); p && p.catch(() => { }); } catch (_) { } }
function wakeOn() {
  if ('wakeLock' in navigator) { if (WL || WLp) return; WLp = true;
    navigator.wakeLock.request('screen').then(l => { WLp = false; if (!(T && T.run)) { l.release().catch(() => { }); return; } WL = l; l.addEventListener('release', () => { if (WL === l) WL = null; }); })
      .catch(() => { WLp = false; if (document.visibilityState === 'visible') wvStart(); });
  } else wvStart();
}
function wakeOff() { if (WL) { const l = WL; WL = null; l.release().catch(() => { }); } if (WV) try { WV.pause(); } catch (_) { } }
function wakeSync() { (T && T.run && document.visibilityState === 'visible') ? wakeOn() : wakeOff(); }
document.addEventListener('visibilitychange', wakeSync);
window.addEventListener('pagehide', wakeOff);
function tPaint() {
  const el = document.getElementById('mt'); if (!el || !T) return; const ex = byId(T.id); const sg = T.segs[T.i];
  const left = Math.max(0, Math.ceil(T.left)); const frac = T.left / sg.secs; const C = 2 * Math.PI * 88;
  el.querySelector('.mt-num').textContent = Math.floor(left / 60) + ':' + pad(left % 60);
  el.querySelector('.mt-sub').textContent = T.done ? 'Fertig 💪' : sg.pause ? '⏸ ' + sg.side : `Satz ${sg.set}/${sg.n}${sg.side ? ' · ' + sg.side + (ex.secsL ? ' · ' + sg.secs + ' s' : '') : ''}${'' ? ' · ' + sg.side : ''}`;
  el.querySelector('.mt-fg').style.strokeDashoffset = C * (1 - frac);
  el.querySelector('[data-act=mobT]').textContent = T.run ? '❚❚ Pause' : (T.done ? '↻ Nochmal' : (T.left < sg.secs || T.i ? '▶ Weiter' : '▶ Start'));
  el.classList.toggle('run', T.run);
  $$('.mt-seg').forEach((s, i) => s.classList.toggle('on', i < T.i || T.done));
}

/* ---------- Tagesstand ---------- */
function markDone(id, val) { const d = day(); if (val) { d.today.done[id] = true; const ex = byId(id); if (ex && ex.t === 'reps' && !ex.hip) d.today.sets[id] = ex.sets * (ex.ps ? 2 : 1); } else delete d.today.done[id]; sv(d); const b = document.querySelector('[data-act=mobChk]'); if (b && document.getElementById('mob-detail')) render(true); }

/* ---------- Views ---------- */
function row(ex, d, i, b) {
  const ok = !!d.today.done[ex.id]; const xtra = (b === 'm' || b === 'a') && isExtra(ex, b, d);
  return `<div class="card mob-row ${ok ? 'ok' : ''}" data-act="go" data-to="#/mob/${ex.id}">
    <button class="mob-chk ${ok ? 'on' : ''}" data-act="mobChk" data-id="${ex.id}" aria-label="Abhaken">${ok ? '✓' : (xtra ? '＋' : ex.hip ? '◇' : ex.eve ? '☾' : ex.fas ? '◎' : ex.rot ? '🔄' : i)}</button>
    <div class="mob-thumb"><img class="mob-thumb-img" src="./assets/mob/${im(ex)}.webp" alt="" loading="lazy"></div>
    <div class="mob-rt"><b>${esc(ex.n)}</b><div class="muted small">${esc(ex.dose)}</div>${xtra ? '<div class="mob-rotl">＋ Zusatz (optional)</div>' : isRotToday(ex, b) ? '<div class="mob-rotl">↻ heute im Wechsel</div>' : ''}</div><span class="mob-go">›</span></div>`;
}
function viewList() {
  const d = day(); const s = stats(); const MT = blockList('m', d), RT = todayList('w', d), ET = blockList('a', d), FT = todayList('f', d), HT = todayList('h', d);
  const mPlan = planCount('m', d), aPlan = planCount('a', d), hPlan = planCount('h', d); const hipOn = MOBCORE.hipOpen(tk()); const hWeek = hipWeekDone(d, tk());
  const cntPlan = (l, planN) => Math.min(planN, l.filter(e => d.today.done[e.id] && !isExtra(e, l === MT ? 'm' : 'a', d)).length);
  // Erledigt-Zähler nur über Plan (ohne Extras)
  const nDone = lineup('m', tk()).filter(e => d.today.done[e.id]).length;
  const rDone = RT.filter(e => d.today.done[e.id]).length;
  const eDone = lineup('a', tk()).filter(e => d.today.done[e.id]).length;
  const fDone = FT.filter(e => d.today.done[e.id]).length;
  const hDone = lineup('h', tk()).filter(e => d.today.done[e.id]).length;
  const nCore = b => BLK[b].pool.filter(e => e.core && !MOBCORE.pauseInfo(e.id, tk())).length;
  const st = (n, tot) => n >= tot ? '<span class="mob-st ok">✓ heute erledigt</span>' : n ? `<span class="mob-st part">${n}/${tot} · läuft</span>` : '<span class="mob-st">noch offen</span>';
  const hist = [...d.history].reverse().slice(0, 8).map(h => `<div class="mob-h"><span>${WD[fromKey(h.date).getDay()]} ${dateDE(h.date)}</span><span class="muted small">${h.note ? '📝 ' : ''}${h.done.filter(x => EX.some(e => e.id === x) || MRET.some(e => e.id === x)).length}/${planOf(h, 'm').length} Übungen${h.done.some(x => ROT.some(e => e.id === x)) ? ' · 🔄 Abwechslung' : ''}${h.done.some(x => [...EVE, ...RET].some(e => e.id === x)) ? ' · ☾ Abend' : ''}${h.done.some(x => FAS.some(e => e.id === x)) ? ' · ◎ Faszien' : ''}${h.done.some(x => HIP.some(e => e.id === x)) ? ' · ◇ HipFit' : ''}</span><button class="btn btn-ghost btn-sm" style="width:auto;padding:4px 10px;margin-left:6px" data-act="mobExp" data-date="${h.date}">Exportieren</button></div>`).join('') || '<div class="muted small">Noch keine Einheit – heute ist ein guter Tag zum Starten 🙂</div>';
  return {
    html: topbar('Hüft-Beweglichkeit', 'Dehnung & Gesundheit', null) + `
    <div class="mob-stats">
      <div class="card"><div class="mob-big gold">${s.streak}</div><div class="muted small">${s.streak === 1 ? 'Tag' : 'Tage'} in Folge 🔥</div></div>
      <div class="card"><div class="mob-big">${s.total}</div><div class="muted small">Einheiten gesamt</div></div>
      <div class="card"><div class="mob-big">${s.week}</div><div class="muted small">diese Woche</div></div>
    </div>
    <div class="card mob-note">⚠️ <b>Morgens kein langes Vorbeugen</b> (Bandscheibe), <b>kein tiefes Hohlkreuz</b>. <b>Bis zum MRT nicht:</b> Vorbeugen mit überkreuzten Beinen und ähnliches tiefes Vorbeugen im Stand. Nichts erzwingen – <b>schmerzfrei bleiben</b>. Bei <b>Kribbeln, Ausstrahlung ins Bein oder einschießendem Schmerz</b> die Übung weglassen.</div>
    <div class="mob-prog"><div style="width:${mPlan ? (nDone / mPlan * 100) : 0}%"></div></div>
    <div class="card mob-today"><b>Heute</b> · ${s.todayDone ? '<span class="mob-st ok">✓ Einheit abgeschlossen</span>' : '<span class="mob-st">Einheit noch offen</span>'}
      <div class="mob-tl"><span>☀️ Morgen-Routine</span>${st(nDone, mPlan)}</div><div class="mob-tl"><span>🔄 Abwechslung</span>${st(rDone, RT.length)}</div><div class="mob-tl"><span>☾ Abend</span>${st(eDone, aPlan)}</div>${hipOn ? `<div class="mob-tl"><span>◇ Hüft-Reha (HipFit)</span>${hDone >= hPlan && hPlan ? '<span class="mob-st ok">✓ heute erledigt</span>' : hDone ? `<span class="mob-st part">${hDone}/${hPlan} · läuft</span>` : `<span class="mob-st">${hWeek}/${MOBCORE.HIP_TARGET} diese Woche</span>`}</div>` : ''}<div class="mob-tl"><span>◎ Faszien</span>${st(fDone, FT.length)}</div></div>
    <div class="sec-h muted small" style="margin:10px 2px 2px">☀️ MORGEN-ROUTINE · ${nDone}/${mPlan} erledigt</div><div class="mob-when">Morgens nach dem Aufstehen · ${nCore('m')} täglich + ${mPlan - nCore('m')} im Wechsel</div>
    ${MT.map((e, i) => row(e, d, i + 1, 'm')).join('')}${pauseNote('m')}
    <button class="btn btn-outline-gold btn-sm" data-act="mobExtra" data-b="m" style="margin:4px 0 8px">＋ Zusatzübung</button>
    <div class="sec-h muted small" style="margin:18px 2px 2px">🔄 ABWECHSLUNG · ${rDone}/${RT.length} erledigt</div><div class="mob-when">Heute (${WD[new Date().getDay()]}) · täglich 3 andere – in ${Math.ceil(ROT.length / 3)} Tagen alle ${ROT.length}</div>
    ${RT.map((e, i) => row(e, d, i + 1, 'w')).join('')}${pauseNote('w')}
    <div class="sec-h muted small" style="margin:18px 2px 2px">☾ ABEND (OPTIONAL) · ${eDone}/${aPlan} erledigt</div><div class="mob-when">Abends vor dem Schlafen · ${nCore('a')} täglich + ${aPlan - nCore('a')} im Wechsel</div>
    ${ET.map((e, i) => row(e, d, i + 1, 'a')).join('')}${pauseNote('a')}
    <button class="btn btn-outline-gold btn-sm" data-act="mobExtra" data-b="a" style="margin:4px 0 8px">＋ Zusatzübung</button>
    ${hipAdviceHtml()}
    ${hipOn ? `<div class="sec-h muted small" style="margin:18px 2px 2px">◇ HÜFT-REHA (HIPFIT) · ${hDone}/${hPlan} erledigt · ${hWeek}/${MOBCORE.HIP_TARGET} diese Woche</div><div class="mob-when">Vom Gelenkquartier empfohlen · Ziel ${MOBCORE.HIP_TARGET}× pro Woche, nicht jeden Tag nötig · Start 18.11.2026 · zu jeder Übung gibt es das HipFit-Video</div>
    ${HT.map((e, i) => row(e, d, i + 1, 'h')).join('')}
    <div class="card mob-locked"><div class="muted small"><b>Phase 2</b> – nach MRT und wenn der Rücken ruhig ist, noch nicht aktiv: ${HIP2.map(e => esc(e.n)).join(', ')}.</div></div>` : ''}
    <div class="sec-h muted small" style="margin:18px 2px 2px">◎ FASZIEN (OPTIONAL)</div><div class="mob-when">Blackroll · Duoball/Bälle · Shakti-Matte – ideal abends · ${nCore('f')} täglich + ${FT.length - nCore('f')} im Wechsel</div>
    ${FT.map((e, i) => row(e, d, i + 1, 'f')).join('')}${pauseNote('f')}
    <div style="height:6px"></div>
    ${s.todayDone ? `<button class="btn btn-outline-gold" data-act="mobFinish">✓ Heute erledigt – Eintrag aktualisieren</button>` : `<button class="btn btn-red" data-act="mobFinish">Einheit abschließen ✓</button>`}
    ${s.todayDone ? `<div style="height:8px"></div><button class="btn btn-gold" data-act="mobExp" data-date="${tk()}">📋 Exportieren</button>` : ''}
    <div class="sec-h muted small" style="margin:18px 2px 8px">VERLAUF</div><div class="card">${hist}</div>`
  };
}

/* v1.9.2: Hüft-Reha ohne Sekunden-Timer – einfache Wdh.-Felder (pro Seite bzw. eine Zahl), Haltezeit nur als Cue */
function hipUnit(ex) { return ex.id === 'sidewalk' ? 'Bahnen' : 'Wdh'; }
function hipHoldCue(ex) {
  if (ex.hold == null) return '';
  const base = ex.hold === 'kurz' ? 'Jede Wdh. kurz halten, selbst zählen' : `Jede Wdh. ${ex.hold} s halten, selbst zählen`;
  return ex.pause ? base + ` (${ex.pause} s Pause)` : base;
}
function hipRepHint(ex) {
  const parts = [];
  if (ex.ps) parts.push('Erst eine Seite fertig, dann die andere.');
  if (ex.sets > 1) parts.push(ex.sets + ' Sätze laut Plan – hier die Wdh. pro Seite eintragen.');
  const h = hipHoldCue(ex); if (h) parts.push(h);
  return parts.join(' ');
}
function parseRep(v) { const n = parseInt(String(v).trim(), 10); return Number.isFinite(n) && n >= 0 ? n : null; }
function saveHipRep(id, side, raw) {
  const d = day(); if (!d.today.reps) d.today.reps = {};
  const cur = Object.assign({}, d.today.reps[id] || {});
  const n = String(raw).trim() === '' ? null : parseRep(raw);
  if (side === 'n') { if (n == null) delete cur.n; else cur.n = n; }
  else if (side === 'L') { if (n == null) delete cur.L; else cur.L = n; }
  else if (side === 'R') { if (n == null) delete cur.R; else cur.R = n; }
  if (cur.L == null && cur.R == null && cur.n == null) delete d.today.reps[id];
  else d.today.reps[id] = cur;
  sv(d); return d.today.reps[id] || {};
}
function fmtHipReps(ex, r) {
  if (!r) return '';
  const u = hipUnit(ex);
  if (r.n != null && r.n !== '') return r.n + ' ' + u;
  const parts = [];
  if (r.L != null && r.L !== '') parts.push('Links: ' + r.L + ' ' + u);
  if (r.R != null && r.R !== '') parts.push('Rechts: ' + r.R + ' ' + u);
  return parts.join(' · ');
}
function fmtTimeLog(e, lg) {
  const by = {}; lg.forEach(x => (by[x.side || ''] = by[x.side || ''] || []).push(x.secs));
  return Object.entries(by).map(([sd, a]) => { const pl = sd === 'Links' ? (e.setsL || e.sets) : sd === 'Rechts' ? (e.setsR || e.sets) : e.sets; return `${sd ? sd + ': ' : ''}${a.length}× ${a.map(fmtS).join('/')}${a.length < pl ? ` (${a.length}/${pl} Sätze)` : ''}`; }).join(' · ');
}
function fmtSetCount(e, n2) {
  const segs = e.sets * (e.ps ? 2 : 1);
  return (e.ps ? `${Math.ceil(n2 / 2)}×${e.reps} pro Seite` : `${n2}×${e.reps}`) + (n2 < segs ? ` (${n2}/${segs})` : '');
}
function exLineDet(e, h) {
  const r = (h.reps || {})[e.id];
  const hip = fmtHipReps(e, r);
  if (hip) return hip;
  const lg = (h.log || {})[e.id] || [];
  if (lg.length && lg.some(x => x.secs != null)) return fmtTimeLog(e, lg);
  const n2 = (h.sets || {})[e.id] || 0;
  if (n2) return fmtSetCount(e, n2);
  return 'abgehakt (' + e.dose + ')';
}
function hipStepper(id, side, label, value, unit, ph) {
  const v = value != null && value !== '' ? value : '';
  return `<div class="stepper"><label>${esc(label)} <span class="muted">(${esc(unit)})</span></label><div class="stp">` +
    `<button type="button" data-act="mobHipStep" data-id="${id}" data-side="${side}" data-d="-1" aria-label="Weniger">−</button>` +
    `<input data-hip-rep="${side}" data-id="${id}" inputmode="numeric" pattern="[0-9]*" value="${v}" placeholder="${esc(String(ph))}" aria-label="${esc(label)}">` +
    `<button type="button" data-act="mobHipStep" data-id="${id}" data-side="${side}" data-d="1" aria-label="Mehr">+</button></div></div>`;
}
function hipRepTool(ex, saved = {}) {
  const unit = hipUnit(ex);
  const hint = hipRepHint(ex);
  const fields = ex.ps
    ? hipStepper(ex.id, 'L', 'Links', saved.L, unit, ex.reps) + hipStepper(ex.id, 'R', 'Rechts', saved.R, unit, ex.reps)
    : hipStepper(ex.id, 'n', unit === 'Bahnen' ? 'Bahnen' : 'Wiederholungen', saved.n, unit, ex.reps);
  return `<div class="card mob-hip-reps"><div class="muted small" style="margin-bottom:8px">WIEDERHOLUNGEN EINTRAGEN</div>` +
    `<div class="steppers${ex.ps ? '' : ' one'}">${fields}</div>` +
    `<div class="muted small" style="margin-top:8px">${esc(hint || ex.dose)}</div></div>`;
}

function viewDetail(id) {
  const ex = byId(id); if (!ex) { location.hash = '#/mob'; return { html: '' }; }
  const d = day(); const ok = !!d.today.done[id]; const bk = blockOf(ex); const tl = bk ? ((bk === 'm' || bk === 'a') ? blockList(bk, d) : todayList(bk, d)) : []; const list = tl.includes(ex) ? tl : [ex]; const idx = list.indexOf(ex); const next = list[idx + 1];
  let tool;
  if (ex.hip) {
    tool = hipRepTool(ex, (d.today.reps || {})[id] || {});
  } else if (ex.t === 'time') {
    tInit(ex); const C = 2 * Math.PI * 88;
    tool = `<div class="card mob-timer" id="mt"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="mt-bg"/><circle cx="100" cy="100" r="88" class="mt-fg" stroke-dasharray="${C}" transform="rotate(-90 100 100)"/></svg>
      <div class="mt-in"><div class="mt-num">0:00</div><div class="mt-sub"></div></div>
      <div class="mt-segs">${T.segs.filter(s => !s.pause).map(s => `<span class="mt-seg">${s.side ? s.side[0] : 'S'}${s.set}</span>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn btn-red btn-sm" data-act="mobT">▶ Start</button><button class="btn btn-ghost btn-sm" data-act="mobTR" style="max-width:120px">↺ Reset</button></div>
      <div class="muted small" style="margin-top:8px;text-align:center">${ex.ps ? 'Seitenwechsel automatisch mit Signalton/Vibration · ' + (ex.pause != null ? ex.pause : 12) + ' s Pause zum Umsetzen' : (ex.sets > 1 ? (ex.pause != null ? ex.pause : 12) + ' s Pause zwischen den Sätzen · ' : '') + 'Signalton/Vibration am Ende'} · 3-2-1-Countdown · Display bleibt an</div></div>`;
  } else {
    const n = d.today.sets[id] || 0; const tot = ex.sets * (ex.ps ? 2 : 1);
    const segs = []; for (let s = 1; s <= ex.sets; s++) (ex.ps ? ['Links', 'Rechts'] : ['']).forEach(side => segs.push({ s, side }));
    tool = `<div class="card"><div class="muted small" style="margin-bottom:8px">SÄTZE ABHAKEN · ${n}/${tot}</div><div class="mob-sets">${segs.map((g, i) => `<button class="mob-set ${i < n ? 'on' : ''}" data-act="mobSet" data-id="${id}" data-i="${i}"><b>${ex.reps}</b><small>${g.side ? g.side + ' · ' : ''}Satz ${g.s}</small></button>`).join('')}</div>
      <div class="muted small" style="margin-top:8px">${esc(ex.dose)}</div></div>`;
  }
  const li = a => `<ul class="mob-ul">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  return {
    html: `<div id="mob-detail">` + topbar(ex.n, (ex.hip ? 'Hüft-Reha · HipFit · 3×/Woche' : ex.eve ? 'Abend · vor dem Schlafen' : ex.fas ? 'Faszien · optional' : ex.rot ? 'Abwechslung' : 'Morgens') + (list.length > 1 ? ` · Übung ${idx + 1} von ${list.length}` : '') + (MOBCORE.pauseInfo(ex.id, tk()) ? ' · pausiert bis 17.11.' : ex.hip ? ' · optional' : bk && isRotToday(ex, bk) ? ' · heute im Wechsel' : bk && bk !== 'w' ? ' · täglich' : ''), '#/mob') + `
    <div class="card mob-ill"><img class="mob-anat" src="./assets/mob/${im(ex)}.webp" alt="${esc(ex.n)} – Zielmuskulatur rot markiert"><div class="muted small mob-anat-cap"><span style="color:#ff6b6b">●</span> rot = Zielmuskulatur</div>${ex.pics ? `<div class="mob-pics">${ex.pics.map(p => `<figure class="mob-pic"><img src="./assets/mob/${p.f}.webp" alt="${esc(ex.n)} – ${esc(p.c)}" loading="lazy"><figcaption class="muted small">${esc(p.c)}</figcaption></figure>`).join('')}</div>` : `<img class="mob-seq" src="./assets/mob/seq_${im(ex)}.webp" alt="Bewegungsablauf ${esc(ex.n)}" loading="lazy">`}<div class="muted small" style="margin-top:6px">${esc(ex.sub)} · <span class="gold">→ Pfeil = Bewegungsablauf</span></div></div>
    ${MOBCORE.pauseInfo(ex.id, tk()) ? `<div class="card mob-pause small">⏸ <b>${esc(MOBCORE.pauseInfo(ex.id, tk()).label)}</b> – wird bis dahin nicht eingeplant und zählt nicht.</div>` : ''}
    <div class="mob-dose">${esc(ex.dose)}</div>
    ${ex.yt ? `<a class="btn btn-outline-gold btn-sm mob-yt" href="${esc(ex.yt)}" target="_blank" rel="noopener">▶ Video ansehen (HipFit)</a>` : ''}
    ${tool}
    <div class="card"><h3 class="mob-h3">So geht's</h3><ol class="mob-ol">${ex.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <div class="card mob-cue"><h3 class="mob-h3">✅ Darauf achten</h3>${li(ex.cues)}</div>
    <div class="card mob-err"><h3 class="mob-h3">❌ Häufige Fehler</h3>${li(ex.err)}</div>
    <div class="card mob-note small">Nichts erzwingen, schmerzfrei bleiben.${ex.hip ? ' ' + STOP : (ex.eve || ex.fas || ex.rot ? '' : ' Morgens kein langes Vorbeugen.')} Bei Kribbeln, Ausstrahlung ins Bein oder einschießendem Schmerz: Übung weglassen.</div>
    <button class="btn ${ok ? 'btn-outline-gold' : 'btn-red'}" data-act="mobChk" data-id="${id}">${ok ? '✓ Erledigt (tippen zum Zurücksetzen)' : 'Als erledigt abhaken'}</button>
    <div style="height:10px"></div>
    ${next ? `<button class="btn btn-ghost btn-sm" data-act="go" data-to="#/mob/${next.id}">Nächste: ${esc(next.n)} ›</button>` : `<button class="btn btn-ghost btn-sm" data-act="go" data-to="#/mob">Zur Übersicht ›</button>`}</div>`,
    mount: () => { if (ex.t === 'time') tPaint(); }
  };
}
window.viewMob = a => a ? viewDetail(a) : viewList();

/* ---------- Aktionen ---------- */
Object.assign(A, {
  mobExtra: dd => {
    const b = dd.b; const d = day(); const title = b === 'm' ? 'Morgen – Zusatzübung' : 'Abend – Zusatzübung';
    const inList = new Set(blockList(b, d).map(e => e.id));
    const pool = extraPool(b).filter(e => !lineup(b, tk()).some(x => x.id === e.id)); // alles außer dem heutigen Plan
    const extras = new Set((d.today.extra[b] || []));
    const rows = pool.map(e => {
      const on = extras.has(e.id) || inList.has(e.id) && extras.has(e.id);
      const active = (d.today.extra[b] || []).includes(e.id);
      return `<div class="pick-row ${active ? 'in' : ''}" style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.06)">
        <img src="./assets/mob/${im(e)}.webp" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover;background:#fdfbf7" loading="lazy">
        <div style="flex:1;min-width:0"><b style="font-size:14px">${esc(e.n)}</b><div class="muted small">${esc(e.dose)}</div></div>
        <button class="pick-btn" data-act="mobExtraToggle" data-b="${b}" data-id="${e.id}" aria-label="${active ? 'Entfernen' : 'Hinzufügen'}">${active ? '✓' : '＋'}</button></div>`;
    }).join('') || '<div class="muted small">Keine weiteren Übungen im Pool.</div>';
    openSheet(`<h3>${title}</h3><div class="muted small" style="margin-bottom:10px">＋ fügt eine optionale Zusatzübung hinzu. Sie erscheint in der Liste, zählt aber <b>nicht</b> zum ${b === 'm' ? 'Morgen' : 'Abend'}-Zähler. Abgehakt wird sie trotzdem geloggt.</div>
      <div style="max-height:55vh;overflow:auto">${rows}</div>
      <div style="height:12px"></div><button class="btn btn-red" data-act="mobExtraDone">Fertig</button>`);
  },
  mobExtraToggle: dd => {
    const d = day(); const b = dd.b; const ids = d.today.extra[b] || (d.today.extra[b] = []);
    const i = ids.indexOf(dd.id);
    if (i >= 0) { ids.splice(i, 1); toast('Zusatz entfernt', 1200); }
    else { ids.push(dd.id); toast('„' + byId(dd.id).n + '“ als Zusatz ✓', 1400); }
    sv(d); A.mobExtra({ b });
  },
  mobExtraDone: () => { closeSheet(); render(true); },
  mobChk: (dd, el) => { const d = day(); if (d.today.done[dd.id] && !confirm('Heute schon erledigt ✓ – wirklich wieder offen machen?')) return; markDone(dd.id, !d.today.done[dd.id]); render(true); },
  mobSet: dd => { const ex = byId(dd.id); const d = day(); if (d.today.done[dd.id]) { toast('Heute schon erledigt ✓', 1400); return; } const i = +dd.i; const cur = d.today.sets[dd.id] || 0; d.today.sets[dd.id] = i < cur ? i : i + 1; const tot = ex.sets * (ex.ps ? 2 : 1);
    if (d.today.sets[dd.id] >= tot) { d.today.done[dd.id] = true; beep(2, 990); toast('Übung geschafft ✓', 1400); } else try { navigator.vibrate && navigator.vibrate(40); } catch (_) { }
    sv(d); render(true); },
  mobHipStep: dd => {
    const d = day(); const cur = ((d.today.reps || {})[dd.id] || {});
    const side = dd.side; const delta = +dd.d;
    const prev = side === 'n' ? cur.n : side === 'L' ? cur.L : cur.R;
    const next = Math.max(0, (prev == null ? 0 : prev) + delta);
    saveHipRep(dd.id, side, next);
    const inp = document.querySelector(`[data-hip-rep="${side}"][data-id="${dd.id}"]`);
    if (inp) inp.value = String(next);
    else render(true);
  },
  mobT: () => { if (!T) return; if (!T.run && day().today.done[T.id]) { toast('Heute schon erledigt ✓', 1400); return; } beep.c || beep(0); if (T.done) { const ex = byId(T.id); T = null; tInit(ex); } T.run = !T.run; T.last = Date.now(); if (T.run && !('wakeLock' in navigator)) wvStart(); wakeSync(); tPaint(); },
  mobTR: () => { if (!T) return; const ex = byId(T.id); T = null; tInit(ex); wakeSync(); tPaint(); },
  mobFinish: () => { const d = day(); const done = Object.keys(d.today.done);
    if (!done.length && !confirm('Noch keine Übung abgehakt. Trotzdem als Einheit speichern?')) return;
    const old = d.history.find(h => h.date === tk()) || {}; d.history = d.history.filter(h => h.date !== tk());
    const lineupIds = {}; Object.keys(BLK).forEach(b => { lineupIds[b] = lineup(b, tk()).map(e => e.id); });
    d.history.push({ date: tk(), ts: Date.now(), lineup: lineupIds, extra: JSON.parse(JSON.stringify(d.today.extra || { m: [], a: [] })), done, sets: Object.assign({}, d.today.sets), log: JSON.parse(JSON.stringify(d.today.log || {})), reps: JSON.parse(JSON.stringify(d.today.reps || {})), note: old.note || '' }); d.history.sort((a, b) => a.date < b.date ? -1 : 1); sv(d);
    beep(2, 990); const s = stats(); toast(`Stark, Markus! ${s.streak} ${s.streak === 1 ? 'Tag' : 'Tage'} in Folge 🔥`, 2200); render(true); setTimeout(() => A.mobExp({ date: tk() }), 400); },
  mobExp: dd => { const d = ld(); const h = d.history.find(x => x.date === dd.date); if (!h) return toast('Eintrag nicht gefunden');
    const sent = getSent(h.date); const pv = sent.n ? MOBCORE.diffReport(mobRep(h), sent) : null;
    const info = !sent.n ? '' : `<div class="card small" id="mob-sendinfo" style="margin:10px 0 0;border:1px solid rgba(212,175,55,.35);background:rgba(212,175,55,.07)">📨 Heute schon ${sent.n}× gemeldet${sent.blocks.length ? ' (' + sent.blocks.map(esc).join(', ') + ')' : ''}.<br>${pv.empty ? '<b>Nichts Neues seit der letzten Meldung</b> – außer du änderst die Notiz.' : 'Gesendet wird nur Neues: <b>' + (pv.newBlocks.map(esc).join(', ') || 'Notiz') + '</b>'}</div>`;
    openSheet(`<h3>Einheit exportieren</h3><div class="muted small">${WD[fromKey(h.date).getDay()]} ${dateDE(h.date)} · ${h.done.length} ${h.done.length === 1 ? 'Übung' : 'Übungen'}</div>${info}
      <label class="muted small" style="display:block;margin:12px 0 6px">Wie war's? Seitenunterschiede, Gefühl, Steifigkeit 0-10</label>
      <textarea class="field" id="mob-note" style="min-height:120px" placeholder="z. B. links deutlich steifer, Steifigkeit 6/10">${esc(h.note || '')}</textarea>
      <div style="height:10px"></div><button class="btn btn-gold" data-act="mobExpGo" data-date="${h.date}">📤 ${sent.n ? 'Neues senden' : 'Exportieren'}</button>
      ${sent.n ? `<div style="height:6px"></div><button class="btn btn-outline-gold btn-sm" data-act="mobExpGo" data-date="${h.date}" data-full="1">Kompletten Tag senden</button>` : ''}
      <div style="height:6px"></div><button class="btn btn-ghost btn-sm" data-act="mobNoteSave" data-date="${h.date}">Nur Notiz speichern</button>`); },
  mobNoteSave: dd => { saveNote(dd.date); toast('Notiz gespeichert ✓'); closeSheet(); render(true); },
  mobExpGo: async dd => { const h = saveNote(dd.date); if (!h) return toast('Eintrag nicht gefunden'); const rep = mobRep(h); const full = dd.full === '1';
    const res = full ? { text: MOBCORE.fullText(rep), empty: false } : MOBCORE.diffReport(rep, getSent(h.date));
    if (res.empty) return openSheet(`<h3>Nichts Neues</h3><div class="muted small" style="margin-bottom:12px">Nichts Neues seit der letzten Meldung – alle abgehakten Übungen und die Notiz hast du heute schon geschickt.</div>
      <button class="btn btn-gold" data-act="mobExpGo" data-date="${h.date}" data-full="1">Trotzdem komplett senden</button>
      <div style="height:6px"></div><button class="btn btn-ghost btn-sm" data-act="mobExp" data-date="${h.date}">‹ Zurück</button>`);
    const txt = res.text; const done = () => { putSent(h.date, MOBCORE.markSent(rep, getSent(h.date))); closeSheet(); render(true); };
    try { if (navigator.share) { await navigator.share({ title: 'Hüft-Beweglichkeit', text: txt }); done(); return; } } catch (e) { if (e.name === 'AbortError') return; }
    const ok = await copyText(txt); if (ok) { toast('Kopiert ✓ – jetzt einfügen', 2600); done(); }
    else openSheet(`<h3>Export</h3><div class="muted small">Text markieren und kopieren:</div><textarea class="field" style="min-height:300px">${esc(txt)}</textarea>
      <div style="height:10px"></div><button class="btn btn-outline-gold btn-sm" data-act="mobMarkSent" data-date="${h.date}">✓ Hab's geschickt – als gemeldet merken</button>`); },
  mobMarkSent: dd => { const d = ld(); const h = d.history.find(x => x.date === dd.date); if (h) putSent(h.date, MOBCORE.markSent(mobRep(h), getSent(h.date))); toast('Als gemeldet gemerkt ✓', 1600); closeSheet(); render(true); }
});
function saveNote(date) { const d = ld(); const h = d.history.find(x => x.date === date); const ta = document.getElementById('mob-note'); if (h && ta) { h.note = ta.value.trim(); sv(d); } return h; }
/* Bericht als Struktur (Text baut MOBCORE: komplett oder nur Neues) */
function mobRep(h) {
  const L = h.log || {}, S2 = h.sets || {};
  // Blöcke: Plan des Tages (h.lineup bzw. alter Plan) + zusätzlich Abgehaktes; Zähler = erledigt / geplant
  const blk = [['☀️ Morgen-Routine', 'm', [...EX, ...MRET]], ['🔄 Abwechslung', 'w', ROT], ['☾ Abend', 'a', [...EVE, ...RET]], ['◇ Hüft-Reha (HipFit)', 'h', HIP], ['◎ Faszien', 'f', FAS]].map(([n, b, pool]) => {
    const plan = planOf(h, b); const extra = pool.filter(e => !plan.includes(e) && h.done.includes(e.id));
    return { n, l: [...plan, ...extra], tot: plan.length + extra.filter(e => cntPool(b).includes(e)).length, dn: [...plan, ...extra].filter(e => h.done.includes(e.id) && cntPool(b).includes(e)).length }; });
  const blocks = [];
  for (const { n, l, tot, dn } of blk) { const items = []; blocks.push({ n, tot, dn, anyDone: l.some(e => h.done.includes(e.id)), items });
    const ex = l.filter(e => h.done.includes(e.id) || (L[e.id] || []).length || S2[e.id] || ((h.reps || {})[e.id])); if (!ex.length) continue;
    for (const e of ex) {
      const det = exLineDet(e, h);
      items.push({ id: e.id, line: `${h.done.includes(e.id) ? '✓' : '◐'} ${e.n}: ${det}` }); } }
  return { head: `Hüft-Beweglichkeit – ${WD[fromKey(h.date).getDay()]} ${dateDE(h.date)}`, blocks, note: h.note || '' }; }
function cntPool(b) { return b === 'm' ? [...EX, ...MRET] : BLK[b].pool; }
function mobText(h) { return MOBCORE.fullText(mobRep(h)); }
/* Gemeldet-Stand pro Tag – eigener Schlüssel, Übungsdaten 'vgl-mob' bleiben unberührt */
const SKEY = 'vgl-mob-sent';
function getSent(date) { try { const a = JSON.parse(localStorage.getItem(SKEY) || '{}'); const x = a[date] || {}; return { n: x.n || 0, ex: x.ex || {}, blocks: x.blocks || [], note: x.note || '' }; } catch (_) { return { n: 0, ex: {}, blocks: [], note: '' }; } }
function putSent(date, s) { try { const a = JSON.parse(localStorage.getItem(SKEY) || '{}'); a[date] = s; localStorage.setItem(SKEY, JSON.stringify(MOBCORE.prune(a))); } catch (_) { } }

function fmtS(x) { return x >= 60 && x % 60 === 0 ? (x / 60) + ' min' : x >= 60 ? Math.floor(x / 60) + ':' + pad(x % 60) + ' min' : x + ' s'; }
window.mobText = mobText; window.mobRep = mobRep;
document.addEventListener('input', e => {
  const el = e.target && e.target.closest && e.target.closest('[data-hip-rep]');
  if (!el) return;
  saveHipRep(el.dataset.id, el.dataset.hipRep, el.value);
});

window.MOBDATA = { EX, ROT, EVE, FAS, MRET, HIP, HIP2, ALL, BLK, lineup, planOf, byId, hipWeekDone, hipDoneKeys, HIP_ALLTAG, HIP_MRT_Q, HIP_AMPEL, STOP, hipRepTool, hipHoldCue, hipUnit, fmtHipReps, exLineDet, saveHipRep }; // für Tests
})();
