(function () {
  'use strict';

  const qrContainer = document.getElementById('qr-container');
  const domainLabel = document.getElementById('domain-label');
  const presentEl = document.getElementById('present-count');
  const totalEl = document.getElementById('total-count');
  const listEl = document.getElementById('telao-list');
  const offlineBadge = document.getElementById('offline-badge');

  const POLL_INTERVAL_MS = 5000;

  let knownKeys = new Set();
  let firstLoad = true;

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

  function render(data) {
    presentEl.textContent = data.present;
    totalEl.textContent = data.total;

    const nextKeys = new Set((data.recent || []).map(rowKey));
    listEl.innerHTML = '';

    (data.recent || []).forEach((item) => {
      const key = rowKey(item);
      const li = document.createElement('li');
      li.className = 'telao-row';
      if (!firstLoad && !knownKeys.has(key)) {
        li.classList.add('is-entering');
      }

      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = item.name;

      const timeSpan = document.createElement('span');
      timeSpan.className = 'time';
      timeSpan.textContent = item.time;

      li.appendChild(nameSpan);
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
