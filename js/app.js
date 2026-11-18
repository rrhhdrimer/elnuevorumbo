import { TEXTS, IMAGES, MAP, MOMENTS, QUESTIONS, MAX_SCORE, ATTEMPTS_PER_CYCLE } from './content.js';
import {
  isValidDni,
  cleanName,
  newState,
  loadState,
  saveState,
  lastDni,
  completeMoment,
  repeatStory,
  submitExam,
  withPending,
  canTakeExam,
  mustRepeat,
  examDone,
  outcome,
} from './state.js';
import { flush, apiConfigured } from './sync.js';

const $ = (sel) => document.querySelector(sel);
const SVG_NS = 'http://www.w3.org/2000/svg';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let S = null; // estado del participante actual
let moving = false;
let segmentEls = [];

// ---------- Utilidades ----------

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null) node.append(c);
  return node;
}

function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => (s.hidden = s.id !== id));
  $('#topbar').hidden = !S || id === 'screen-welcome' || id === 'screen-register';
  document.body.dataset.screen = id;
  window.scrollTo(0, 0);
}

function commit(next) {
  S = next;
  saveState(S);
  sync();
}

// ---------- Sincronización ----------

function setSync(status) {
  const node = $('#sync');
  if (!node) return;
  const labels = { saved: 'Guardado', saving: 'Guardando…', pending: 'Pendiente de guardar' };
  node.textContent = labels[status] || '';
  node.dataset.status = status;
  node.title =
    status === 'pending' && !apiConfigured()
      ? 'El registro central aún no está configurado. Tu avance está guardado en este navegador.'
      : '';
}

function sync() {
  flush(
    () => S,
    (op, data) => {
      if (S && S.pending && S.pending.id === op.id) {
        S = { ...S, pending: null };
        if (typeof data.best === 'number') S.best = Math.max(S.best ?? 0, data.best);
        saveState(S);
      }
      setSync(S && S.pending ? 'pending' : 'saved');
    },
    setSync,
  );
}

window.addEventListener('online', sync);

// ---------- Bienvenida y registro ----------

function renderWelcome() {
  const logo = $('#welcome-logo');
  logo.src = IMAGES.logo;
  $('#welcome-intro').textContent = TEXTS.intro;
  $('#btn-start').textContent = TEXTS.start;
  show('screen-welcome');
}

function openRegister() {
  const dni = lastDni();
  const prev = dni ? loadState(dni) : null;
  $('#dni').value = dni;
  $('#name').value = prev ? prev.name : '';
  $('#dni-error').textContent = '';
  $('#name-error').textContent = '';
  show('screen-register');
  $('#dni').focus();
}

function onRegister(e) {
  e.preventDefault();
  const dni = $('#dni').value.trim();
  const name = cleanName($('#name').value);
  let ok = true;
  $('#dni-error').textContent = '';
  $('#name-error').textContent = '';
  if (!isValidDni(dni)) {
    $('#dni-error').textContent = 'El DNI debe tener 8 dígitos.';
    ok = false;
  }
  if (!name) {
    $('#name-error').textContent = 'Escribe tu nombre.';
    ok = false;
  }
  $('#dni').setAttribute('aria-invalid', String(!isValidDni(dni)));
  $('#name').setAttribute('aria-invalid', String(!name));
  if (!ok) {
    (isValidDni(dni) ? $('#name') : $('#dni')).focus();
    return;
  }
  const existing = loadState(dni);
  if (existing) {
    commit(existing.name !== name ? withPending({ ...existing, name }) : existing);
  } else {
    commit(withPending(newState(dni, name)));
  }
  $('#who').textContent = S.name;
  renderMap();
}

// ---------- Mapa ----------

function pct(x, y) {
  return { left: `${(x / MAP.width) * 100}%`, top: `${(y / MAP.height) * 100}%` };
}

function point(i) {
  return i === 0 ? MAP.start : MAP.stops[i - 1];
}

