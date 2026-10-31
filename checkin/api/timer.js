'use strict';

const { ActionError, initialState, applyAction } = require('./_timer');
const { StoreNotConfiguredError, StoreError, getJSON, setJSON } = require('./_store');

const STATE_KEY = 'timekeeper:state';
// Estado é temporário: some sozinho 30 dias depois da última mudança
// (folga pra montar o roteiro bem antes do evento).
const STATE_TTL_SEC = 30 * 24 * 60 * 60;

function readBody(req) {
  // Na Vercel, req.body é um getter que lança erro com JSON malformado.
  let body;
  try {
    body = req.body;
  } catch {
    return {};
  }
  if (body && typeof body === 'object') return body;
  if (typeof body === 'string' && body.length) {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return {};
}

async function loadState() {
  const stored = await getJSON(STATE_KEY);
  const state = { ...initialState(), ...(stored && typeof stored === 'object' ? stored : {}) };
  if (!Array.isArray(state.steps)) state.steps = [];
  return state;
}

module.exports = async function handler(req, res) {
  // serverNow vai junto pra os clientes sincronizarem o relógio: nada de cache.
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const state = await loadState();
      res.status(200).json({ state, serverNow: Date.now() });
      return;
    }

    if (req.method === 'POST') {
      const current = await loadState();
      const now = Date.now();
      const state = applyAction(current, readBody(req), now);
      await setJSON(STATE_KEY, state, STATE_TTL_SEC);
      res.status(200).json({ state, serverNow: Date.now() });
      return;
    }

    res.status(405).json({ status: 'error', message: 'Método não permitido' });
  } catch (err) {
    if (err instanceof ActionError) {
      res.status(400).json({ status: 'invalid', message: err.message });
      return;
    }
    if (err instanceof StoreNotConfiguredError) {
      console.error('[timer]', err.message);
      res.status(500).json({ status: 'storage_missing', message: err.message });
      return;
    }
    if (err instanceof StoreError) {
      res.status(502).json({ status: 'error', message: err.message });
      return;
    }
    console.error('[timer] erro inesperado', err);
    res.status(500).json({ status: 'error', message: 'Erro inesperado' });
  }
};
