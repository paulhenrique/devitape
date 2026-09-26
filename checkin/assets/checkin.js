(function () {
  'use strict';

  const SOCIAL_LINKS = [
    { label: 'Site', href: 'https://devitape.com.br', icon: '🌐' },
    { label: 'Instagram', href: 'https://instagram.com/dev.itape', icon: '📷' },
    { label: 'Grupo do WhatsApp', href: 'https://chat.whatsapp.com/LJI2K0j575ULrs385mrPSc', icon: '💬' },
  ];

  const EVENT_STORAGE_KEY = 'devitape:checkin:event';

  const subtitle = document.getElementById('checkin-subtitle');
  const eventPicker = document.getElementById('event-picker');
  const eventPickerOptions = document.getElementById('event-picker-options');
  const form = document.getElementById('checkin-form');
  const emailInput = document.getElementById('email-input');
  const submitButton = document.getElementById('submit-button');
  const participantPicker = document.getElementById('participant-picker');
  const participantPickerOptions = document.getElementById('participant-picker-options');
  const statusBox = document.getElementById('status-box');
  const statusSpinner = document.getElementById('status-spinner');
  const statusMessage = document.getElementById('status-message');
  const eventInfoBox = document.getElementById('event-info-box');
  const eventInfoTitle = document.getElementById('event-info-title');
  const eventInfoLink = document.getElementById('event-info-link');
  const eventInfoShare = document.getElementById('event-info-share');
  const ctaBox = document.getElementById('cta-box');
  const ctaLinks = document.getElementById('cta-links');

  let currentEvent = null; // { id, name, slug }
  let pendingEmail = '';

  function firstName(name) {
    return (name || '').split(' ')[0] || '';
  }

  function setStatus(kind, html, { loading = false } = {}) {
    statusBox.dataset.kind = kind;
    statusBox.classList.toggle('is-visible', Boolean(kind));
    statusSpinner.hidden = !loading;
    statusMessage.innerHTML = html;
  }

  function clearStatus() {
    statusBox.classList.remove('is-visible');
    statusMessage.innerHTML = '';
  }

  function renderCta() {
    if (ctaLinks.childElementCount) return;
    SOCIAL_LINKS.forEach((link) => {
      const a = document.createElement('a');
      a.className = 'checkin-cta-link';
      a.href = link.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = `${link.icon} ${link.label}`;
      ctaLinks.appendChild(a);
    });
  }

  function showEventInfo() {
    if (!currentEvent || !currentEvent.slug) {
      eventInfoBox.classList.remove('is-visible');
      return;
    }
    eventInfoTitle.textContent = currentEvent.name || 'Programação do evento';
    eventInfoLink.href = `https://devitape.com.br/eventos/${currentEvent.slug}`;
    eventInfoBox.classList.add('is-visible');
  }

  function showPostCheckinExtras() {
    renderCta();
    ctaBox.classList.add('is-visible');
    showEventInfo();
  }

  function hidePostCheckinExtras() {
    ctaBox.classList.remove('is-visible');
    eventInfoBox.classList.remove('is-visible');
  }

  eventInfoShare.addEventListener('click', async () => {
    const url = currentEvent && currentEvent.slug
      ? `https://devitape.com.br/eventos/${currentEvent.slug}`
      : 'https://devitape.com.br';
    const shareData = {
      title: currentEvent && currentEvent.name ? currentEvent.name : 'DevItape',
      text: 'Tô no evento da DevItape! Vem também 👀',
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      throw new Error('no-share-api');
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        eventInfoShare.textContent = 'Link copiado!';
        setTimeout(() => {
          eventInfoShare.textContent = 'Compartilhar';
        }, 2000);
      } catch {
        // sem clipboard também: não faz nada além de deixar o link visível.
      }
    }
  });

  function setEvent(event) {
    currentEvent = event;
    try {
      localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(event));
    } catch {
      // localStorage indisponível (modo privado etc.) — segue sem persistir.
    }
    eventPicker.hidden = true;
    form.hidden = false;
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
    form.hidden = true;
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
      } else {
        subtitle.textContent = 'Não encontramos nenhum evento acontecendo hoje.';
        form.hidden = true;
      }
    } catch {
      subtitle.textContent = 'Não conseguimos carregar os dados do evento. Recarregue a página.';
      form.hidden = true;
    }
  }

  async function submitCheckin(email, participantId) {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        event: currentEvent && currentEvent.id,
        participantId,
      }),
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { status: res.status, data };
  }

  function handleResult(status, data) {
    form.hidden = false;
    if (status === 200 && data.status === 'ok') {
      setStatus('success', `Check-in feito, <strong>${firstName(data.name)}</strong>! Olha o telão.`);
      showPostCheckinExtras();
    } else if (status === 200 && data.status === 'already') {
      setStatus('already', `Tudo certo, <strong>${firstName(data.name)}</strong>. Seu check-in já estava feito.`);
      showPostCheckinExtras();
    } else if (status === 404) {
      setStatus(
        'not_found',
        'Não encontramos esse e-mail na lista de inscritos. Confira se digitou certinho o e-mail usado na inscrição, ou procure a organização no local.'
      );
    } else if (status === 400) {
      setStatus('error', 'Esse e-mail não parece válido. Confira e tente de novo.');
    } else {
      setStatus('error', 'Deu um erro por aqui. Tente de novo em instantes.');
    }
  }

  function renderParticipantPicker(options) {
    participantPickerOptions.innerHTML = '';
    options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'checkin-picker-option';
      const statusLabel = option.checkedIn ? 'já fez check-in' : 'pendente';
      btn.innerHTML = `Inscrição ${index + 1} — ${option.name}<span class="meta">${statusLabel}</span>`;
      btn.addEventListener('click', async () => {
        participantPicker.hidden = true;
        setStatus('loading', 'Fazendo check-in...', { loading: true });
        const { status, data } = await submitCheckin(pendingEmail, option.id);
        handleResult(status, data);
      });
      participantPickerOptions.appendChild(btn);
    });
    participantPicker.hidden = false;
    form.hidden = true;
    clearStatus();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;

    pendingEmail = email;
    submitButton.disabled = true;
    clearStatus();
    hidePostCheckinExtras();
    participantPicker.hidden = true;
    setStatus('loading', 'Fazendo check-in...', { loading: true });

    try {
      const { status, data } = await submitCheckin(email);

      if (status === 200 && data.status === 'choose') {
        clearStatus();
        renderParticipantPicker(data.options || []);
      } else {
        handleResult(status, data);
      }
    } catch {
      setStatus('error', 'Não conseguimos conectar. Verifique sua internet e tente de novo.');
    } finally {
      submitButton.disabled = false;
    }
  });

  initEvent();
})();
