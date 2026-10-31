// Núcleo compartilhado entre o admin e a tela do apresentador: cálculo do
// tempo restante, formatação do relógio e sincronização com /api/timer.
(function (root) {
  'use strict';

  // Por quanto tempo um aviso do admin fica na tela do apresentador.
  const MESSAGE_VISIBLE_MS = 60 * 1000;
  // Abaixo disso o relógio fica amarelo (antes do vermelho de tempo esgotado).
  const WARNING_MS = 60 * 1000;

  function currentStep(state) {
    return (state && state.steps[state.currentIndex]) || null;
  }

  function nextStep(state) {
    return (state && state.steps[state.currentIndex + 1]) || null;
  }

  function elapsedMs(state, now) {
    const live = state.running && state.startedAt ? now - state.startedAt : 0;
    return state.elapsedBeforeMs + live;
  }

  function remainingMs(state, now) {
    const step = currentStep(state);
    if (!step) return null;
    return step.durationSec * 1000 - elapsedMs(state, now);
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  // Positivo arredonda pra cima (10:00 no começo, 00:00 só quando acaba);
  // negativo conta pra baixo a partir de -00:01 depois do primeiro segundo estourado.
  function formatClock(ms) {
    const totalSec = ms > 0 ? Math.ceil(ms / 1000) : Math.floor(-ms / 1000);
    const negative = ms <= 0 && totalSec > 0;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const body = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    return negative ? `-${body}` : body;
  }

  function phase(state, now) {
    const ms = remainingMs(state, now);
    if (ms === null) return 'empty';
    if (ms <= 0) return 'expired';
    if (ms <= WARNING_MS) return 'warning';
    return 'normal';
  }

  function activeMessage(state, now) {
    const msg = state && state.message;
    if (!msg) return null;
    return now - msg.at < MESSAGE_VISIBLE_MS ? msg : null;
  }

  function formatDuration(sec) {
    const min = sec / 60;
    return Number.isInteger(min) ? `${min} min` : `${min.toFixed(1).replace('.', ',')} min`;
  }

  // Polling em /api/timer com correção do relógio local pelo horário do
  // servidor (amostra com menor ida-e-volta), pra todo mundo ver o mesmo tempo.
  function createSync(options) {
    const pollMs = options.pollMs || 1500;
    const hiddenPollMs = options.hiddenPollMs || pollMs;
    let offset = 0;
    let samples = [];
    let state = null;
    let timer = null;
    let seq = 0;
    let appliedSeq = 0;

    function recordClock(serverNow, sentAt, receivedAt) {
      if (typeof serverNow !== 'number') return;
      const rtt = receivedAt - sentAt;
      samples.push({ rtt, offset: serverNow + rtt / 2 - receivedAt });
      if (samples.length > 8) samples = samples.slice(-8);
      offset = samples.reduce((best, s) => (s.rtt < best.rtt ? s : best)).offset;
    }

    async function request(init) {
      const mySeq = (seq += 1);
      const sentAt = Date.now();
      const res = await fetch('/api/timer', { cache: 'no-store', ...init });
      const receivedAt = Date.now();
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        const err = new Error(data.message || 'Falha ao falar com o servidor');
        err.status = res.status;
        err.code = data.status;
        throw err;
      }
      recordClock(data.serverNow, sentAt, receivedAt);
      // Uma leitura que saiu antes de uma ação e chegou depois não pode desfazer a ação na tela.
      if (mySeq > appliedSeq) {
        appliedSeq = mySeq;
        state = data.state;
        options.onState(state);
      }
      return state;
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(poll, document.hidden ? hiddenPollMs : pollMs);
    }

    async function poll() {
      try {
        await request();
        if (options.onOnline) options.onOnline();
      } catch (err) {
        if (options.onError) options.onError(err);
      } finally {
        schedule();
      }
    }

    return {
      start: poll,
      now: () => Date.now() + offset,
      getState: () => state,
      send(payload) {
        return request({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      },
    };
  }

  const api = {
    MESSAGE_VISIBLE_MS,
    currentStep,
    nextStep,
    remainingMs,
    formatClock,
    formatDuration,
    phase,
    activeMessage,
    createSync,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TimerCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
