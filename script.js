'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function buzz(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

/* ========== CONFETTI ========== */
const confCanvas = document.getElementById('confetti');
const cctx = confCanvas.getContext('2d');
let confParts = [], confRAF = null;
const confColors = ['#F8BBD9', '#F48FB1', '#FFD6BA', '#D8C5F0', '#BFE6D4', '#FFC9DE', '#FFFFFF'];
function confResize() { confCanvas.width = window.innerWidth; confCanvas.height = window.innerHeight; }
function burstConfetti(count = 130, originY = 0.34) {
  if (reduceMotion) return;
  confResize();
  const ox = window.innerWidth / 2, oy = window.innerHeight * originY;
  for (let i = 0; i < count; i++) {
    confParts.push({
      x: ox + (Math.random() - .5) * 220, y: oy + (Math.random() - .5) * 60,
      vx: (Math.random() - .5) * 11, vy: Math.random() * -13 - 4,
      g: .28 + Math.random() * .12, r: Math.random() * 7 + 4,
      rot: Math.random() * 6.28, vr: (Math.random() - .5) * .35,
      col: confColors[i % confColors.length], life: 0, shape: Math.random() < .5 ? 0 : 1
    });
  }
  if (!confRAF) confRAF = requestAnimationFrame(confTick);
}
function confTick() {
  cctx.clearRect(0, 0, confCanvas.width, confCanvas.height);
  confParts.forEach(p => {
    p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
    cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.rot);
    cctx.globalAlpha = Math.max(0, 1 - p.life / 170); cctx.fillStyle = p.col;
    if (p.shape === 0) cctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6);
    else { cctx.beginPath(); cctx.arc(0, 0, p.r / 2, 0, 7); cctx.fill(); }
    cctx.restore();
  });
  confParts = confParts.filter(p => p.y < confCanvas.height + 40 && p.life < 175);
  if (confParts.length) confRAF = requestAnimationFrame(confTick);
  else { cctx.clearRect(0, 0, confCanvas.width, confCanvas.height); confRAF = null; }
}
window.addEventListener('resize', confResize);

/* ========== INTRO ========== */
const intro = document.getElementById('intro');
function dismissIntro() {
  if (intro.classList.contains('hide')) return;
  intro.classList.add('hide');
  setTimeout(() => burstConfetti(150), 250);
}
intro.addEventListener('click', dismissIntro);
setTimeout(dismissIntro, 6000);

/* ========== NAV / TAB SWITCHING ========== */
const navBtns = document.querySelectorAll('nav button');
const tabs = document.querySelectorAll('.tab');
const tabOrder = [...navBtns].map(b => b.dataset.tab);
const progFill = document.querySelector('#progress i');
const scrollCue = document.getElementById('scrollCue');

function showTab(name) {
  navBtns.forEach(x => x.classList.toggle('active', x.dataset.tab === name));
  tabs.forEach(t => t.classList.toggle('show', t.id === 'tab-' + name));
  window.scrollTo(0, 0);
  const idx = tabOrder.indexOf(name);
  progFill.style.width = (idx / (tabOrder.length - 1)) * 100 + '%';
  updateScrollCue(name);
  if (name === 'reasons') revealReasons();
  if (name === 'heart') startHeart();
  if (name === 'sky') skyActive = true; else skyActive = false;
}
navBtns.forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
progFill.style.width = '0%';

/* подсказка «листай вниз» — показывается на вкладках, где есть что прокрутить */
function updateScrollCue(name) {
  const tab = document.getElementById('tab-' + name);
  const scrollable = tab && tab.scrollHeight > tab.clientHeight + 24;
  scrollCue.classList.toggle('show', !!scrollable && tab.scrollTop < 20);
}
tabs.forEach(t => t.addEventListener('scroll', () => {
  scrollCue.classList.toggle('show', t.classList.contains('show') &&
    t.scrollHeight > t.clientHeight + 24 && t.scrollTop < 20);
}, { passive: true }));

/* ========== STARRY SKY ========== */
const skyCanvas = document.getElementById('sky-canvas');
const sctx = skyCanvas.getContext('2d');
let SW, SH, stars = [], skyActive = true;

