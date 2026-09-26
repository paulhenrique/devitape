// Helper compartilhado pelas funções serverless. Arquivos com "_" não viram rota na Vercel.
'use strict';

const BASE_URL = 'https://api.sympla.com.br/public/v1.6.0';
const FIELDS = 'id,first_name,last_name,email,checkin';
const PAGE_SIZE = 500;

class MissingEnvError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MissingEnvError';
  }
}

class SymplaApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'SymplaApiError';
    this.status = status;
    this.body = body;
  }
}

function getConfig() {
  const token = process.env.SYMPLA_TOKEN;
  const eventId = process.env.SYMPLA_EVENT_ID;
  if (!token || !eventId) {
    throw new MissingEnvError('Faltam as variáveis de ambiente SYMPLA_TOKEN e/ou SYMPLA_EVENT_ID');
  }
  return { token, eventId };
}

async function symplaFetch(path) {
  const { token } = getConfig();
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: path.includes('/check-in') ? 'POST' : 'GET',
    headers: { s_token: token },
  });
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    console.error('[sympla] erro na API', { url, status: res.status, body });
    throw new SymplaApiError('Falha ao comunicar com a Sympla', res.status, body);
  }
  return body;
}

// O campo checkin pode vir como { check_in: bool, check_in_date } ou como { date, id }.
function isCheckedIn(participant) {
  const c = participant && participant.checkin;
  if (!c) return false;
  if (c.check_in === false) return false;
  if (c.check_in === true) return true;
  return Boolean(c.date);
}

function checkinDate(participant) {
  const c = participant && participant.checkin;
  if (!c) return null;
  return c.check_in_date || c.date || null;
}

function firstName(participant) {
  return ((participant && participant.first_name) || '').trim();
}

function lastInitial(participant) {
  const last = ((participant && participant.last_name) || '').trim();
  return last ? `${last[0].toUpperCase()}.` : '';
}

function displayName(participant) {
  const first = firstName(participant);
  const initial = lastInitial(participant);
  return initial ? `${first} ${initial}` : first;
}

// Busca uma página de participantes, seguindo o cursor até esgotar.
// NOTA: o nome do parâmetro de query para reenviar o cursor (page_by) segue a
// convenção da API pública da Sympla; confira na doc oficial se a paginação
// não avançar como esperado com bases grandes de participantes.
async function listParticipants({ email } = {}) {
  const { eventId } = getConfig();
  const all = [];
  let cursor = null;
  do {
    const params = new URLSearchParams({ fields: FIELDS, page_size: String(PAGE_SIZE) });
    if (email) params.set('participant_email', email);
    if (cursor) params.set('page_by', cursor);
    const path = `/events/${eventId}/participants?${params.toString()}`;
    const data = await symplaFetch(path);
    const page = (data && data.data) || [];
    all.push(...page);
    cursor = (data && data.pagination && data.pagination.next_cursor) || null;
  } while (cursor);
  return all;
}

async function checkinParticipant(participantId) {
  const { eventId } = getConfig();
  return symplaFetch(`/events/${eventId}/participants/${participantId}/check-in`);
}

module.exports = {
  MissingEnvError,
  SymplaApiError,
  listParticipants,
  checkinParticipant,
  isCheckedIn,
  checkinDate,
  displayName,
  firstName,
};
