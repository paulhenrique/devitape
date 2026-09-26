'use strict';

const {
  MissingEnvError,
  SymplaApiError,
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

async function findMatches(rawEmail, normalizedEmail) {
  let matches = await listParticipants({ email: normalizedEmail });
  if (matches.length) return matches;

  if (rawEmail !== normalizedEmail) {
    matches = await listParticipants({ email: rawEmail });
    if (matches.length) return matches;
  }

  const all = await listParticipants();
  return all.filter((p) => ((p.email || '').trim().toLowerCase()) === normalizedEmail);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'error', message: 'Método não permitido' });
    return;
  }

  const { email: rawEmail } = readBody(req);
  const normalizedEmail = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    res.status(400).json({ status: 'invalid_email', message: 'E-mail inválido' });
    return;
  }

  try {
    const matches = await findMatches(rawEmail, normalizedEmail);

    if (!matches.length) {
      res.status(404).json({ status: 'not_found' });
      return;
    }

    const pending = matches.find((p) => !isCheckedIn(p));

    if (!pending) {
      res.status(200).json({ status: 'already', name: displayName(matches[0]) });
      return;
    }

    await checkinParticipant(pending.id);
    res.status(200).json({ status: 'ok', name: displayName(pending) });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      console.error('[checkin] configuração ausente', err.message);
      res.status(500).json({ status: 'error', message: 'Configuração ausente no servidor' });
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
