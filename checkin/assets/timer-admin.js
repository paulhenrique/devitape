(function () {
  'use strict';

  const core = window.TimerCore;

  const $ = (id) => document.getElementById(id);
  const conn = $('conn');
  const setupAlert = $('setup-alert');
  const toast = $('toast');
  const nowTitle = $('now-title');
  const nowNext = $('now-next');
  const nowClock = $('now-clock');
  const nowStatus = $('now-status');
  const playToggle = $('play-toggle');
  const notifyForm = $('notify-form');
  const notifyInput = $('notify-input');
  const activeMessage = $('active-message');
  const activeMessageText = $('active-message-text');
  const activeMessageLeft = $('active-message-left');
  const stepsList = $('steps-list');
  const stepsEmpty = $('steps-empty');
  const stepsDirty = $('steps-dirty');
  const saveSteps = $('save-steps');
  const discardSteps = $('discard-steps');
  const previewBox = $('preview-box');
  const preview = $('preview');

  // Rascunho do roteiro: o admin edita aqui e só manda pro servidor ao salvar,
  // pra o polling não apagar o que está sendo digitado.
  let draft = [];
  let dirty = false;
  let lastServerSteps = '';
  let busy = false;

  const sync = core.createSync({
    pollMs: 2000,
    hiddenPollMs: 10000,
    onState: onState,
    onOnline: () => {
      conn.textContent = '● conectado';
      conn.className = 'tka-conn is-ok';
      setupAlert.hidden = true;
    },
    onError: (err) => {
      conn.textContent = '● sem conexão';
      conn.className = 'tka-conn is-error';
      if (err.code === 'storage_missing') setupAlert.hidden = false;
    },
  });

  function setText(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }

  function showToast(text) {
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.hidden = true;
    }, 4000);
  }

  async function send(payload) {
    if (busy) return null;
    busy = true;
    document.body.classList.add('is-busy');
    try {
      return await sync.send(payload);
    } catch (err) {
      if (err.code === 'storage_missing') setupAlert.hidden = false;
      showToast(err.message || 'Não deu certo, tente de novo');
      return null;
    } finally {
      busy = false;
      document.body.classList.remove('is-busy');
    }
  }

  // ---------- Painel "Agora" ----------

  function renderNow() {
    const state = sync.getState();
    if (!state) return;
    const now = sync.now();
    const step = core.currentStep(state);
    const next = core.nextStep(state);
    const phase = core.phase(state, now);

    setText(nowTitle, step ? step.title : 'Nenhuma etapa');
    setText(nowNext, next ? `A seguir: ${next.title}` : step ? 'Última etapa do roteiro' : '');
    setText(nowClock, step ? core.formatClock(core.remainingMs(state, now)) : '--:--');
    nowClock.dataset.phase = phase;

    let status = 'Aguardando início';
    if (!step) status = 'Monte o roteiro abaixo e salve';
    else if (state.running) status = phase === 'expired' ? 'Tempo encerrado — contando o excedente' : 'Rodando';
    else if (state.elapsedBeforeMs !== 0) status = 'Pausado';
    setText(nowStatus, status);

    setText(playToggle, state.running ? '❚❚ Pausar' : '▶ Play');
    playToggle.disabled = !step;
    document.querySelector('[data-action="prev"]').disabled = state.currentIndex <= 0;
    document.querySelector('[data-action="next"]').disabled = state.currentIndex >= state.steps.length - 1;

    const msg = core.activeMessage(state, now);
    activeMessage.hidden = !msg;
    if (msg) {
      setText(activeMessageText, msg.text);
      const left = Math.ceil((core.MESSAGE_VISIBLE_MS - (now - msg.at)) / 1000);
      setText(activeMessageLeft, `(some em ${left}s)`);
    }
  }

  playToggle.addEventListener('click', () => {
    const state = sync.getState();
    if (state) send({ action: state.running ? 'pause' : 'play' });
  });

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => send({ action: btn.dataset.action }));
  });

  document.querySelectorAll('[data-adjust]').forEach((btn) => {
    btn.addEventListener('click', () => send({ action: 'adjust', deltaSec: Number(btn.dataset.adjust) }));
  });

  // ---------- Avisos ----------

  async function notify(text) {
    const ok = await send({ action: 'notify', text });
    if (ok) showToast('Aviso enviado pro apresentador');
    return ok;
  }

  document.querySelectorAll('[data-text]').forEach((chip) => {
    chip.addEventListener('click', () => notify(chip.dataset.text));
  });

  notifyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = notifyInput.value.trim();
    if (!text) return;
    if (await notify(text)) notifyInput.value = '';
  });

  $('clear-message').addEventListener('click', () => send({ action: 'clearMessage' }));

  // ---------- Roteiro ----------

  function newId() {
    return `step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function fromServer(steps) {
    return steps.map((s) => ({ id: s.id, title: s.title, minutes: s.durationSec / 60 }));
  }

  function setDirty(value) {
    dirty = value;
    stepsDirty.hidden = !dirty;
    saveSteps.disabled = !dirty;
    discardSteps.disabled = !dirty;
    stepsList.classList.toggle('is-dirty', dirty);
  }

  function iconButton(label, title, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tka-icon-btn';
    btn.textContent = label;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.addEventListener('click', onClick);
    return btn;
  }

  function renderSteps() {
    const state = sync.getState();
    stepsList.innerHTML = '';
    stepsEmpty.hidden = draft.length > 0;

    draft.forEach((step, index) => {
      const li = document.createElement('li');
      li.className = 'tka-step';
      li.dataset.index = String(index);

      const go = iconButton('▶', 'Ir para esta etapa', () => {
        if (dirty) {
          showToast('Salve o roteiro antes de trocar de etapa');
          return;
        }
        send({ action: 'goto', index });
      });
      go.classList.add('tka-step-go');

      const title = document.createElement('input');
      title.className = 'tka-step-title';
      title.type = 'text';
      title.maxLength = 80;
      title.value = step.title;
      title.placeholder = 'Nome da etapa';
      title.setAttribute('aria-label', `Nome da etapa ${index + 1}`);
      title.addEventListener('input', () => {
        step.title = title.value;
        setDirty(true);
      });

      const minutes = document.createElement('input');
      minutes.className = 'tka-step-min';
      minutes.type = 'number';
      minutes.min = '0.5';
      minutes.step = '0.5';
      minutes.value = String(step.minutes);
      minutes.setAttribute('aria-label', `Minutos da etapa ${index + 1}`);
      minutes.addEventListener('input', () => {
        step.minutes = Number(minutes.value);
        setDirty(true);
      });

      const unit = document.createElement('span');
      unit.className = 'tka-muted';
      unit.textContent = 'min';

      const up = iconButton('↑', 'Subir', () => move(index, -1));
      up.disabled = index === 0;
      const down = iconButton('↓', 'Descer', () => move(index, 1));
      down.disabled = index === draft.length - 1;
      const remove = iconButton('✕', 'Remover etapa', () => {
        draft.splice(index, 1);
        setDirty(true);
        renderSteps();
      });

      li.append(go, title, minutes, unit, up, down, remove);
      stepsList.appendChild(li);
    });

    highlightCurrent(state);
  }

  function highlightCurrent(state) {
    const current = state && core.currentStep(state);
    stepsList.querySelectorAll('.tka-step').forEach((li) => {
      const step = draft[Number(li.dataset.index)];
      li.classList.toggle('is-current', Boolean(current && step && step.id === current.id));
    });
  }

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= draft.length) return;
    [draft[index], draft[target]] = [draft[target], draft[index]];
    setDirty(true);
    renderSteps();
  }

  $('add-step').addEventListener('click', () => {
    draft.push({ id: newId(), title: '', minutes: 10 });
    setDirty(true);
    renderSteps();
    const inputs = stepsList.querySelectorAll('.tka-step-title');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  discardSteps.addEventListener('click', () => {
    const state = sync.getState();
    draft = fromServer(state ? state.steps : []);
    setDirty(false);
    renderSteps();
  });

  saveSteps.addEventListener('click', async () => {
    const invalid = draft.findIndex((s) => !s.title.trim() || !(s.minutes > 0));
    if (invalid >= 0) {
      showToast(`Confira a etapa ${invalid + 1}: precisa de nome e duração`);
      return;
    }
    const steps = draft.map((s) => ({
      id: s.id,
      title: s.title.trim(),
      durationSec: Math.max(1, Math.round(s.minutes * 60)),
    }));
    const state = await send({ action: 'setSteps', steps });
    if (state) {
      setDirty(false);
      lastServerSteps = '';
      onState(state);
      showToast('Roteiro salvo');
    }
  });

  function onState(state) {
    const serverSteps = JSON.stringify(state.steps);
    if (!dirty && serverSteps !== lastServerSteps) {
      draft = fromServer(state.steps);
      lastServerSteps = serverSteps;
      renderSteps();
    } else {
      highlightCurrent(state);
    }
    renderNow();
  }

  // ---------- Link e prévia ----------

  const presenterUrl = `${location.origin}/timer`;
  const presenterLink = $('presenter-link');
  presenterLink.href = presenterUrl;
  presenterLink.textContent = presenterUrl.replace(/^https?:\/\//, '');

  $('copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(presenterUrl);
      showToast('Link copiado');
    } catch {
      showToast(presenterUrl);
    }
  });

  // A prévia é a tela real do apresentador em 1280×720, reduzida pra caber no card.
  function scalePreview() {
    preview.style.transform = `scale(${previewBox.clientWidth / 1280})`;
  }
  new ResizeObserver(scalePreview).observe(previewBox);
  scalePreview();

  window.addEventListener('beforeunload', (event) => {
    if (dirty) event.preventDefault();
  });

  sync.start();
  setInterval(renderNow, 100);
})();