const constellations = [
  { name: 'Большая Медведица', desc: 'Семь ярких звёзд-ковш. Самое узнаваемое созвездие северного неба.', pts: [[.12,.18],[.18,.16],[.24,.19],[.29,.24],[.30,.33],[.22,.35],[.19,.27],[.29,.24]], cx:.21, cy:.25 },
  { name: 'Малая Медведица', desc: 'На её конце — Полярная звезда, указывающая на север.', pts: [[.40,.10],[.42,.16],[.44,.22],[.41,.27],[.46,.27],[.46,.22],[.44,.22]], cx:.43, cy:.18 },
  { name: 'Кассиопея', desc: 'Буква W из пяти звёзд. Видна круглый год.', pts: [[.58,.14],[.63,.20],[.68,.15],[.73,.21],[.78,.16]], cx:.68, cy:.17 },
  { name: 'Лебедь', desc: 'Большой Северный Крест, летящий вдоль Млечного Пути.', pts: [[.55,.45],[.55,.55],[.55,.65],[.48,.55],[.62,.55],[.55,.55]], cx:.55, cy:.55 },
  { name: 'Лира', desc: 'Маленькое созвездие с яркой Вегой — одной из ярчайших звёзд лета.', pts: [[.78,.45],[.80,.50],[.83,.54],[.79,.55],[.80,.50]], cx:.80, cy:.50 },
  { name: 'Геркулес', desc: 'Герой древних мифов, раскинувшийся в летнем небе.', pts: [[.30,.55],[.34,.60],[.34,.68],[.30,.72],[.26,.68],[.26,.60],[.30,.55]], cx:.30, cy:.63 },
  { name: 'Дракон', desc: 'Извивается между Медведицами длинной цепочкой звёзд.', pts: [[.40,.40],[.46,.43],[.52,.40],[.50,.34],[.55,.32]], cx:.48, cy:.38 },
  { name: 'Северная Корона', desc: 'Изящный полукруг звёзд — небесная диадема.', pts: [[.14,.50],[.17,.47],[.21,.47],[.24,.50],[.22,.54],[.18,.55],[.15,.53]], cx:.19, cy:.51 }
];

function skyResize() {
  SW = skyCanvas.width = skyCanvas.offsetWidth;
  SH = skyCanvas.height = skyCanvas.offsetHeight;
  stars = [];
  for (let i = 0; i < 170; i++) {
    stars.push({ x: Math.random()*SW, y: Math.random()*SH, r: Math.random()*1.3+.2, t: Math.random()*6.28, s: Math.random()*.02+.005 });
  }
}
function skyDraw() {
  if (skyActive && SW) {
    sctx.clearRect(0, 0, SW, SH);
    stars.forEach(st => {
      st.t += st.s;
      const a = .4 + Math.abs(Math.sin(st.t)) * .6;
      sctx.beginPath(); sctx.arc(st.x, st.y, st.r, 0, 7);
      sctx.fillStyle = 'rgba(255,255,255,' + a + ')'; sctx.fill();
    });
    constellations.forEach(c => {
      sctx.beginPath();
      c.pts.forEach((p, i) => { const x = p[0]*SW, y = p[1]*SH; i ? sctx.lineTo(x, y) : sctx.moveTo(x, y); });
      sctx.strokeStyle = 'rgba(248,187,217,.35)'; sctx.lineWidth = 1; sctx.stroke();
      c.pts.forEach(p => {
        sctx.beginPath(); sctx.arc(p[0]*SW, p[1]*SH, 2.3, 0, 7);
        sctx.fillStyle = '#fff'; sctx.shadowColor = '#F8BBD9'; sctx.shadowBlur = 9; sctx.fill(); sctx.shadowBlur = 0;
      });
    });
  }
  requestAnimationFrame(skyDraw);
}
const ccard = document.getElementById('constCard');
skyCanvas.addEventListener('mousemove', e => {
  const r = skyCanvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) / SW, my = (e.clientY - r.top) / SH;
  let hit = null;
  constellations.forEach(c => { if (Math.hypot(mx - c.cx, my - c.cy) < .08) hit = c; });
  if (hit) {
    ccard.innerHTML = '<b>' + hit.name + '</b>' + hit.desc;
    ccard.style.left = Math.min(e.clientX + 15, window.innerWidth - 255) + 'px';
    ccard.style.top = (e.clientY + 15) + 'px';
    ccard.classList.add('show');
  } else ccard.classList.remove('show');
});
skyCanvas.addEventListener('mouseleave', () => ccard.classList.remove('show'));