function buildMap() {
  const map = $('#map');
  map.innerHTML = '';
  map.style.aspectRatio = `${MAP.width} / ${MAP.height}`;

  const art = svg('svg', {
    viewBox: `0 0 ${MAP.width} ${MAP.height}`,
    class: 'map__svg',
    'aria-hidden': 'true',
    preserveAspectRatio: 'xMidYMid slice',
  });
  art.append(provisionalArt());

  const base = svg('image', { href: IMAGES.map, x: 0, y: 0, width: MAP.width, height: MAP.height, class: 'map__base' });
  base.addEventListener('error', () => base.remove());
  art.append(base);

  const routeGroup = svg('g', { class: 'route' });
  segmentEls = MAP.segments.map((d) => {
    const under = svg('path', { d, class: 'route__under' });
    const path = svg('path', { d, class: 'route__seg' });
    routeGroup.append(under, path);
    return path;
  });
  art.append(routeGroup);
  map.append(art);

  MAP.stops.forEach((p, i) => {
    const n = i + 1;
    const m = MOMENTS[i];
    const btn = el(
      'button',
      { type: 'button', class: 'stop', 'data-n': n, onclick: () => onStop(n) },
      el('span', { class: 'stop__num', 'aria-hidden': 'true', text: String(n) }),
      el('span', { class: 'stop__label', text: m.title }),
    );
    Object.assign(btn.style, pct(p.x, p.y));
    map.append(btn);
  });

  const teo = el('div', { class: 'teo', id: 'teo', 'aria-hidden': 'true' }, el('img', { src: IMAGES.teo, alt: '' }));
  map.append(teo);
  map.append(el('p', { class: 'visually-hidden', id: 'teo-pos', 'aria-live': 'polite' }));
}

function placeTeo(x, y, facingLeft) {
  const teo = $('#teo');
  Object.assign(teo.style, pct(x, y));
  teo.classList.toggle('teo--left', Boolean(facingLeft));
}

function followTeo() {
  const scroller = $('#map-scroll');
  const teo = $('#teo');
  if (!scroller || !teo || scroller.scrollWidth <= scroller.clientWidth) return;
  const target = teo.offsetLeft - scroller.clientWidth / 2;
  scroller.scrollLeft = Math.max(0, target);
}

function renderMap() {
  if (!$('#map').childElementCount) buildMap();
  const s = S;
  $('#map-hint').textContent = TEXTS.mapHint;
  $('#progress').innerHTML = '';
  $('#progress').append(
    el('strong', { text: `${s.completed} de 6` }),
    el('span', { text: ' momentos' }),
    el('span', { class: 'progress__bar', 'aria-hidden': 'true' }, el('span', { style: `width:${(s.completed / 6) * 100}%` })),
  );

  document.querySelectorAll('.stop').forEach((btn) => {
    const n = Number(btn.dataset.n);
    const state = n <= s.completed ? 'done' : n === s.completed + 1 ? 'open' : 'locked';
    btn.dataset.state = state;
    btn.disabled = state === 'locked';
    const label = { done: 'completado, revisar', open: 'disponible', locked: 'bloqueado' }[state];
    btn.setAttribute('aria-label', `Momento ${n}: ${MOMENTS[n - 1].title}. ${label}`);
    btn.querySelector('.stop__num').textContent = state === 'done' ? '✓' : state === 'locked' ? '🔒' : String(n);
  });
  segmentEls.forEach((p, i) => p.classList.toggle('route__seg--done', i < s.position));

  const pos = point(s.position);
  placeTeo(pos.x, pos.y, false);

  const actions = $('#map-actions');
  actions.innerHTML = '';
  if (examDone(s)) {
    actions.append(el('span', { class: 'badge badge--gold', text: `Reto completado: ${MAX_SCORE} de ${MAX_SCORE}` }));
  } else if (mustRepeat(s)) {
    actions.append(el('button', { class: 'btn btn--primary', type: 'button', text: TEXTS.repeatStory, onclick: onRepeat }));
  } else {
    const ready = canTakeExam(s);
    actions.append(
      el('button', {
        class: 'btn btn--primary',
        type: 'button',
        id: 'btn-final',
        text: TEXTS.finalChallenge,
        disabled: !ready,
        title: ready ? '' : 'Se habilita al completar los seis momentos',
        onclick: openExam,
      }),
    );
    if (!ready) actions.append(el('span', { class: 'muted small', text: 'Se habilita al completar los seis momentos.' }));
  }
  if (s.lastFeedback) {
    actions.append(el('button', { class: 'btn btn--ghost', type: 'button', text: TEXTS.viewResult, onclick: renderResult }));
  }

  show('screen-map');
  requestAnimationFrame(followTeo);
}

