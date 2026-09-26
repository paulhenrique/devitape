(function () {
  'use strict';

  const EVENT_STORAGE_KEY = 'devitape:checkin:event';
  const POLL_INTERVAL_MS = 5000;
  const GOAL_RATIO = 0.6; // mesma proporção usada em api/status.js

  // Pilha: 3 cards legíveis na frente, o resto só com a bordinha aparecendo.
  // Geometria espelhada no height de .telao-stack em styles.css.
  const STACK_MAX = 8;
  const STACK_READABLE = 3;
  const STACK_GAP = 10;
  const STACK_EDGE_PEEK = 10;
  const STACK_SCALES = [1, 0.94, 0.88];
  const STACK_OPACITY = [1, 0.85, 0.68];

  const NEON_COLORS = ['#a855f7', '#3b82f6', '#ec4899', '#22d3ee', '#818cf8', '#f472b6'];
  const JOIN_PHRASES = ['chegou ao evento', 'entrou no rolê', 'checkou por aqui', 'tá dentro'];
  const DRIFTS = ['drift-a', 'drift-b', 'drift-c'];

  const qrContainer = document.getElementById('qr-container');
  const domainLabel = document.getElementById('domain-label');
  const eventNameEl = document.getElementById('event-name');
  const eventPicker = document.getElementById('event-picker');
  const eventPickerOptions = document.getElementById('event-picker-options');
  const floatLayer = document.getElementById('float-layer');
  const stackEl = document.getElementById('stack');
  const offlineBadge = document.getElementById('offline-badge');
  const progressPercentEl = document.getElementById('progress-percent');
  const progressLabelEl = document.getElementById('progress-label');
  const progressFillEl = document.getElementById('progress-fill');

  let currentEvent = null;
  let displayedPercent = 0;
  const stackCards = new Map();
  const floatCards = new Map();

  // FNV-1a + finalizador do murmur3: chaves parecidas ("id:1", "id:2"...)
  // precisam cair em posições bem diferentes na tela.
  function hashString(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }

  function initials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0][0] || '';
    const second = parts.length > 1 ? parts[1][0] : '';
    return (first + second).toUpperCase();
  }

  function neonColor(name) {
    return NEON_COLORS[hashString(name) % NEON_COLORS.length];
  }

  function rowKey(item) {
    return item.id != null ? `id:${item.id}` : `${item.name}__${item.time}`;
  }

  function makeAvatar(name) {
    const avatar = document.createElement('span');
    avatar.className = 'telao-avatar';
    avatar.textContent = initials(name);
    return avatar;
  }

  function renderQr() {
    const qr = qrcode(0, 'M');
    qr.addData(location.origin);
    qr.make();
    qrContainer.innerHTML = qr.createSvgTag({ scalable: true });
    domainLabel.textContent = location.host;
  }

  // ---------- Barra de progresso rumo à meta ----------

  function tweenPercent(from, to) {
    const duration = 700;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      progressPercentEl.textContent = `${Math.round(from + (to - from) * t)}%`;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function updateProgress(present, goal) {
    const ratio = present / (goal > 0 ? goal : 1);
    const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));

    tweenPercent(displayedPercent, pct);
    displayedPercent = pct;
    progressFillEl.style.width = `${pct}%`;
    progressFillEl.classList.toggle('is-empty', pct === 0);
    progressFillEl.classList.toggle('is-goal', ratio >= 1);
    progressLabelEl.textContent = ratio >= 1 ? 'Meta batida! Tamo voando 🚀' : 'rumo à meta de hoje';
  }

  // ---------- Pilha de cards (quem está chegando) ----------

  function createStackCard(item) {
    const color = neonColor(item.name);
    const card = document.createElement('div');
    card.className = 'telao-stack-card';
    card.style.setProperty('--neon', color);
    card.style.setProperty('--bubble-accent', color);

    const text = document.createElement('div');
    text.className = 'stack-text';

    const name = document.createElement('span');
    name.className = 'stack-name';
    name.textContent = item.name;

    const sub = document.createElement('span');
    sub.className = 'stack-sub';
    const dot = document.createElement('span');
    dot.className = 'telao-live-dot';
    const subFront = document.createElement('span');
    subFront.className = 'sub-front';
    subFront.textContent = 'acabou de chegar';
    const subDefault = document.createElement('span');
    subDefault.className = 'sub-default';
    subDefault.textContent = JOIN_PHRASES[hashString(item.name) % JOIN_PHRASES.length];
    sub.append(dot, subFront, subDefault);

    text.append(name, sub);

    const time = document.createElement('span');
    time.className = 'stack-time';
    time.textContent = item.time;

    card.append(makeAvatar(item.name), text, time);
    return card;
  }

  function stackScale(i) {
    return i < STACK_READABLE ? STACK_SCALES[i] : STACK_SCALES[2] - (i - 2) * 0.03;
  }

  function stackOpacity(i) {
    return i < STACK_READABLE ? STACK_OPACITY[i] : Math.max(0.25, 0.6 - (i - 3) * 0.08);
  }

  function layoutStack(keys) {
    const first = stackCards.get(keys[0]);
    if (!first) return;
    const h = first.offsetHeight;
    const y1 = h + STACK_GAP;
    const y2 = y1 + h * STACK_SCALES[1] + STACK_GAP;
    const bottom2 = y2 + h * STACK_SCALES[2];
    const readableY = [0, y1, y2];

    keys.forEach((key, i) => {
      const card = stackCards.get(key);
      const s = stackScale(i);
      const y = i < STACK_READABLE ? readableY[i] : bottom2 + (i - 2) * STACK_EDGE_PEEK - h * s;
      card.style.transform = `translateY(${y}px) scale(${s})`;
      card.style.opacity = String(stackOpacity(i));
      card.style.zIndex = String(100 - i);
      card.classList.toggle('is-front', i === 0);
      card.classList.toggle('is-edge', i >= STACK_READABLE);
    });
  }

  function updateStack(recent) {
    const items = recent.slice(0, STACK_MAX);
    const keys = items.map(rowKey);
    const keySet = new Set(keys);

    stackCards.forEach((card, key) => {
      if (keySet.has(key)) return;
      stackCards.delete(key);
      card.style.opacity = '0';
      setTimeout(() => card.remove(), 700);
    });

    items.forEach((item, i) => {
      const key = keys[i];
      if (stackCards.has(key)) return;
      const card = createStackCard(item);
      // Entra "caindo" de cima, na frente, e empurra os outros pra trás.
      card.style.transition = 'none';
      card.style.opacity = '0';
      card.style.transform = 'translateY(-28px) scale(1.05)';
      stackEl.appendChild(card);
      void card.offsetWidth;
      card.style.transition = '';
      stackCards.set(key, card);
    });

    layoutStack(keys);
  }

  // ---------- Cards neon flutuando no fundo ----------

  function createFloatCard(item, key) {
    const h = hashString(key);
    const color = neonColor(item.name);
    const card = document.createElement('div');
    card.className = 'telao-float-card';
    card.style.setProperty('--neon', color);
    card.style.setProperty('--bubble-accent', color);

    // Espalha pelas laterais pra não brigar com a coluna central.
    const onRight = (h & 1) === 1;
    const left = onRight ? 70 + ((h >>> 1) % 19) : 1 + ((h >>> 1) % 22);
    const top = 9 + ((h >>> 9) % 80);
    card.style.left = `${left}%`;
    card.style.top = `${top}%`;
    card.style.animationName = DRIFTS[h % DRIFTS.length];
    card.style.animationDuration = `${12 + (h % 10)}s`;
    card.style.animationDelay = `-${h % 12}s`;

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.name;

    card.append(makeAvatar(item.name), name);
    return card;
  }

  function updateFloaters(recent) {
    const keys = recent.map(rowKey);
    const keySet = new Set(keys);

    floatCards.forEach((card, key) => {
      if (keySet.has(key)) return;
      floatCards.delete(key);
      card.classList.remove('is-visible');
      setTimeout(() => card.remove(), 1200);
    });

    recent.forEach((item, i) => {
      const key = keys[i];
      if (floatCards.has(key)) return;
      const card = createFloatCard(item, key);
      floatLayer.appendChild(card);
      floatCards.set(key, card);
      requestAnimationFrame(() => card.classList.add('is-visible'));
    });
  }

  function applyData(data) {
    const recent = data.recent || [];
    updateStack(recent);
    updateFloaters(recent);

    const goal = data.goal || Math.max(1, Math.round((data.total || 0) * GOAL_RATIO));
    updateProgress(data.present || 0, goal);

    offlineBadge.classList.remove('is-visible');
  }

  function clearBoard() {
    stackCards.forEach((card) => card.remove());
    stackCards.clear();
    floatCards.forEach((card) => card.remove());
    floatCards.clear();
  }

  // ---------- Modo real: polling em /api/status ----------

  async function poll() {
    if (!currentEvent) return;
    try {
      const res = await fetch(`/api/status?event=${encodeURIComponent(currentEvent.id)}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('status not ok');
      applyData(await res.json());
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
      btn.textContent = event.name;
      if (event.startsAt) {
        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(
          new Date(event.startsAt)
        );
        btn.appendChild(meta);
      }
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
      return candidates.some((c) => String(c.id) === String(stored.id)) ? stored : null;
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

      if (candidates.length) renderEventPicker(candidates);
    } catch {
      offlineBadge.classList.add('is-visible');
    }
  }

  // ---------- Modo demo: ?demo=1 (com &total=N e &present=N opcionais) ----------

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
    let seq = 0;
    let autoTimer = null;

    function addArrival() {
      if (state.present >= state.total) return;
      state.present += 1;
      seq += 1;
      state.recent.unshift({
        id: seq,
        name: randomDemoName(),
        time: demoTimeFormatter.format(new Date()),
      });
      state.recent = state.recent.slice(0, 30);
      applyData(state);
    }

    function scheduleAuto() {
      clearTimeout(autoTimer);
      if (state.present >= state.total) return;
      autoTimer = setTimeout(() => {
        addArrival();
        scheduleAuto();
      }, 3500 + Math.random() * 4000);
    }

    function reset() {
      state.present = 0;
      state.recent = [];
      clearBoard();
      for (let i = 0; i < seed; i += 1) addArrival();
      scheduleAuto();
    }

    eventNameEl.textContent = `Demo · ${total} ingressos confirmados`;

    const panel = document.createElement('div');
    panel.className = 'telao-demo-panel';
    panel.innerHTML = `
      <p class="demo-label">Modo demo</p>
      <button type="button" data-action="add">➕ Simular chegada</button>
      <button type="button" class="secondary" data-action="burst">⚡ +10 de uma vez</button>
      <button type="button" class="secondary" data-action="reset">🔄 Reiniciar</button>
    `;
    panel.querySelector('[data-action="add"]').addEventListener('click', addArrival);
    panel.querySelector('[data-action="burst"]').addEventListener('click', () => {
      for (let i = 0; i < 10; i += 1) setTimeout(addArrival, i * 250);
    });
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
