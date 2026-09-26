(function () {
  'use strict';

  const qrContainer = document.getElementById('qr-container');
  const domainLabel = document.getElementById('domain-label');
  const presentEl = document.getElementById('present-count');
  const totalEl = document.getElementById('total-count');
  const listEl = document.getElementById('telao-list');
  const offlineBadge = document.getElementById('offline-badge');

  const POLL_INTERVAL_MS = 5000;

  const AVATAR_COLORS = ['#f2b134', '#6fcf97', '#56ccf2', '#f2994a', '#bb6bd9', '#eb5757'];
  const JOIN_PHRASES = ['chegou ao evento', 'entrou no rolê', 'checkou por aqui', 'tá dentro'];

  let knownKeys = new Set();
  let firstLoad = true;
  let lastPresent = null;

  function renderQr() {
    const qr = qrcode(0, 'M');
    qr.addData(location.origin);
    qr.make();
    qrContainer.innerHTML = qr.createSvgTag({ scalable: true });
    domainLabel.textContent = location.host;
  }

  function rowKey(item) {
    return `${item.name}__${item.time}`;
  }

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
    const idx = hashString(name) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  }

  function joinPhrase(name) {
    const idx = hashString(name) % JOIN_PHRASES.length;
    return JOIN_PHRASES[idx];
  }

  function bumpCounter() {
    presentEl.classList.remove('is-bump');
    // força reflow para permitir reiniciar a animação
    void presentEl.offsetWidth;
    presentEl.classList.add('is-bump');
  }

  function render(data) {
    const present = data.present || 0;
    presentEl.textContent = present;
    totalEl.textContent = data.total || 0;

    if (lastPresent !== null && present > lastPresent) {
      bumpCounter();
    }
    lastPresent = present;

    const nextKeys = new Set((data.recent || []).map(rowKey));
    listEl.innerHTML = '';

    (data.recent || []).forEach((item) => {
      const key = rowKey(item);
      const color = avatarColor(item.name);

      const li = document.createElement('li');
      li.className = 'telao-row';
      li.style.setProperty('--row-accent', color);
      if (!firstLoad && !knownKeys.has(key)) {
        li.classList.add('is-entering');
      }

      const avatar = document.createElement('span');
      avatar.className = 'telao-avatar';
      avatar.textContent = initials(item.name);

      const textWrap = document.createElement('div');
      textWrap.className = 'telao-row-text';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = item.name;

      const subtextSpan = document.createElement('span');
      subtextSpan.className = 'subtext';
      subtextSpan.textContent = joinPhrase(item.name);

      textWrap.appendChild(nameSpan);
      textWrap.appendChild(subtextSpan);

      const timeSpan = document.createElement('span');
      timeSpan.className = 'time';
      timeSpan.textContent = item.time;

      li.appendChild(avatar);
      li.appendChild(textWrap);
      li.appendChild(timeSpan);
      listEl.appendChild(li);
    });

    knownKeys = nextKeys;
    firstLoad = false;
    offlineBadge.classList.remove('is-visible');
  }

  async function poll() {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) throw new Error('status not ok');
      const data = await res.json();
      render(data);
    } catch {
      offlineBadge.classList.add('is-visible');
    }
  }

  renderQr();
  poll();
  setInterval(poll, POLL_INTERVAL_MS);
})();