/* тап по созвездию на телефоне — больший радиус попадания + автоскрытие */
let ccardTimer;
skyCanvas.addEventListener('click', e => {
  const r = skyCanvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) / SW, my = (e.clientY - r.top) / SH;
  let hit = null, best = .12;
  constellations.forEach(c => { const d = Math.hypot(mx - c.cx, my - c.cy); if (d < best) { best = d; hit = c; } });
  if (!hit) { ccard.classList.remove('show'); return; }
  ccard.innerHTML = '<b>' + hit.name + '</b>' + hit.desc;
  ccard.style.left = Math.min(Math.max(e.clientX - 120, 12), window.innerWidth - 252) + 'px';
  ccard.style.top = Math.min(e.clientY + 16, window.innerHeight - 170) + 'px';
  ccard.classList.add('show');
  buzz(15);
  clearTimeout(ccardTimer);
  ccardTimer = setTimeout(() => ccard.classList.remove('show'), 3500);
});
window.addEventListener('resize', () => { skyResize(); if (heartStarted) buildHeart(); });
skyResize();
skyDraw();

/* ========== 17 REASONS ========== */
const reasons = [
  "Ты переживаешь за всех вокруг — и это делает тебя особенной",
  "Твоя любовь чувствуется в каждой мелочи",
  "Ты добрая — по-настоящему, до глубины души",
  "Ты хочешь помогать людям и лечить их — и у тебя точно получится",
  "С тобой невозможно скучать",
  "Ты самая красивая",
  "Твой день рождения совпадает с началом ВОВ — историческая личность 😄",
  "Ты умеешь любить по-настоящему",
  "Рядом с тобой я всегда чувствую себя дома",
  "Ты вдохновляешь меня быть лучше",
  "Твоя улыбка меняет настроение мгновенно",
  "Ты сильная, даже когда сама этого не замечаешь",
  "Ты умеешь слушать и слышать",
  "С тобой каждый день становится особенным",
  "Ты моя принцесса — и этим всё сказано 👑",
  "Ты делаешь мой мир ярче просто своим существованием",
  "Мы всегда рядом — и я не хочу иначе"
];
// по «приколюхе»-стикеру на каждую карточку (подобраны под смысл + милые зверюшки)
const reasonDecor = ['🌸','🐘','🐻','🩺','🦄','🌷','🕊️','💗','🏡','⭐','☀️','🦁','🐰','✨','👑','🌈','🐧'];
const rlist = document.getElementById('reasons-list');
reasons.forEach((r, i) => {
  const d = document.createElement('div');
  d.className = 'reason';
  d.innerHTML = '<span class="reason-emoji">' + (reasonDecor[i] || '🌸') + '</span>' +
    '<div class="num">' + (i + 1) + '</div><p>' + r + '</p>';
  rlist.appendChild(d);
});
function revealReasons() {
  document.querySelectorAll('.reason').forEach((it, i) => setTimeout(() => it.classList.add('in'), i * 85));
}

/* ========== HEART — wireframe mesh ========== */
const hc = document.getElementById('heart-canvas');
const hctx = hc.getContext('2d');
let heartStarted = false, hT = 0, heartNodes = [];
const PER_RING = 30, RINGS = 11;