function animateSegment(i) {
  return new Promise((resolve) => {
    const path = segmentEls[i];
    const total = path.getTotalLength();
    const duration = Math.max(800, (total / 420) * 1000);
    const t0 = performance.now();
    let lastX = path.getPointAtLength(0).x;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const p = path.getPointAtLength(e * total);
      placeTeo(p.x, p.y, p.x < lastX - 0.01);
      if (Math.abs(p.x - lastX) > 0.5) lastX = p.x;
      followTeo();
      if (t < 1) requestAnimationFrame(step);
      else {
        path.classList.add('route__seg--done');
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
}

async function moveTo(target) {
  moving = true;
  document.body.classList.add('is-moving');
  try {
    if (!reduceMotion()) {
      for (let i = S.position; i < target; i++) await animateSegment(i);
    }
    commit({ ...S, position: target });
    const p = point(target);
    placeTeo(p.x, p.y, false);
  } finally {
    moving = false;
    document.body.classList.remove('is-moving');
  }
}

async function onStop(n) {
  if (moving) return;
  if (n <= S.completed) {
    openBook(n, true);
    return;
  }
  if (n !== S.completed + 1) return;
  if (S.position < n) await moveTo(n);
  $('#teo-pos').textContent = `TEO llegó al momento ${n}.`;
  openBook(n, false);
}

function onRepeat() {
  commit(repeatStory(S));
  renderMap();
  $('.stop[data-n="1"]')?.focus();
}

// ---------- Libro ----------

let bookMoment = null;

function figure(page) {
  const fig = el('figure', { class: 'page__fig' });
  const ph = el(
    'div',
    { class: 'placeholder' },
    el('strong', { text: `Imagen provisional · ${page.id}` }),
    el('span', { text: page.placeholder }),
  );
  const img = el('img', { src: page.image, alt: '', loading: 'lazy' });
  img.addEventListener('error', () => img.replaceWith(ph));
  fig.append(img);
  return fig;
}

function openBook(n, review) {
  const m = MOMENTS[n - 1];
  bookMoment = { n, review };
  const book = $('#book');
  book.classList.toggle('book--center', Boolean(m.center));
  $('#book-kicker').textContent = `Momento ${n} de 6`;
  $('#book-title').textContent = m.title;
  const pages = $('#book-pages');
  pages.innerHTML = '';
  m.pages.forEach((p, idx) => {
    const page = el(
      'article',
      { class: `page ${m.center ? 'page--center' : idx === 0 ? 'page--left' : 'page--right'}` },
      figure(p),
      el('div', { class: 'page__body' }, m.center ? null : el('h3', { class: 'page__heading', text: p.heading }), el('p', { text: p.text })),
    );
    if (p.values) {
      page.append(el('ul', { class: 'values', 'aria-label': 'Valores del #ModoDrimer' }, p.values.map((v) => el('li', { text: v }))));
    }
    pages.append(page);
  });
  $('#book-continue').textContent = review ? TEXTS.backToMap : TEXTS.continue;
  book.showModal();
  book.querySelector('.book__inner').scrollTop = 0;
  $('#book-close').focus();
}

function closeBook() {
  const book = $('#book');
  if (book.open) book.close();
}

function onBookClosed() {
  const n = bookMoment?.n;
  bookMoment = null;
  if (!S) return;
  renderMap();
  const focusTarget = S.completed === 6 && canTakeExam(S) ? $('#btn-final') : $(`.stop[data-n="${n}"]`);
  focusTarget?.focus();
}

function onContinue() {
  if (bookMoment && !bookMoment.review) {
    const before = S.maxCompleted;
    let next = completeMoment(S, bookMoment.n);
    if (next.maxCompleted > before) next = withPending(next);
    commit(next);
  }
  closeBook();
}

// ---------- Reto final ----------

function openExam() {
  if (!canTakeExam(S)) {
    renderMap();
    return;
  }
  $('#exam-intro').textContent = TEXTS.challengeIntro;
  $('#exam-attempts').textContent = `Oportunidad ${ATTEMPTS_PER_CYCLE - S.attemptsLeft + 1} de ${ATTEMPTS_PER_CYCLE} en este recorrido. Cada respuesta correcta vale 4 puntos.`;
  const wrap = $('#exam-questions');
  wrap.innerHTML = '';
  QUESTIONS.forEach((q, i) => {
    const fs = el('fieldset', { class: 'question' }, el('legend', {}, el('span', { class: 'question__n', text: `${i + 1}` }), q.q));
    for (const [key, text] of Object.entries(q.options)) {
      fs.append(
        el(
          'label',
          { class: 'option' },
          el('input', { type: 'radio', name: `q${i}`, value: key, required: true }),
          el('span', { class: 'option__key', text: key }),
          el('span', { text }),
        ),
      );
    }
    wrap.append(fs);
  });
  const submit = $('#btn-submit');
  submit.textContent = TEXTS.submit;
  submit.disabled = true;
  show('screen-exam');
  $('#main').focus();
}

function currentAnswers() {
  return QUESTIONS.map((_, i) => {
    const checked = document.querySelector(`input[name="q${i}"]:checked`);
    return checked ? checked.value : null;
  });
}

function onExamChange() {
  $('#btn-submit').disabled = currentAnswers().some((a) => !a);
}

function onExamSubmit(e) {
  e.preventDefault();
  const submit = $('#btn-submit');
  if (submit.disabled) return;
  submit.disabled = true; // evita doble clic
  const answers = currentAnswers();
  if (answers.some((a) => !a)) return;
  const { state, result } = submitExam(S, answers);
  if (!result) {
    renderMap();
    return;
  }
  commit(state);
  renderResult();
}

// ---------- Resultado ----------

function renderResult() {
  const s = S;
  const fb = s.lastFeedback;
  if (!fb) {
    renderMap();
    return;
  }
  const box = $('#result');
  box.innerHTML = '';
  const o = outcome(s);
  const msg = {
    done: TEXTS.msg20,
    passed: TEXTS.msg16(s.best),
    retry: TEXTS.msgFailRetry,
    out: TEXTS.msgFailOut,
  }[o.kind];

  const actions = el('div', { class: 'row row--wrap' });
  const add = (label, fn, primary) =>
    actions.append(el('button', { class: `btn ${primary ? 'btn--primary' : 'btn--ghost'}`, type: 'button', text: label, onclick: fn }));
  if (o.kind === 'done') add(TEXTS.backToMap, renderMap, true);
  for (const a of o.actions || []) {
    if (a === 'improve') add(TEXTS.improve, openExam, true);
    if (a === 'retry') add(TEXTS.retry, openExam, true);
    if (a === 'review') add(TEXTS.reviewStory, renderMap, false);
    if (a === 'repeat') add(TEXTS.repeatStory, onRepeat, true);
  }
  if (o.kind !== 'done' && !(o.actions || []).includes('review')) add(TEXTS.backToMap, renderMap, false);

  box.append(
    el('h1', { class: 'h1', text: 'Resultado del Reto Final' }),
    el(
      'div',
      { class: 'scores' },
      el('div', { class: 'score' }, el('span', { text: 'Nota de este envío' }), el('strong', { text: `${fb.attempt} / ${MAX_SCORE}` })),
      el('div', { class: `score score--best${o.kind === 'done' ? ' score--gold' : ''}` }, el('span', { text: 'Mejor nota' }), el('strong', { text: `${s.best} / ${MAX_SCORE}` })),
    ),
    el('p', { class: `message message--${o.kind}`, text: msg }),
    actions,
    el('h2', { class: 'h2', text: 'Revisa tus respuestas' }),
    el(
      'ol',
      { class: 'review' },
      QUESTIONS.map((q, i) => {
        const chosen = fb.answers[i];
        const ok = chosen === q.answer;
        return el(
          'li',
          { class: `review__item ${ok ? 'is-ok' : 'is-bad'}` },
          el('p', { class: 'review__q', text: q.q }),
          el('p', {}, el('span', { class: 'tag', text: ok ? 'Correcta' : 'Incorrecta' }), ` Tu respuesta: ${chosen}. ${q.options[chosen]}`),
          ok ? null : el('p', { text: `Respuesta correcta: ${q.answer}. ${q.options[q.answer]}` }),
          el('p', { class: 'review__fb', text: q.feedback }),
        );
      }),
    ),
  );
  show('screen-result');
  $('#main').focus();
}

// ---------- Inicio ----------

function logout() {
  closeBook();
  S = null;
  $('#who').textContent = '';
  renderWelcome();
}

function init() {
  document.title = TEXTS.title;
  $('#btn-start').addEventListener('click', openRegister);
  $('#btn-register-back').addEventListener('click', renderWelcome);
  $('#register-form').addEventListener('submit', onRegister);
  $('#dni').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
  });
  $('#logout').addEventListener('click', logout);
  $('#book-close').addEventListener('click', closeBook);
  $('#book-continue').addEventListener('click', onContinue);
  $('#book').addEventListener('close', onBookClosed);
  $('#book').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeBook();
  });
  $('#exam-form').addEventListener('change', onExamChange);
  $('#exam-form').addEventListener('submit', onExamSubmit);
  $('#btn-exam-back').addEventListener('click', renderMap);
  renderWelcome();
}

