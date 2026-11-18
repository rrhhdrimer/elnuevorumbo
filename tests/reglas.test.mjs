// Pruebas de reglas: node tests/reglas.test.mjs
import assert from 'node:assert/strict';
import { newState, completeMoment, repeatStory, submitExam, canTakeExam, mustRepeat, outcome, score } from '../js/state.js';
import { QUESTIONS } from '../js/content.js';

const key = QUESTIONS.map((q) => q.answer);
const withCorrect = (k) => key.map((a, i) => (i < k ? a : a === 'A' ? 'B' : 'A'));
const readAll = (s) => { for (let n = 1; n <= 6; n++) s = completeMoment(s, n); return s; };

for (let k = 0; k <= 5; k++) assert.equal(score(withCorrect(k)), k * 4);

let s = newState('01234567', 'Ana');
assert.equal(canTakeExam(s), false);
s = completeMoment(s, 2); assert.equal(s.completed, 0, 'no se salta momentos');
s = completeMoment(s, 1); s = completeMoment(s, 1); assert.equal(s.completed, 1, 'revisar no duplica');
s = readAll(s); assert.equal(canTakeExam(s), true); assert.equal(s.attemptsLeft, 3);

// 12 -> 16 -> 12
for (const k of [3, 4, 3]) s = submitExam(s, withCorrect(k)).state;
assert.equal(s.best, 16); assert.equal(s.attemptsLeft, 0); assert.equal(canTakeExam(s), false);
assert.equal(mustRepeat(s), true); assert.deepEqual(outcome(s), { kind: 'passed', actions: ['repeat'] });
assert.equal(submitExam(s, withCorrect(5)).result, null, 'bloqueado tras tres');
s = repeatStory(s); assert.equal(s.best, 16); assert.equal(s.maxCompleted, 6); assert.equal(canTakeExam(s), false);
s = readAll(s); assert.equal(s.attemptsLeft, 3);
s = submitExam(s, withCorrect(2)).state; assert.equal(s.best, 16, 'no baja la mejor nota');
assert.deepEqual(outcome(s), { kind: 'passed', actions: ['improve'] });

// 8 -> 20
let t = readAll(newState('00000001', 'Luis'));
t = submitExam(t, withCorrect(2)).state; assert.deepEqual(outcome(t), { kind: 'retry', actions: ['retry', 'review'] });
t = submitExam(t, withCorrect(5)).state; assert.equal(t.best, 20); assert.equal(canTakeExam(t), false);
assert.equal(outcome(t).kind, 'done'); assert.equal(mustRepeat(t), false);

// tres notas < 16
let u = readAll(newState('00000002', 'Eva'));
for (const k of [1, 2, 3]) u = submitExam(u, withCorrect(k)).state;
assert.deepEqual(outcome(u), { kind: 'out', actions: ['repeat'] });

// operación pendiente conserva las mejores respuestas
assert.equal(score(s.pending.answers), 16);
console.log('OK: reglas del recorrido y del reto');