function heartShape(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  return [x, -y];
}
function buildHeart() {
  hc.width = hc.offsetWidth;
  hc.height = hc.offsetHeight;
  heartNodes = [];
  for (let r = 1; r <= RINGS; r++) {
    const scale = r / RINGS;
    for (let k = 0; k < PER_RING; k++) {
      const t = (k / PER_RING) * Math.PI * 2;
      const [bx, by] = heartShape(t);
      heartNodes.push({ bx: bx * scale, by: by * scale, ring: r, ang: t, ph: Math.random() * 6.28 });
    }
  }
}
function heartDraw() {
  // stop drawing entirely when the heart tab is hidden
  if (!document.getElementById('tab-heart').classList.contains('show')) {
    heartStarted = false;
    return;
  }
  hT += .025;
  const w = hc.width, h = hc.height, cx = w / 2, cy = h / 2;
  const sc = Math.min(w, h) / 42;
  hctx.clearRect(0, 0, w, h);
  const beat = 1 + Math.sin(hT * 1.6) * .05;
  const pos = heartNodes.map(n => {
    const wob = Math.sin(hT * 2 + n.ph + n.ring * .5) * .5;
    return {
      x: cx + (n.bx * beat + wob * Math.cos(n.ang)) * sc,
      y: cy + (n.by * beat + wob * Math.sin(n.ang)) * sc,
      ang: n.ang
    };
  });
  hctx.lineWidth = 1;
  for (let i = 0; i < pos.length; i++) {
    const a = pos[i];
    const ringStart = i - (i % PER_RING);
    const sameRingNext = pos[ringStart + ((i % PER_RING) + 1) % PER_RING];
    if (sameRingNext) {
      hctx.beginPath(); hctx.moveTo(a.x, a.y); hctx.lineTo(sameRingNext.x, sameRingNext.y);
      hctx.strokeStyle = 'rgba(255,45,85,.32)'; hctx.stroke();
    }
    const outer = pos[i + PER_RING];
    if (outer) {
      hctx.beginPath(); hctx.moveTo(a.x, a.y); hctx.lineTo(outer.x, outer.y);
      hctx.strokeStyle = 'rgba(255,45,85,.18)'; hctx.stroke();
    }
  }
  pos.forEach(p => {
    hctx.beginPath(); hctx.arc(p.x, p.y, 1.6, 0, 7);
    hctx.fillStyle = '#FF2D55'; hctx.shadowColor = '#FF2D55'; hctx.shadowBlur = 10; hctx.fill();
  });
  hctx.shadowBlur = 0;
  requestAnimationFrame(heartDraw);
}
function startHeart() {
  buildHeart();           // always re-measure on open
  if (heartStarted) return;
  heartStarted = true;
  heartDraw();
}

/* ========== BALLOONS ========== */
const compliments = [
  "Ты светишь ярче всех звёзд ✨", "Твоя доброта — суперсила 🦋", "Ты создана делать мир лучше 🌸",
  "Принцесса во всём — даже в мелочах 👑", "Твоя улыбка — лучшее что я видел", "Ты умнее чем думаешь о себе 🌿",
  "Будущий врач с золотым сердцем 🩺", "Ты заслуживаешь всего самого лучшего", "Рядом с тобой тепло 🍑",
  "Ты моя любимая тревожная принцесса 💜", "Твоя забота о людях бесценна", "Ты прекрасна — и снаружи и внутри",
  "Ты делаешь счастливым просто фактом своего существования", "17 лет — и уже такая удивительная",
  "Ты — моё любимое место на земле 🤍", "Твоя энергия заряжает всех вокруг ⚡", "Мир точно стал лучше 22 июня 2009 🌍"
];
const colors = ['#F8BBD9', '#FFD6BA', '#D8C5F0', '#BFE6D4', '#FFC9DE', '#C9E4FF'];
const area = document.getElementById('balloons-area');
const compEl = document.getElementById('compliment');
let compTimer;
compliments.forEach((txt, i) => {
  const col = colors[i % colors.length];
  const b = document.createElement('div');
  b.className = 'balloon';
  b.style.left = (5 + Math.random() * 85) + '%';
  b.style.top = (10 + Math.random() * 72) + '%';
  b.style.animationDuration = (3 + Math.random() * 3) + 's';
  b.style.animationDelay = (Math.random() * 2) + 's';
  b.innerHTML = '<svg width="58" height="82" viewBox="0 0 58 82"><ellipse cx="29" cy="31" rx="25" ry="30" fill="' + col + '"/><path d="M29,61 l-4,8 h8 z" fill="' + col + '"/><line x1="29" y1="69" x2="29" y2="82" stroke="' + col + '" stroke-width="1.2"/></svg>';
  b.addEventListener('click', () => {
    if (b.classList.contains('pop')) return;
    b.classList.add('pop');
    buzz(30);
    compEl.textContent = txt;
    compEl.classList.add('show');
    clearTimeout(compTimer);
    compTimer = setTimeout(() => compEl.classList.remove('show'), 2500);
    setTimeout(() => { b.style.display = 'none'; }, 400);
  });
  area.appendChild(b);
});

