// Regras do timekeeper: estado puro + ações do admin. Sem I/O, fácil de testar.
'use strict';

const MAX_STEPS = 50;
const MAX_TITLE = 80;
const MAX_DURATION_SEC = 6 * 60 * 60;
const MAX_MESSAGE = 140;
const MAX_ADJUST_SEC = 60 * 60;

class ActionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ActionError';
  }
}

function initialState() {
  return {
    version: 0,
    steps: [],
    currentIndex: 0,
    running: false,
    startedAt: null,
    elapsedBeforeMs: 0,
    message: null,
    updatedAt: 0,
  };
}

function elapsedMs(state, now) {
  const live = state.running && state.startedAt ? now - state.startedAt : 0;
  return state.elapsedBeforeMs + live;
}

function normalizeSteps(raw) {
  if (!Array.isArray(raw)) throw new ActionError('O roteiro precisa ser uma lista de etapas');
  if (raw.length > MAX_STEPS) throw new ActionError(`No máximo ${MAX_STEPS} etapas`);
  const seen = new Set();
  return raw.map((step, i) => {
    const title = String((step && step.title) || '').trim().slice(0, MAX_TITLE);
    const durationSec = Math.round(Number(step && step.durationSec));
    if (!title) throw new ActionError(`A etapa ${i + 1} está sem nome`);
    if (!Number.isFinite(durationSec) || durationSec < 1 || durationSec > MAX_DURATION_SEC) {
      throw new ActionError(`A etapa ${i + 1} está com uma duração inválida`);
    }
    let id = step && typeof step.id === 'string' && /^[\w-]{1,40}$/.test(step.id) ? step.id : null;
    if (!id || seen.has(id)) id = `step-${i}-${Math.random().toString(36).slice(2, 8)}`;
    seen.add(id);
    return { id, title, durationSec };
  });
}

// Troca de etapa zera o tempo da etapa; se estava rodando, a nova já começa rodando.
function moveTo(s, index, now) {
  s.currentIndex = index;
  s.elapsedBeforeMs = 0;
  s.startedAt = s.running ? now : null;
}

function applyAction(state, payload, now) {
  const s = { ...state };
  const action = payload && payload.action;

  switch (action) {
    case 'setSteps': {
      const steps = normalizeSteps(payload.steps);
      const current = s.steps[s.currentIndex];
      const keptIndex = current ? steps.findIndex((step) => step.id === current.id) : -1;
      s.steps = steps;
      if (keptIndex >= 0) {
        // A etapa atual continua no roteiro: mantém o tempo correndo, só ajusta a posição.
        s.currentIndex = keptIndex;
      } else {
        s.currentIndex = Math.max(0, Math.min(s.currentIndex, steps.length - 1));
        s.elapsedBeforeMs = 0;
        s.running = false;
        s.startedAt = null;
      }
      break;
    }

    case 'play':
      if (!s.steps.length) throw new ActionError('Cadastre pelo menos uma etapa antes de dar play');
      if (!s.running) {
        s.running = true;
        s.startedAt = now;
      }
      break;

    case 'pause':
      if (s.running) {
        s.elapsedBeforeMs = elapsedMs(s, now);
        s.running = false;
        s.startedAt = null;
      }
      break;

    case 'resetStep':
      s.elapsedBeforeMs = 0;
      s.startedAt = s.running ? now : null;
      break;

    case 'goto': {
      const index = Number(payload.index);
      if (!Number.isInteger(index) || index < 0 || index >= s.steps.length) {
        throw new ActionError('Essa etapa não existe');
      }
      moveTo(s, index, now);
      break;
    }

    case 'next':
      if (s.currentIndex < s.steps.length - 1) moveTo(s, s.currentIndex + 1, now);
      break;

    case 'prev':
      if (s.currentIndex > 0) moveTo(s, s.currentIndex - 1, now);
      break;

    case 'adjust': {
      const deltaSec = Number(payload.deltaSec);
      if (!Number.isInteger(deltaSec) || deltaSec === 0 || Math.abs(deltaSec) > MAX_ADJUST_SEC) {
        throw new ActionError('Ajuste de tempo inválido');
      }
      if (!s.steps.length) throw new ActionError('Não há etapa para ajustar');
      // Dar mais tempo = "desconta" tempo já corrido.
      s.elapsedBeforeMs -= deltaSec * 1000;
      break;
    }

    case 'notify': {
      const text = String(payload.text || '').trim().slice(0, MAX_MESSAGE);
      if (!text) throw new ActionError('Escreva o aviso antes de enviar');
      s.message = { id: `m${now.toString(36)}`, text, at: now };
      break;
    }

    case 'clearMessage':
      s.message = null;
      break;

    default:
      throw new ActionError('Ação desconhecida');
  }

  s.version = (state.version || 0) + 1;
  s.updatedAt = now;
  return s;
}

module.exports = { ActionError, initialState, elapsedMs, applyAction };
