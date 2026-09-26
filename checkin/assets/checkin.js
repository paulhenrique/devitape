(function () {
  'use strict';

  const form = document.getElementById('checkin-form');
  const emailInput = document.getElementById('email-input');
  const submitButton = document.getElementById('submit-button');
  const statusBox = document.getElementById('status-box');
  const statusSpinner = document.getElementById('status-spinner');
  const statusMessage = document.getElementById('status-message');

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

  async function submitCheckin(email) {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { status: res.status, data };
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;

    submitButton.disabled = true;
    clearStatus();
    setStatus('loading', 'Fazendo check-in...', { loading: true });

    try {
      const { status, data } = await submitCheckin(email);

      if (status === 200 && data.status === 'ok') {
        setStatus(
          'success',
          `Check-in feito, <strong>${firstName(data.name)}</strong>! Olha o telão.`
        );
      } else if (status === 200 && data.status === 'already') {
        setStatus(
          'already',
          `Tudo certo, <strong>${firstName(data.name)}</strong>. Seu check-in já estava feito.`
        );
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
    } catch {
      setStatus('error', 'Não conseguimos conectar. Verifique sua internet e tente de novo.');
    } finally {
      submitButton.disabled = false;
    }
  });
})();
