// Sincronización con Google Apps Script.
// Una sola operación pendiente por participante; se reintenta la misma hasta recibir confirmación.
// Se envía como text/plain para evitar la verificación previa (preflight) y poder leer la respuesta real.

import { API_URL } from './content.js';

let inFlight = null;
let retryTimer = null;
let retryDelay = 4000;

export const apiConfigured = () => Boolean(API_URL);

async function post(op) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(op),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data || data.ok !== true || data.id !== op.id) throw new Error((data && data.error) || 'Respuesta no válida');
  return data;
}

// getState devuelve el estado actual; onSaved recibe la operación confirmada y la respuesta del servidor.
export function flush(getState, onSaved, onStatus) {
  const s = getState();
  if (!s || !s.pending) {
    onStatus('saved');
    return;
  }
  if (!apiConfigured()) {
    onStatus('pending');
    return;
  }
  if (inFlight) return;
  const op = s.pending;
  onStatus('saving');
  inFlight = post(op)
    .then((data) => {
      retryDelay = 4000;
      onSaved(op, data);
    })
    .catch(() => {
      onStatus('pending');
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => flush(getState, onSaved, onStatus), retryDelay);
      retryDelay = Math.min(retryDelay * 2, 60000);
    })
    .finally(() => {
      inFlight = null;
      const cur = getState();
      // Si mientras tanto se generó una operación nueva, se envía enseguida.
      if (cur && cur.pending && cur.pending.id !== op.id) flush(getState, onSaved, onStatus);
    });
}
