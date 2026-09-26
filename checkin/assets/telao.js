(function () {
  'use strict';

  const EVENT_STORAGE_KEY = 'devitape:checkin:event';
  const POLL_INTERVAL_MS = 5000;
  const GOAL_RATIO = 0.6; // mesma proporção usada em api/status.js

  const AVATAR_COLORS = ['#a855f7', '#3b82f6', '#ec4899', '#22d3ee', '#818cf8', '#f472b6'];

  const qrContainer = document.getElementById('qr-container');
  const domainLabel = document.getElementById('domain-label');
  const eventNameEl = document.getElementById('event-name');
  const eventPicker = document.getElementById('event-picker');
  const eventPickerOptions = document.getElementById('event-picker-options');
  const spotlightEl = document.getElementById('spotlight');
  const spotlightAvatar = document.getElementById('spotlight-avatar');
  const spotlightName = document.getElementById('spotlight-name');
  const bubblesEl = document.getElementById('bubbles');
  const offlineBadge = document.getElementById('offline-badge');
  const progressWrap = document.querySelector('.telao-progress-wrap');
  const progressPercentEl = document.getElementById('progress-percent');
  const progressLabelEl = document.getElementById('progress-label');
  const progressFillEl = document.getElementById('progress-fill');

  let currentEvent = null;
  let lastSpotlightKey = null;
  let displayedPercent = 0;
  const bubbleEls = new Map();

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function initials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0][0] || '';
    const second = parts.length > 1 ? parts[1][0] : '';
    return (first + second).toUpperCase();
  }

  function avatarColor(name) {
    return AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];
  }

  function rowKey(item) {
    return `${item.name}__${item.time}`;
  }

  function renderQr() {
    const qr = qrcode(0, 'M');
    qr.addData(location.origin);
    qr.make();
    qrContainer.innerHTML = qr.createSvgTag({ scalable: true });
    domainLabel.textContent = location.host;
  }

  // ---------- Progresso rumo à meta ----------

  function tweenPercent(from, to) {
    const duration = 500;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const value = Math.round(from + (to - from) * t);
      progressPercentEl.textContent = `${value}%`;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function updateProgress(present, goal) {
    const safeGoal = goal > 0 ? goal : 1;
    const ratio = present / safeGoal;
    const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));

    tweenPercent(displayedPercent, pct);
    displayedPercent = pct;
    progressFillEl.style.width = `${pct}%`;

    if (ratio >= 1) {
      progressWrap.style.setProperty('--progress-color', 'linear-gradient(135deg, #22c55e, #facc15)');
      progressLabelEl.textContent = 'Meta batida! 🚀';
    } else {
      progressWrap.style.removeProperty('--progress-color');
      progressLabelEl.textContent = 'rumo à meta de hoje';
    }
  }

  // ---------- Destaque + bolinhas flutuantes ----------

  function updateSpotlight(top) {
    if (!top) {
      spotlightEl.hidden = true;
      lastSpotlightKey = null;
      return;
    }
    const key = rowKey(top);
    spotlightAvatar.textContent = initials(top.name);
    spotlightAvatar.style.setProperty('--bubble-accent', avatarColor(top.name));
    spotlightName.textContent = top.name;
    spotlightEl.hidden = false;

    if (key !== lastSpotlightKey) {
      spotlightEl.classList.remove('is-entering');
      void spotlightEl.offsetWidth;
      spotlightEl.classList.add('is-entering');
      lastSpotlightKey = key;
    }
  }

  function updateBubbles(rest) {
    const nextKeys = new Set(rest.map(rowKey));

    bubbleEls.forEach((el, key) => {
      if (!nextKeys.has(key)) {
        el.remove();
        bubbleEls.delete(key);
      }
    });

    rest.forEach((item) => {
      const key = rowKey(item);
      if (bubbleEls.has(key)) return;
      const bubble = document.createElement('span');
      bubble.className = 'telao-avatar telao-bubble';
      bubble.textContent = initials(item.name);
      bubble.title = item.name;
      bubble.style.setProperty('--bubble-accent', avatarColor(item.name));
      bubble.style.animationDuration = `${6 + (hashString(item.name) % 5)}s`;
      bubble.style.animationDelay = `-${hashString(item.name) % 6}s`;
      bubblesEl.appendChild(bubble);
      bubbleEls.set(key, bubble);
    });
  }

  function applyData(data) {
    const recent = data.recent || [];
    const [top, ...rest] = recent;
    updateSpotlight(top);
    updateBubbles(rest);

    const goal = data.goal || Math.max(1, Math.round((data.total || 0) * GOAL_RATIO));
    updateProgress(data.present || 0, goal);

    offlineBadge.classList.remove('is-visible');
  }

  // ---------- Modo real: polling em /api/status ----------

  async function poll() {
    if (!currentEvent) return;
    try {
      const res = await fetch(`/api/status?event=${encodeURIComponent(currentEvent.id)}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('status not ok');
      const data = await res.json();
      applyData(data);
    } catch {
      offlineBadge.classList.add('is-visible');
    }
  }

  function startPolling() {
    poll();
    setInterval(poll, POLL_INTERVAL_MS);
  }

  function setEvent(event) {
    currentEvent = event;
    try {
      localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(event));
    } catch {
      // localStorage indisponível — segue sem persistir.
    }
    eventNameEl.textContent = event.name || '';
    eventPicker.hidden = true;
    startPolling();
  }

  function renderEventPicker(candidates) {
    eventPickerOptions.innerHTML = '';
    candidates.forEach((event) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'checkin-picker-option';
      const dateLabel = event.startsAt
        ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date(event.startsAt))
        : '';
      btn.innerHTML = `${event.name}${dateLabel ? `<span class="meta">${dateLabel}</span>` : ''}`;
      btn.addEventListener('click', () => setEvent(event));
      eventPickerOptions.appendChild(btn);
    });
    eventPicker.hidden = false;
  }

  function loadStoredEvent(candidates) {
    try {
      const raw = localStorage.getItem(EVENT_STORAGE_KEY);
      if (!raw) return null;
      const stored = JSON.parse(raw);
      if (candidates.some((c) => String(c.id) === String(stored.id))) return stored;
      return null;
    } catch {
      return null;
    }
  }

  async function initEvent() {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();

      if (data.resolved) {
        setEvent(data.resolved);
        return;
      }

      const candidates = data.candidates || [];
      const stored = loadStoredEvent(candidates);
      if (stored) {
        setEvent(stored);
        return;
      }

      if (candidates.length) {
        renderEventPicker(candidates);
      }
    } catch {
      offlineBadge.classList.add('is-visible');
    }
  }

  // ---------- Modo demo: ?demo=1 (com &total=N opcional) ----------

  const DEMO_FIRST_NAMES = [
    'Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Henrique',
    'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Otávio', 'Paula',
    'Rafael', 'Sabrina', 'Thiago', 'Vitória',
  ];
  const DEMO_LAST_NAMES = [
    'Souza', 'Lima', 'Nogueira', 'Santos', 'Oliveira', 'Costa', 'Pereira',
    'Almeida', 'Ribeiro', 'Carvalho', 'Gomes', 'Barbosa',
  ];

  const demoTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  });

  function randomDemoName() {
    const first = DEMO_FIRST_NAMES[Math.floor(Math.random() * DEMO_FIRST_NAMES.length)];
    const last = DEMO_LAST_NAMES[Math.floor(Math.random() * DEMO_LAST_NAMES.length)];
    return `${first} ${last[0]}.`;
  }

  function initDemo(params) {
    const total = Number(params.get('total')) || 80;
    const goal = Math.max(1, Math.round(total * GOAL_RATIO));
    const seed = Math.min(total, Number(params.get('present')) || 6);

    const state = { present: 0, total, goal, recent: [] };

    function addArrival() {
      if (state.present >= state.total) return;
      state.present += 1;
      state.recent.unshift({ name: randomDemoName(), time: demoTimeFormatter.format(new Date()) });
      state.recent = state.recent.slice(0, 30);
      applyData(state);
    }

    function reset() {
      state.present = 0;
      state.recent = [];
      lastSpotlightKey = null;
      bubbleEls.forEach((el) => el.remove());
      bubbleEls.clear();
      for (let i = 0; i < seed; i += 1) addArrival();
      scheduleAuto();
    }

    let autoTimer = null;
    function scheduleAuto() {
      if (autoTimer) clearTimeout(autoTimer);
      if (state.present >= state.total) return;
      autoTimer = setTimeout(() => {
        addArrival();
        scheduleAuto();
      }, 4000 + Math.random() * 4000);
    }

    eventNameEl.textContent = `Demo · ${total} ingressos confirmados`;

    const panel = document.createElement('div');
    panel.className = 'telao-demo-panel';
    panel.innerHTML = `
      <p class="demo-label">Modo demo</p>
      <button type="button" data-action="add">➕ Simular chegada</button>
      <button type="button" class="secondary" data-action="reset">🔄 Reiniciar</button>
    `;
    panel.querySelector('[data-action="add"]').addEventListener('click', addArrival);
    panel.querySelector('[data-action="reset"]').addEventListener('click', reset);
    document.body.appendChild(panel);

    reset();
  }

  renderQr();

  const params = new URLSearchParams(location.search);
  if (params.get('demo')) {
    initDemo(params);
  } else {
    initEvent();
  }
})();
