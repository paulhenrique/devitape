'use strict';

const {
  MissingEnvError,
  MissingEventError,
  SymplaApiError,
  envEventId,
  listParticipants,
  checkinParticipant,
  isCheckedIn,
  displayName,
} = require('./_sympla');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function resolveEventId(bodyEventId) {
  if (bodyEventId) return String(bodyEventId);
  return envEventId();
}

async function findMatches(eventId, rawEmail, normalizedEmail) {
  let matches = await listParticipants({ eventId, email: normalizedEmail });
  if (matches.length) return matches;

  if (rawEmail !== normalizedEmail) {
    matches = await listParticipants({ eventId, email: rawEmail });
    if (matches.length) return matches;
  }

  const all = await listParticipants({ eventId });
  return all.filter((p) => ((p.email || '').trim().toLowerCase()) === normalizedEmail);
}

function participantOption(p) {
  return { id: p.id, name: displayName(p), checkedIn: isCheckedIn(p) };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'error', message: 'Método não permitido' });
    return;
  }

  const body = readBody(req);
  const { email: rawEmail, participantId } = body;
  const normalizedEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    res.status(400).json({ status: 'invalid_email', message: 'E-mail inválido' });
    return;
  }

  const eventId = resolveEventId(body.event);
  if (!eventId) {
    res.status(400).json({ status: 'missing_event', message: 'Nenhum evento selecionado' });
    return;
  }

  try {
    const matches = await findMatches(eventId, rawEmail, normalizedEmail);

    if (!matches.length) {
      res.status(404).json({ status: 'not_found' });
      return;
    }

    // Mais de uma inscrição com o mesmo e-mail: pede pra pessoa escolher
    // qual delas é a dela, em vez de assumir a primeira pendente.
    if (matches.length > 1 && !participantId) {
      res.status(200).json({ status: 'choose', options: matches.map(participantOption) });
      return;
    }

    const target = participantId
      ? matches.find((p) => String(p.id) === String(participantId))
      : matches[0];

    if (!target) {
      res.status(404).json({ status: 'not_found' });
      return;
    }

    if (isCheckedIn(target)) {
      res.status(200).json({ status: 'already', name: displayName(target) });
      return;
    }

    await checkinParticipant(eventId, target.id);
    res.status(200).json({ status: 'ok', name: displayName(target) });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      console.error('[checkin] configuração ausente', err.message);
      res.status(500).json({ status: 'error', message: 'Configuração ausente no servidor' });
      return;
    }
    if (err instanceof MissingEventError) {
      res.status(400).json({ status: 'missing_event', message: 'Nenhum evento selecionado' });
      return;
    }
    if (err instanceof SymplaApiError) {
      res.status(502).json({ status: 'error', message: 'Falha ao comunicar com a Sympla' });
      return;
    }
    console.error('[checkin] erro inesperado', err);
    res.status(502).json({ status: 'error', message: 'Erro inesperado' });
  }
};
