'use strict';

const { ActionError, initialState, applyAction } = require('./_timer');
const { StoreNotConfiguredError, StoreError, getJSON, setJSON } = require('./_store');

const STATE_KEY = 'timekeeper:state';
// Estado é temporário: some sozinho uma semana depois da última mudança.
const STATE_TTL_SEC = 7 * 24 * 60 * 60;

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

async function loadState() {
  return (await getJSON(STATE_KEY)) || initialState();
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