// ---------- Mapa provisional (se reemplaza por mapa_base.png) ----------

function provisionalArt() {
  const g = svg('g', { class: 'art' });
  const add = (tag, attrs) => {
    const n = svg(tag, attrs);
    g.append(n);
    return n;
  };
  add('rect', { x: 0, y: 0, width: MAP.width, height: MAP.height, fill: '#9ccb6a' });
  add('path', { d: 'M0 0 H1600 V300 C 1300 360, 1100 200, 800 260 C 500 320, 300 180, 0 260 Z', fill: '#86b85a' });
  // Río y laguna
  add('path', {
    d: 'M1600 60 C 1450 120, 1300 60, 1200 120 C 1100 180, 1180 300, 1250 360 C 1330 430, 1500 420, 1600 520',
    fill: 'none', stroke: '#5fa8d3', 'stroke-width': 46, 'stroke-linecap': 'round',
  });
  add('ellipse', { cx: 1250, cy: 470, rx: 210, ry: 120, fill: '#6fb7de', stroke: '#3f7fa8', 'stroke-width': 6 });
  add('path', { d: 'M1080 560 C 1150 600, 1340 610, 1420 560', fill: 'none', stroke: '#7a5532', 'stroke-width': 26, 'stroke-linecap': 'round' });
  add('path', { d: 'M1250 590 C 1240 700, 1350 800, 1600 860', fill: 'none', stroke: '#5fa8d3', 'stroke-width': 30, 'stroke-linecap': 'round' });
  // Casas
  const house = (x, y, s = 1) => {
    add('rect', { x: x - 34 * s, y: y - 20 * s, width: 68 * s, height: 46 * s, rx: 6, fill: '#c98b4f', stroke: '#4a2f1a', 'stroke-width': 4 });
    add('path', { d: `M${x - 46 * s} ${y - 16 * s} L${x} ${y - 58 * s} L${x + 46 * s} ${y - 16 * s} Z`, fill: '#8a4b2a', stroke: '#4a2f1a', 'stroke-width': 4, 'stroke-linejoin': 'round' });
  };
  house(1080, 700); house(1170, 760, 0.9); house(1400, 690, 0.85); house(480, 560, 0.9); house(560, 600, 0.8);
  // Árboles
  const tree = (x, y, s = 1) => {
    add('rect', { x: x - 6 * s, y: y, width: 12 * s, height: 30 * s, fill: '#6b4426' });
    add('circle', { cx: x, cy: y - 10 * s, r: 34 * s, fill: '#3f7f3a', stroke: '#24481f', 'stroke-width': 4 });
  };
  [[90, 120], [210, 90], [330, 140], [520, 110], [640, 150], [80, 420], [180, 520], [250, 360], [1500, 960], [1500, 300],
   [860, 940], [960, 900], [450, 950], [1540, 760], [130, 680], [600, 300], [880, 120], [1160, 920], [760, 620], [1260, 260]]
    .forEach(([x, y], i) => tree(x, y, 0.8 + (i % 3) * 0.15));
  add('text', { x: 800, y: 990, 'text-anchor': 'middle', class: 'art__note' }).textContent = 'Mapa provisional · se reemplaza por el mapa final de Drimer';
  return g;
}

init();
