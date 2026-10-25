/* Voccola Gym Log – Hüft-Beweglichkeit (v1.6.2). Eigene Daten in localStorage 'vgl-mob', berührt Trainingsdaten nicht. */
'use strict';
(function () {
const KEY = 'vgl-mob';
const ld = () => { try { return Object.assign({ today: null, history: [] }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) { return { today: null, history: [] }; } };
const sv = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (_) { } };
const tk = () => dkey();
function day() { const d = ld(); if (!d.today || d.today.date !== tk()) { d.today = { date: tk(), done: {}, sets: {} }; sv(d); } return d; }

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
  ,froll_g: () => { const r = '<circle cx="92" cy="82" r="9" fill="none" stroke="#D4AF37" stroke-width="3" opacity=".8"/>';
    const b = { x: r, h: [60, 34], n: [70, 46], p: [92, 70], k1: [124, 56], f1: [146, 90], k2: [120, 58], f2: [142, 90], e1: [58, 70], w1: [48, 90] };
    return svg([panel('AUF ROLLE', b), panel('ROLLEN', Object.assign({}, b, { x: r.replace('92', '86'), p: [86, 70], n: [64, 46], h: [54, 34], e1: [52, 70], w1: [42, 90] }), arrow('M70 100 H112', 0) + arrow('M112 100 H70', 0))]); }
  ,froll_t: () => { const b = { x: '<circle cx="122" cy="85" r="8" fill="none" stroke="#D4AF37" stroke-width="3" opacity=".8"/>', h: [30, 58], n: [44, 64], p: [100, 72], e1: [44, 90], w1: [68, 90], k1: [140, 76], f1: [172, 82] };
    return svg([panel('OBERSCHENKEL', b), panel('LANGSAM ROLLEN', Object.assign({}, b, { x: b.x.replace('122', '146'), n: [56, 64], h: [42, 58], e1: [56, 90], w1: [80, 90], p: [112, 72] }), arrow('M100 56 H150', 0) + arrow('M150 56 H100', 0))]); }
  ,ballpir: () => { const b = { x: '<circle cx="94" cy="88" r="5" fill="#D4AF37" opacity=".85"/>', h: [60, 34], n: [70, 46], p: [94, 76], k2: [124, 58], f2: [146, 90], k1: [120, 56], f1: [104, 66], e1: [58, 70], w1: [48, 90] };
    return svg([panel('BALL UNTERM GESÄSS', b), panel('KREISEN', Object.assign({}, b), '<ellipse cx="94" cy="88" rx="16" ry="6" fill="none" stroke="#D4AF37" stroke-width="2.5" stroke-dasharray="4 3"/>')]); }
  ,duoball: () => { const x = '<circle cx="84" cy="86" r="5.5" fill="#D4AF37" opacity=".85"/><circle cx="95" cy="86" r="5.5" fill="#D4AF37" opacity=".85"/>';
    const b = { x, h: [22, 82], n: [38, 84], c: [84, 76], p: [110, 84], k1: [132, 60], f1: [152, 90], k2: [128, 60], f2: [148, 90], e1: [56, 88], w1: [74, 89] };
    return svg([panel('DUOBALL LWS', b), panel('SANFT ATMEN', b, '<text x="90" y="64" text-anchor="middle" font-size="10" fill="#ff6b6b">NICHT auf Wirbel</text>' + arrow('M90 68 V76', 0))]); }
  ,shakti: () => { const x = '<rect x="20" y="88" width="150" height="5" rx="2" fill="none" stroke="#D4AF37" stroke-dasharray="2 2"/>';
    return svg([panel('SHAKTI-MATTE', { x, h: [30, 80], n: [46, 84], p: [104, 84], k1: [136, 84], f1: [168, 84], e1: [72, 86], w1: [96, 86] }), panel('10 MIN ATMEN', { x, h: [30, 80], n: [46, 84], p: [104, 84], k1: [126, 62], f1: [146, 86], k2: [124, 62], f2: [144, 86], e1: [72, 86], w1: [96, 86] }, '<text x="70" y="50" font-size="14" fill="#D4AF37">z z z</text>')]); }
};

/* ---------- Übungen ---------- */
const EX = [
  { id: 'catcow', n: 'Katze-Kuh', sub: 'Vierfüßlerstand', dose: '10 langsame Wdh.', t: 'reps', sets: 1, reps: 10,
    steps: ['Vierfüßlerstand: Hände unter den Schultern, Knie unter den Hüften.', 'Ausatmen: Rücken wie eine Katze rund nach oben schieben, Kinn Richtung Brust, Bauchnabel einziehen.', 'Einatmen: Langsam in die Kuh – Becken kippt nach vorn, Brustbein nach vorn, Blick leicht nach vorn.', 'Wirbel für Wirbel bewegen, ca. 3–4 s pro Richtung.'],
    cues: ['Bewegung startet aus dem Becken', 'Ruhig mit dem Atem koppeln', 'Arme bleiben gestreckt, Schultern weg von den Ohren'],
    err: ['Zu schnell / ruckartig', 'Nur den Nacken bewegen statt die ganze Wirbelsäule', 'In der Kuh ins Hohlkreuz „fallen“ – kontrolliert bleiben'] },
  { id: 'hipflex', n: 'Hüftbeuger-Dehnung im Halbknien', sub: 'Gesäß anspannen, Becken leicht nach hinten kippen', dose: '2×45 s pro Seite', t: 'time', sets: 2, secs: 45, ps: true,
    steps: ['Halbkniestand: hinteres Knie auf einer weichen Unterlage, vorderer Fuß flach, beide Knie ca. 90°.', 'Oberkörper aufrecht, Hände an die Hüfte.', 'Gesäß der hinteren Seite fest anspannen und das Becken leicht nach hinten kippen (Schambein Richtung Bauchnabel).', 'Jetzt minimal die Hüfte nach vorn schieben, bis vorne in der Leiste ein Ziehen kommt. Halten, ruhig atmen.'],
    cues: ['Dehnung vorne an der Hüfte/Leiste des hinteren Beins', 'Rippen unten, Bauch leicht fest', 'Vorderes Knie über dem Fuß'],
    err: ['Ins Hohlkreuz ausweichen statt Becken zu kippen', 'Zu weit nach vorn schieben – weniger ist mehr', 'Gesäß locker lassen'] },
  { id: 'wgs', n: "World's Greatest Stretch", sub: 'Ausfallschritt + Rotation', dose: '5 pro Seite', t: 'reps', sets: 1, reps: 5, ps: true,
    steps: ['Großer Ausfallschritt nach vorn, hinteres Bein lang, Hände innen neben dem vorderen Fuß aufsetzen.', 'Hüfte sanft Richtung Boden sinken lassen.', 'Den Arm auf der Seite des vorderen Beins zur Decke aufdrehen, Blick folgt der Hand.', 'Langsam zurück, Hand absetzen. 5× wiederholen, dann Seite wechseln.'],
    cues: ['Rotation kommt aus der Brustwirbelsäule', 'Hinteres Bein aktiv lang', 'Bewegung ruhig, 2 s oben halten'],
    err: ['Vorderes Knie fällt nach innen', 'Rund im unteren Rücken hängen', 'Mit Schwung aufdrehen'] },
  { id: 'n9090', n: '90/90 Hüftrotation', sub: 'Sitzend, Knie wechseln', dose: '8 Wechsel', t: 'reps', sets: 1, reps: 8,
    steps: ['Aufrecht sitzen, beide Knie ca. 90° gebeugt, Füße etwas breiter als hüftbreit.', 'Hände hinter dem Körper abstützen.', 'Beide Knie gleichzeitig zur einen Seite zum Boden sinken lassen (vorderes Bein 90°, hinteres Bein 90°).', 'Kontrolliert über die Mitte zur anderen Seite wechseln. Ein Wechsel = eine Wdh.'],
    cues: ['Brust aufrecht, Wirbelsäule lang', 'Nur so tief, wie es schmerzfrei geht', 'Langsam durch die Mitte'],
    err: ['Knie auf den Boden zwingen', 'Rundrücken / zusammensacken', 'Knie verdrehen statt aus der Hüfte rotieren'] },
  { id: 'bridge', n: 'Glute Bridge', sub: 'Gesäßbrücke', dose: '2×12, 2 s oben halten', t: 'reps', sets: 2, reps: 12,
    steps: ['Rückenlage, Knie gebeugt, Füße hüftbreit flach am Boden, Arme neben dem Körper.', 'Bauch leicht anspannen, Becken leicht nach hinten kippen.', 'Über die Fersen drücken und das Becken heben, bis Knie–Hüfte–Schulter eine Linie bilden.', 'Oben 2 s halten, Gesäß fest anspannen, langsam absenken.'],
    cues: ['Druck über die Fersen', 'Arbeit im Gesäß, nicht im unteren Rücken', 'Knie zeigen nach vorn'],
    err: ['Zu hoch drücken → Hohlkreuz', 'Knie fallen nach innen', 'Oben nicht halten / zu schnell'] },
  { id: 'birddog', n: 'Bird Dog', sub: 'Vierfüßlerstand, diagonal', dose: '2×8 pro Seite, 3 s halten', t: 'reps', sets: 2, reps: 8, ps: true,
    steps: ['Vierfüßlerstand, Rücken neutral (gerade wie ein Tisch).', 'Bauch leicht anspannen.', 'Gleichzeitig rechten Arm nach vorn und linkes Bein nach hinten lang strecken – bis auf Rumpfhöhe.', '3 s halten, kontrolliert zurück, dann Seite wechseln.'],
    cues: ['Becken bleibt waagrecht – stell dir ein Glas Wasser auf dem Rücken vor', 'Lang machen statt hoch heben', 'Blick zum Boden, Nacken lang'],
    err: ['Bein zu hoch → Hohlkreuz', 'Becken kippt zur Seite', 'Hektisch, ohne Halten'] },
  { id: 'deadbug', n: 'Dead Bug', sub: 'Rücken flach', dose: '2×8 pro Seite, Rücken flach', t: 'reps', sets: 2, reps: 8, ps: true,
    steps: ['Rückenlage, Arme senkrecht zur Decke, Beine angehoben: Hüfte und Knie 90°.', 'Unteren Rücken sanft in den Boden drücken – er bleibt die ganze Zeit flach.', 'Ausatmen: rechten Arm nach hinten und linkes Bein nach vorn lang strecken, knapp über dem Boden.', 'Zurück in die Mitte, Seite wechseln.'],
    cues: ['Rücken flach am Boden – das ist die eigentliche Übung', 'Langsam ausatmen beim Strecken', 'Nur so weit strecken, wie der Rücken unten bleibt'],
    err: ['Hohlkreuz beim Strecken', 'Luft anhalten', 'Zu schnell, Schwung'] }
];
const EVE = [
  { id: 'kneel', eve: 1, n: 'Kniestand-Hüftbeuger-Dehnung', sub: 'Abend · Arm über Kopf', dose: '2×60 s pro Seite', t: 'time', sets: 2, secs: 60, ps: true,
    steps: ['Halbkniestand wie morgens, hinteres Knie gepolstert.', 'Gesäß anspannen, Becken leicht nach hinten kippen.', 'Arm der hinteren Seite über den Kopf strecken, leicht zur Gegenseite neigen.', 'Hüfte minimal nach vorn, 60 s ruhig atmen, dann Seite wechseln.'],
    cues: ['Dehnung vorn an der Hüfte bis in die Flanke', 'Oberkörper aufrecht'], err: ['Hohlkreuz', 'Zu tief nach vorn schieben'] },
  { id: 'pigeon', eve: 1, n: 'Taube (Pigeon)', sub: 'Abend · Gesäß/Hüfte außen', dose: '2×60 s pro Seite', t: 'time', sets: 2, secs: 60, ps: true,
    steps: ['Aus dem Vierfüßlerstand ein Knie nach vorn zur Hand bringen, Unterschenkel schräg ablegen.', 'Hinteres Bein lang nach hinten ausstrecken.', 'Hüfte gerade ausrichten, aufrecht abstützen – oder, wenn angenehm, auf die Unterarme sinken.', '60 s halten, ruhig atmen, Seite wechseln.'],
    cues: ['Bei Knieschmerz: Ferse näher zur Hüfte oder Kissen unter das Gesäß', 'Dehnung im Gesäß, nicht im Knie'], err: ['Hüfte kippt zur Seite', 'Knie erzwingen / Schmerz im Knie ignorieren'] },
  { id: 'turtle', eve: 1, n: 'Schildkröte (Yoga)', sub: 'Abend · Kurmasana, sanfte Variante', dose: '2×60 s', t: 'time', sets: 2, secs: 60,
    steps: ['Sitzen, Beine weit gegrätscht, Knie gebeugt, Füße am Boden.', 'Oberkörper langsam nach vorn sinken lassen.', 'Arme unter den Knien nach außen schieben, Handflächen am Boden.', 'Locker lassen, 60 s ruhig atmen. Langsam wieder aufrollen.'],
    cues: ['Nur bis kurz vor Kribbeln – dann etwas zurück', 'Nur abends – nichts erzwingen', 'Knie so weit gebeugt wie nötig'], err: ['Mit Kraft nach unten drücken', 'Bei Rücken-/Ausstrahlungsschmerz weitermachen → sofort abbrechen'] }
];

const FAS = [
  { id: 'froll_g', fas: 1, n: 'Blackroll Gesäß', sub: 'Faszien · Gesäßmuskulatur', dose: '60 s pro Seite', t: 'time', sets: 1, secs: 60, ps: true,
    steps: ['Auf die Blackroll setzen, Hände hinten abstützen.', 'Gewicht auf eine Gesäßhälfte verlagern (Knöchel auf das andere Knie legen = intensiver).', 'Langsam vor und zurück rollen, ca. 2–3 cm pro Sekunde.', 'Auf festen Punkten 10–20 s verweilen und ausatmen. Dann Seite wechseln.'],
    cues: ['Druck nur „angenehm-intensiv“ (max. 6–7 von 10)', 'Ruhig atmen, nicht verkrampfen'], err: ['Zu schnell rollen', 'Auf das Steißbein/Kreuzbein rollen'] },
  { id: 'froll_t', fas: 1, n: 'Blackroll Oberschenkel außen/vorne', sub: 'Faszien · Quadrizeps & Außenseite', dose: '60 s pro Seite', t: 'time', sets: 1, secs: 60, ps: true,
    steps: ['Unterarmstütz, Blackroll unter dem vorderen Oberschenkel.', 'Langsam von knapp über dem Knie bis zur Hüfte rollen.', 'Für die Außenseite leicht auf die Seite drehen (nicht direkt auf den Knochen/Tractus pressen).', '60 s, dann anderes Bein.'],
    cues: ['Bauch fest, kein Durchhängen im Rücken', 'Gewicht mit dem anderen Bein/Armen dosieren'], err: ['Über das Knie rollen', 'Hohlkreuz im Unterarmstütz', 'Zähne zusammenbeißen – zu viel Druck'] },
  { id: 'ballpir', fas: 1, n: 'Ball Piriformis', sub: 'Faszien · tiefe Hüftmuskulatur', dose: '60 s pro Seite', t: 'time', sets: 1, secs: 60, ps: true,
    steps: ['Sitzen, kleinen (oder großen) Ball mittig unter eine Gesäßhälfte legen.', 'Bein der Seite überschlagen (Knöchel auf das andere Knie).', 'Kleine Kreise und Vor-zurück-Bewegungen, druckempfindliche Stelle suchen.', 'Dort ruhig atmen und lösen lassen, dann Seite wechseln.'],
    cues: ['Großer Ball = sanfter, kleiner Ball = intensiver', 'Kribbeln/Ausstrahlen ins Bein → Ball verschieben'], err: ['Auf den Ischiasnerv drücken (Kribbeln ignorieren)', 'Zu lange auf einem Punkt (> 30 s)'] },
  { id: 'duoball', fas: 1, n: 'Duoball neben der Lendenwirbelsäule', sub: 'Faszien · Rückenstrecker', dose: '60 s', t: 'time', sets: 1, secs: 60,
    steps: ['Rückenlage, Knie gebeugt, Füße am Boden.', 'Duoball quer unter den unteren Rücken legen – die Wirbelsäule liegt IN der Lücke, die Bälle links und rechts daneben.', 'Becken etwas anheben, Duoball positionieren, dann sanft ablegen.', 'Ruhig in den Bauch atmen, evtl. minimal hoch und runter rollen.'],
    cues: ['NIE direkt auf der Wirbelsäule', 'Sanfter Druck – Bandscheibe schonen', 'Bei Schmerz sofort herausnehmen'], err: ['Ball auf den Dornfortsätzen', 'Ins Hohlkreuz drücken', 'Mit viel Gewicht rollen'] },
  { id: 'shakti', fas: 1, n: 'Shakti-Matte Entspannung', sub: 'Faszien · Entspannung', dose: '10 Min', t: 'time', sets: 1, secs: 600,
    steps: ['Matte auf eine ebene Unterlage legen, langsam darauf hinlegen (Rücken, ggf. dünnes Shirt am Anfang).', 'Beine lang oder angewinkelt, Arme locker neben den Körper.', 'Die ersten 1–2 Minuten sind intensiv – ruhig weiteratmen.', '10 Min liegen bleiben, langsam über die Seite aufstehen.'],
    cues: ['Lange, ruhige Ausatmung', 'Ideal abends vor dem Schlafen'], err: ['Schnell aufspringen (Kreislauf)', 'Sich auf die Matte „fallen lassen“'] }
];
const ALL = [...EX, ...EVE, ...FAS];
const byId = id => ALL.find(e => e.id === id);

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
function segsOf(ex) { const a = []; for (let s = 1; s <= ex.sets; s++) (ex.ps ? ['Links', 'Rechts'] : ['']).forEach(side => a.push({ set: s, side })); return a; }
function beep(n = 1, f = 880) {
  try { const C = beep.c || (beep.c = new (window.AudioContext || window.webkitAudioContext)()); C.resume && C.resume();
    for (let i = 0; i < n; i++) { const o = C.createOscillator(), g = C.createGain(); o.frequency.value = f; o.connect(g); g.connect(C.destination); const t0 = C.currentTime + i * .28;
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.4, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + .22); o.start(t0); o.stop(t0 + .25); } } catch (_) { }
  try { navigator.vibrate && navigator.vibrate(n > 1 ? [200, 100, 200, 100, 300] : 250); } catch (_) { }
}
function tInit(ex) { if (!T || T.id !== ex.id) T = { id: ex.id, segs: segsOf(ex), i: 0, left: ex.secs, run: false, done: false }; }
function tTick() {
  if (!T || !T.run) return; const now = Date.now(); const pl = Math.ceil(T.left); T.left -= (now - T.last) / 1000; T.last = now;
  const cl = Math.ceil(T.left); if (cl < pl && cl >= 1 && cl <= 3) beep(1, 660);
  if (T.left <= 0) {
    const ex = byId(T.id);
    if (T.i < T.segs.length - 1) { T.i++; T.left = ex.secs; beep(1); toast(T.segs[T.i].side ? 'Seite wechseln → ' + T.segs[T.i].side : 'Nächster Satz', 1600); }
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
  const left = Math.max(0, Math.ceil(T.left)); const frac = T.left / ex.secs; const C = 2 * Math.PI * 88;
  el.querySelector('.mt-num').textContent = Math.floor(left / 60) + ':' + pad(left % 60);
  el.querySelector('.mt-sub').textContent = T.done ? 'Fertig 💪' : `Satz ${sg.set}/${ex.sets}${sg.side ? ' · ' + sg.side : ''}`;
  el.querySelector('.mt-fg').style.strokeDashoffset = C * (1 - frac);
  el.querySelector('[data-act=mobT]').textContent = T.run ? '❚❚ Pause' : (T.done ? '↻ Nochmal' : (T.left < ex.secs || T.i ? '▶ Weiter' : '▶ Start'));
  el.classList.toggle('run', T.run);
  $$('.mt-seg').forEach((s, i) => s.classList.toggle('on', i < T.i || T.done));
}

/* ---------- Tagesstand ---------- */
function markDone(id, val) { const d = day(); if (val) d.today.done[id] = true; else delete d.today.done[id]; sv(d); const b = document.querySelector('[data-act=mobChk]'); if (b && document.getElementById('mob-detail')) render(true); }

/* ---------- Views ---------- */
function row(ex, d) {
  const ok = !!d.today.done[ex.id]; const i = ALL.indexOf(ex);
  return `<div class="card mob-row ${ok ? 'ok' : ''}" data-act="go" data-to="#/mob/${ex.id}">
    <button class="mob-chk ${ok ? 'on' : ''}" data-act="mobChk" data-id="${ex.id}" aria-label="Abhaken">${ok ? '✓' : (ex.eve ? '☾' : ex.fas ? '◎' : i + 1)}</button>
    <div class="mob-thumb">${ILL[ex.id]()}</div>
    <div class="mob-rt"><b>${esc(ex.n)}</b><div class="muted small">${esc(ex.dose)}</div></div><span class="mob-go">›</span></div>`;
}
function viewList() {
  const d = day(); const s = stats(); const nDone = EX.filter(e => d.today.done[e.id]).length;
  const eDone = EVE.filter(e => d.today.done[e.id]).length, fDone = FAS.filter(e => d.today.done[e.id]).length;
  const st = (n, t) => n >= t ? '<span class="mob-st ok">✓ heute erledigt</span>' : n ? `<span class="mob-st part">${n}/${t} · läuft</span>` : '<span class="mob-st">noch offen</span>';
  const hist = [...d.history].reverse().slice(0, 8).map(h => `<div class="mob-h"><span>${WD[fromKey(h.date).getDay()]} ${dateDE(h.date)}</span><span class="muted small">${h.done.filter(x => EX.some(e => e.id === x)).length}/${EX.length} Übungen${h.done.some(x => EVE.some(e => e.id === x)) ? ' · ☾ Abend' : ''}${h.done.some(x => FAS.some(e => e.id === x)) ? ' · ◎ Faszien' : ''}</span></div>`).join('') || '<div class="muted small">Noch keine Einheit – heute ist ein guter Tag zum Starten 🙂</div>';
  return {
    html: topbar('Hüft-Beweglichkeit', 'Dehnung & Gesundheit', null) + `
    <div class="mob-stats">
      <div class="card"><div class="mob-big gold">${s.streak}</div><div class="muted small">${s.streak === 1 ? 'Tag' : 'Tage'} in Folge 🔥</div></div>
      <div class="card"><div class="mob-big">${s.total}</div><div class="muted small">Einheiten gesamt</div></div>
      <div class="card"><div class="mob-big">${s.week}</div><div class="muted small">diese Woche</div></div>
    </div>
    <div class="card mob-note">⚠️ <b>Morgens kein langes Vorbeugen</b> (Bandscheibe). Nichts erzwingen – <b>schmerzfrei bleiben</b>. Bei ausstrahlendem Schmerz abbrechen.</div>
    <div class="mob-prog"><div style="width:${nDone / EX.length * 100}%"></div></div>
    <div class="card mob-today"><b>Heute</b> · ${s.todayDone ? '<span class="mob-st ok">✓ Einheit abgeschlossen</span>' : '<span class="mob-st">Einheit noch offen</span>'}
      <div class="mob-tl"><span>☀️ Morgen-Routine</span>${st(nDone, EX.length)}</div><div class="mob-tl"><span>☾ Abend</span>${st(eDone, EVE.length)}</div><div class="mob-tl"><span>◎ Faszien</span>${st(fDone, FAS.length)}</div></div>
    <div class="sec-h muted small" style="margin:10px 2px 2px">☀️ MORGEN-ROUTINE · ${nDone}/${EX.length} erledigt</div><div class="mob-when">Morgens nach dem Aufstehen</div>
    ${EX.map(e => row(e, d)).join('')}
    <div class="sec-h muted small" style="margin:18px 2px 2px">☾ ABEND (OPTIONAL)</div><div class="mob-when">Abends vor dem Schlafen</div>
    ${EVE.map(e => row(e, d)).join('')}
    <div class="sec-h muted small" style="margin:18px 2px 2px">◎ FASZIEN (OPTIONAL)</div><div class="mob-when">Blackroll · Duoball/Bälle · Shakti-Matte – ideal abends</div>
    ${FAS.map(e => row(e, d)).join('')}
    <div style="height:6px"></div>
    ${s.todayDone ? `<button class="btn btn-outline-gold" data-act="mobFinish">✓ Heute erledigt – Eintrag aktualisieren</button>` : `<button class="btn btn-red" data-act="mobFinish">Einheit abschließen ✓</button>`}
    <div class="sec-h muted small" style="margin:18px 2px 8px">VERLAUF</div><div class="card">${hist}</div>`
  };
}
function viewDetail(id) {
  const ex = byId(id); if (!ex) { location.hash = '#/mob'; return { html: '' }; }
  const d = day(); const ok = !!d.today.done[id]; const list = ex.eve ? EVE : ex.fas ? FAS : EX; const idx = list.indexOf(ex); const next = list[idx + 1];
  let tool;
  if (ex.t === 'time') {
    tInit(ex); const C = 2 * Math.PI * 88;
    tool = `<div class="card mob-timer" id="mt"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="mt-bg"/><circle cx="100" cy="100" r="88" class="mt-fg" stroke-dasharray="${C}" transform="rotate(-90 100 100)"/></svg>
      <div class="mt-in"><div class="mt-num">0:00</div><div class="mt-sub"></div></div>
      <div class="mt-segs">${T.segs.map(s => `<span class="mt-seg">${s.side ? s.side[0] : 'S'}${s.set}</span>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn btn-red btn-sm" data-act="mobT">▶ Start</button><button class="btn btn-ghost btn-sm" data-act="mobTR" style="max-width:120px">↺ Reset</button></div>
      <div class="muted small" style="margin-top:8px;text-align:center">${ex.ps ? 'Seitenwechsel automatisch mit Signalton/Vibration' : 'Signalton/Vibration am Ende'} · 3-2-1-Countdown · Display bleibt an</div></div>`;
  } else {
    const n = d.today.sets[id] || 0; const tot = ex.sets * (ex.ps ? 2 : 1);
    const segs = []; for (let s = 1; s <= ex.sets; s++) (ex.ps ? ['Links', 'Rechts'] : ['']).forEach(side => segs.push({ s, side }));
    tool = `<div class="card"><div class="muted small" style="margin-bottom:8px">SÄTZE ABHAKEN · ${n}/${tot}</div><div class="mob-sets">${segs.map((g, i) => `<button class="mob-set ${i < n ? 'on' : ''}" data-act="mobSet" data-id="${id}" data-i="${i}"><b>${ex.reps}</b><small>${g.side ? g.side + ' · ' : ''}Satz ${g.s}</small></button>`).join('')}</div>
      <div class="muted small" style="margin-top:8px">${esc(ex.dose)}</div></div>`;
  }
  const li = a => `<ul class="mob-ul">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  return {
    html: `<div id="mob-detail">` + topbar(ex.n, ex.eve ? 'Abend · vor dem Schlafen' : ex.fas ? 'Faszien · optional' : `Morgens · Übung ${idx + 1} von ${EX.length}`, '#/mob') + `
    <div class="card mob-ill">${ILL[id]()}<div class="muted small" style="margin-top:6px">${esc(ex.sub)} · <span class="gold">→ Pfeil = Bewegungsrichtung</span></div></div>
    <div class="mob-dose">${esc(ex.dose)}</div>
    ${tool}
    <div class="card"><h3 class="mob-h3">So geht's</h3><ol class="mob-ol">${ex.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <div class="card mob-cue"><h3 class="mob-h3">✅ Darauf achten</h3>${li(ex.cues)}</div>
    <div class="card mob-err"><h3 class="mob-h3">❌ Häufige Fehler</h3>${li(ex.err)}</div>
    <div class="card mob-note small">Nichts erzwingen, schmerzfrei bleiben.${ex.eve || ex.fas ? '' : ' Morgens kein langes Vorbeugen.'}</div>
    <button class="btn ${ok ? 'btn-outline-gold' : 'btn-red'}" data-act="mobChk" data-id="${id}">${ok ? '✓ Erledigt (tippen zum Zurücksetzen)' : 'Als erledigt abhaken'}</button>
    <div style="height:10px"></div>
    ${next ? `<button class="btn btn-ghost btn-sm" data-act="go" data-to="#/mob/${next.id}">Nächste: ${esc(next.n)} ›</button>` : `<button class="btn btn-ghost btn-sm" data-act="go" data-to="#/mob">Zur Übersicht ›</button>`}</div>`,
    mount: () => { if (ex.t === 'time') tPaint(); }
  };
}
window.viewMob = a => a ? viewDetail(a) : viewList();

/* ---------- Aktionen ---------- */
Object.assign(A, {
  mobChk: (dd, el) => { const d = day(); markDone(dd.id, !d.today.done[dd.id]); render(true); },
  mobSet: dd => { const ex = byId(dd.id); const d = day(); const i = +dd.i; const cur = d.today.sets[dd.id] || 0; d.today.sets[dd.id] = i < cur ? i : i + 1; const tot = ex.sets * (ex.ps ? 2 : 1);
    if (d.today.sets[dd.id] >= tot) { d.today.done[dd.id] = true; beep(2, 990); toast('Übung geschafft ✓', 1400); } else try { navigator.vibrate && navigator.vibrate(40); } catch (_) { }
    sv(d); render(true); },
  mobT: () => { if (!T) return; beep.c || beep(0); if (T.done) { const ex = byId(T.id); T = null; tInit(ex); } T.run = !T.run; T.last = Date.now(); if (T.run && !('wakeLock' in navigator)) wvStart(); wakeSync(); tPaint(); },
  mobTR: () => { if (!T) return; const ex = byId(T.id); T = null; tInit(ex); wakeSync(); tPaint(); },
  mobFinish: () => { const d = day(); const done = Object.keys(d.today.done);
    if (!done.length && !confirm('Noch keine Übung abgehakt. Trotzdem als Einheit speichern?')) return;
    d.history = d.history.filter(h => h.date !== tk()); d.history.push({ date: tk(), ts: Date.now(), done }); d.history.sort((a, b) => a.date < b.date ? -1 : 1); sv(d);
    beep(2, 990); const s = stats(); toast(`Stark, Markus! ${s.streak} ${s.streak === 1 ? 'Tag' : 'Tage'} in Folge 🔥`, 2200); render(true); }
});
})();
