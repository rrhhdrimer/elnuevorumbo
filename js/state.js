// Estado del participante y reglas del recorrido y del reto.
// Se guarda en localStorage, separado por versión de contenido y DNI.
// Las funciones de reglas son puras para poder probarlas sin interfaz.

import {
  CONTENT_VERSION,
  QUESTIONS,
  POINTS_PER_QUESTION,
  PASS_SCORE,
  MAX_SCORE,
  ATTEMPTS_PER_CYCLE,
} from './content.js';

const PREFIX = `teo:${CONTENT_VERSION}:`;
const LAST_KEY = `${PREFIX}ultimo-dni`;
const TOTAL = 6;

export const isValidDni = (dni) => /^\d{8}$/.test(dni);
export const cleanName = (name) => String(name || '').replace(/\s+/g, ' ').trim().slice(0, 100);

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function newState(dni, name) {
  return {
    dni,
    name,
    completed: 0, // momentos completados en el ciclo actual (0 a 6)
    position: 0, // parada donde está TEO (0 = inicio)
    maxCompleted: 0, // momentos únicos completados alguna vez (no se reduce al repetir)
    cycleOpen: false, // true cuando el ciclo actual ya habilitó sus oportunidades
    attemptsLeft: 0, // oportunidades restantes del ciclo actual
    best: null, // mejor nota conocida (null antes de rendir)
    lastFeedback: null, // única retroalimentación conservada
    pending: null, // única operación pendiente de sincronización
  };
}

export function loadState(dni) {
  const raw = safeGet(PREFIX + dni);
  if (!raw) return null;
  try {
    return { ...newState(dni, ''), ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function saveState(state) {
  safeSet(PREFIX + state.dni, JSON.stringify(state));
  safeSet(LAST_KEY, state.dni);
}

export const lastDni = () => safeGet(LAST_KEY) || '';

export const examDone = (s) => s.best === MAX_SCORE;
export const passed = (s) => s.best !== null && s.best >= PASS_SCORE;
export const canTakeExam = (s) => s.completed === TOTAL && s.cycleOpen && s.attemptsLeft > 0 && !examDone(s);
export const mustRepeat = (s) =>
  !examDone(s) && s.completed === TOTAL && s.cycleOpen && s.attemptsLeft === 0;

// Completa el momento n (1 a 6) con "Continuar recorrido". Revisar un momento ya completado no cambia nada.
export function completeMoment(s, n) {
  if (n !== s.completed + 1) return s;
  const next = { ...s, completed: n, position: n, maxCompleted: Math.max(s.maxCompleted, n) };
  if (n === TOTAL && !next.cycleOpen) {
    next.cycleOpen = true;
    next.attemptsLeft = ATTEMPTS_PER_CYCLE;
  }
  return next;
}

// Reinicia solo el ciclo de lectura y la posición. Conserva DNI, nombre, mejor nota y aprobación.
export function repeatStory(s) {
  return { ...s, completed: 0, position: 0, cycleOpen: false, attemptsLeft: 0 };
}

export function score(answers) {
  return QUESTIONS.reduce((acc, q, i) => acc + (answers[i] === q.answer ? POINTS_PER_QUESTION : 0), 0);
}

const opId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

// Combina con la operación pendiente: el servidor guarda máximos, así que basta enviar el mejor estado conocido.
export function withPending(s, answers) {
  const prev = s.pending;
  let keepAnswers = answers || (prev && prev.answers) || null;
  if (answers && prev && prev.answers && score(prev.answers) > score(answers)) keepAnswers = prev.answers;
  return {
    ...s,
    pending: { id: opId(), dni: s.dni, name: s.name, moments: s.maxCompleted, answers: keepAnswers },
  };
}

// Registra un envío del reto. Consume una oportunidad una sola vez por envío confirmado por el usuario.
export function submitExam(s, answers) {
  if (!canTakeExam(s)) return { state: s, result: null };
  const attempt = score(answers);
  const best = Math.max(s.best ?? 0, attempt);
  const result = {
    attempt,
    best,
    answers: [...answers],
  };
  let next = { ...s, best, attemptsLeft: s.attemptsLeft - 1, lastFeedback: result };
  next = withPending(next, answers);
  return { state: next, result };
}

// Mensaje y acciones de cierre según la mejor nota y las oportunidades restantes.
export function outcome(s) {
  if (examDone(s)) return { kind: 'done' };
  if (passed(s)) return { kind: 'passed', actions: s.attemptsLeft > 0 ? ['improve'] : ['repeat'] };
  if (s.attemptsLeft > 0) return { kind: 'retry', actions: ['retry', 'review'] };
  return { kind: 'out', actions: ['repeat'] };
}
