(function () {
  'use strict';

  const core = window.TimerCore;
  const params = new URLSearchParams(location.search);
  // ?preview=1 é o iframe dentro do admin: mesma tela, sem pedir tela cheia/tela ligada.
  const isPreview = params.get('preview') === '1';

  const stage = document.getElementById('stage');
  const currentTitle = document.getElementById('current-title');
  const flowArrow = document.getElementById('flow-arrow');
  const nextTitle = document.getElementById('next-title');
  const clock = document.getElementById('clock');
  const statusEl = document.getElementById('status');
  const expiredBanner = document.getElementById('expired-banner');
  const messageBox = document.getElementById('message');
  const messageText = document.getElementById('message-text');
  const wakeHint = document.getElementById('wake-hint');
  const wakeStatus = document.getElementById('wake-status');
  const connStatus = document.getElementById('conn-status');

  let lastMessageId = null;
  let failingSince = null;
  let storageMissing = false;

  const sync = core.createSync({
    pollMs: 1500,
    onState: () => {
      storageMissing = false;
      render();
    },
    onOnline: () => {
      failingSince = null;
      connStatus.textContent = '';
    },
    onError: (err) => {
      if (err.code === 'storage_missing') storageMissing = true;
      if (!failingSince) failingSince = Date.now();
      // Uma falha isolada não assusta ninguém: só avisa se durar.
      if (Date.now() - failingSince > 5000) {
        connStatus.textContent = 'Sem conexão — mostrando o último tempo recebido';
      }
      render();
    },
  });

  function setText(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }

  function statusText(state, phase) {
    if (!state.steps.length) return 'Nenhuma atividade no roteiro ainda';
    if (state.running) return phase === 'expired' ? '' : '● Em andamento';
    if (state.elapsedBeforeMs === 0) return 'Aguardando início';
    return '❚❚ Pausado';
  }

  function render() {
    const state = sync.getState();
    if (!state) {
      if (storageMissing) {
        setText(currentTitle, 'Timer ainda não configurado');
        setText(clock, '--:--');
      }
      return;
    }

    const now = sync.now();
    const step = core.currentStep(state);
    const next = core.nextStep(state);
    const phase = core.phase(state, now);

    setText(currentTitle, step ? step.title : 'Sem atividade');
    flowArrow.hidden = !next;
    nextTitle.hidden = !next;
    setText(nextTitle, next ? `A seguir: ${next.title}` : '');
    const clockText = step ? core.formatClock(core.remainingMs(state, now)) : '--:--';
    setText(clock, clockText);
    // "1:02:05" é mais largo que "02:05": diminui pra não estourar a tela.
    stage.classList.toggle('has-hours', clockText.split(':').length === 3);

    stage.classList.toggle('is-warning', phase === 'warning');
    stage.classList.toggle('is-expired', phase === 'expired');
    stage.classList.toggle('is-paused', !state.running && state.steps.length > 0);
    document.body.classList.toggle('is-expired', phase === 'expired');
    expiredBanner.hidden = phase !== 'expired';
    setText(statusEl, statusText(state, phase));

    const msg = core.activeMessage(state, now);
    messageBox.hidden = !msg;
    stage.classList.toggle('has-message', Boolean(msg));
    if (msg && msg.id !== lastMessageId) {
      messageText.textContent = msg.text;
      // Reinicia o "piscar" de chegada a cada aviso novo.
      messageBox.classList.remove('is-new');
      void messageBox.offsetWidth;
      messageBox.classList.add('is-new');
    }
    lastMessageId = msg ? msg.id : null;
  }

  // ---------- Manter a tela ligada (Screen Wake Lock), como player de vídeo ----------

  let wakeLock = null;

  function setWakeStatus(on) {
    if (on) {
      wakeStatus.textContent = 'Tela sempre ligada';
      wakeHint.hidden = true;
    } else {
      // O próprio botão já avisa; não repete no rodapé.
      wakeStatus.textContent = '';
      wakeHint.hidden = false;
    }
  }

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) {
      wakeStatus.textContent = 'Este navegador não segura a tela ligada: ajuste o descanso de tela do aparelho';
      wakeHint.hidden = true;
      return;
    }
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      setWakeStatus(true);
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
        if (document.visibilityState === 'visible') setWakeStatus(false);
      });
    } catch {
      setWakeStatus(false);
    }
  }

  function setupWakeLock() {
    requestWakeLock();
    // O navegador solta o wake lock quando a aba some; pede de novo ao voltar.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !wakeLock) requestWakeLock();
    });
    wakeHint.addEventListener('click', async () => {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Sem tela cheia (ex.: iPhone) tudo bem, o importante é a tela ligada.
      }
      requestWakeLock();
    });
  }

  // Esconde o cursor parado em cima do relógio num notebook.
  let cursorTimer = null;
  document.addEventListener('mousemove', () => {
    document.body.classList.remove('hide-cursor');
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(() => document.body.classList.add('hide-cursor'), 3000);
  });

  if (isPreview) {
    document.body.classList.add('is-preview');
  } else {
    setupWakeLock();
  }

  sync.start();
  setInterval(render, 100);
})();