/* ========== QUIZ — swipe deck ========== */
const questions = [
  { q: "Когда у меня день рождения?" },
  { q: "Во сколько лет я завёл YouTube канал?" },
  { q: "Как называлась первая игра, которую я сам установил — и про что она?" },
  { q: "Сколько секций и кружков я посещал за всю жизнь?" },
  { q: "Во сколько лет я научился читать по слогам?" },
  { q: "Во сколько лет я впервые освоил фоторедакторы?" },
  { q: "Какой был мой первый шутер в жизни?", opts: ["CS 1.6", "Unreal", "Warface"] },
  { q: "Сколько у меня было игровых приставок?" },
  { q: "Какой был мой любимый напиток в детстве?" },
  { q: "Какое у меня сейчас звание и сколько часов в CS2?" },
  { final: true, q: "Спасибо, Принцесса! 👑\nРезультат узнаешь лично 😊" }
];
const deck = document.getElementById('deck');
const dotsEl = document.getElementById('dots');
let qi = 0, finalFired = false;

function buildDeck() {
  deck.innerHTML = '';
  dotsEl.innerHTML = '';
  questions.forEach((q, i) => {
    const c = document.createElement('div');
    c.className = 'qcard' + (q.final ? ' final' : '');
    c.style.zIndex = questions.length - i;
    c.dataset.i = i;
    const opts = q.opts ? '<div class="qopts">' + q.opts.map(o => '<span>' + o + '</span>').join('') + '</div>' : '';
    const brand = q.final ? '' : '<div class="brand">👑 для Камилы</div>';
    c.innerHTML = '<div class="qtext">' + q.q.replace(/\n/g, '<br>') + '</div>' + opts + brand;
    deck.appendChild(c);
    if (!q.final) dotsEl.appendChild(document.createElement('i'));
    if (!q.final) addSwipe(c, i);   // финальную карточку нельзя свайпать
  });
  update();
}
function update() {
  [...deck.children].forEach((c, i) => {
    c.classList.remove('gone-l', 'gone-r');
    if (i < qi) c.classList.add('gone-l');
  });
  [...dotsEl.children].forEach((d, i) => d.classList.toggle('on', i === Math.min(qi, questions.length - 2)));
  document.getElementById('qPrev').disabled = qi === 0;
  document.getElementById('qNext').disabled = qi >= questions.length - 1;
  // долистали до финальной карточки — праздничный салют (один раз)
  if (qi === questions.length - 1 && !finalFired) { finalFired = true; burstConfetti(120, 0.4); }
}
function nextCard() { if (qi < questions.length - 1) { qi++; update(); } }
function prevCard() { if (qi > 0) { qi--; update(); } }
document.getElementById('qNext').addEventListener('click', nextCard);
document.getElementById('qPrev').addEventListener('click', prevCard);

function addSwipe(card, idx) {
  let sx = 0, dx = 0, drag = false;
  const down = x => { if (idx !== qi) return; drag = true; sx = x; card.style.transition = 'none'; };
  const move = x => { if (!drag) return; dx = x - sx; card.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx * .04) + 'deg)'; };
  const up = () => {
    if (!drag) return;
    drag = false;
    card.style.transition = '';
    const before = qi;
    if (dx < -80) nextCard();
    else if (dx > 80) prevCard();
    if (qi === before) card.style.transform = '';  // карточка не сменилась — вернуть на место
    else buzz(12);
    dx = 0;
  };
  card.addEventListener('mousedown', e => down(e.clientX));
  window.addEventListener('mousemove', e => move(e.clientX));
  window.addEventListener('mouseup', up);
  card.addEventListener('touchstart', e => down(e.touches[0].clientX), { passive: true });
  card.addEventListener('touchmove', e => move(e.touches[0].clientX), { passive: true });
  card.addEventListener('touchend', up);
}
buildDeck();
