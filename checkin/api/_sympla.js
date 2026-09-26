// Helper compartilhado pelas funções serverless. Arquivos com "_" não viram rota na Vercel.
'use strict';

const BASE_URL = 'https://api.sympla.com.br/public/v1.6.0';
const FIELDS = 'id,first_name,last_name,email,checkin';
const PAGE_SIZE = 500;
const EVENT_TIMEZONE = 'America/Sao_Paulo';
// Quantos dias antes/depois da data do evento ainda contam como "hoje é dia
// desse evento", pra cobrir check-in que começa na véspera ou vai até o dia
// seguinte de madrugada.
const EVENT_DATE_BUFFER_DAYS = 1;

class MissingEnvError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MissingEnvError';
  }
}

class MissingEventError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MissingEventError';
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

function getToken() {
  const token = process.env.SYMPLA_TOKEN;
  if (!token) {
    throw new MissingEnvError('Falta a variável de ambiente SYMPLA_TOKEN');
  }
  return token;
}

// SYMPLA_EVENT_ID é opcional: quando definida, sempre vence (modo de um
// evento fixo). Sem ela, o evento é resolvido por data via /api/events.
function envEventId() {
  return process.env.SYMPLA_EVENT_ID || null;
}

async function symplaFetch(path, { method } = {}) {
  const token = getToken();
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: method || (path.includes('/check-in') ? 'POST' : 'GET'),
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
async function listParticipants({ eventId, email } = {}) {
  if (!eventId) {
    throw new MissingEventError('Nenhum evento informado para listar participantes');
  }
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

async function checkinParticipant(eventId, participantId) {
  if (!eventId) {
    throw new MissingEventError('Nenhum evento informado para fazer check-in');
  }
  return symplaFetch(`/events/${eventId}/participants/${participantId}/check-in`);
}

// Lista os eventos do organizador dono do token.
// NOTA: assim como a paginação de participantes, o formato exato do payload
// (nomes de campo de data do evento) não pôde ser conferido contra a doc
// oficial neste ambiente. resolveTodayEvent() tenta alguns nomes de campo
// comuns e, se nenhum bater, simplesmente não resolve automaticamente
// (cai no seletor manual) — não quebra nada, só deixa de auto-detectar.
async function listEvents() {
  const all = [];
  let cursor = null;
  do {
    const params = new URLSearchParams({ page_size: String(PAGE_SIZE) });
    if (cursor) params.set('page_by', cursor);
    const path = `/events?${params.toString()}`;
    const data = await symplaFetch(path);
    const page = (data && data.data) || [];
    all.push(...page);
    cursor = (data && data.pagination && data.pagination.next_cursor) || null;
  } while (cursor);
  return all;
}

function eventDateCandidates(event) {
  const raw =
    event.start_date ||
    event.start_date_ref ||
    event.published_date ||
    event.date ||
    null;
  const end = event.end_date || event.end_date_ref || raw;
  return { start: raw, end };
}

function toDayKey(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function normalizeEvent(event) {
  const { start, end } = eventDateCandidates(event);
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : startDate;
  return {
    id: String(event.id),
    name: event.name || event.title || `Evento ${event.id}`,
    startsAt: startDate && !Number.isNaN(startDate.getTime()) ? startDate.toISOString() : null,
    endsAt: endDate && !Number.isNaN(endDate.getTime()) ? endDate.toISOString() : null,
  };
}

// Tenta achar exatamente um evento cuja janela de datas cobre "hoje" (com
// folga de EVENT_DATE_BUFFER_DAYS pra cada lado). Se achar mais de um ou
// nenhum, devolve resolved: null e a pessoa escolhe manualmente.
function resolveTodayEvent(events) {
  const normalized = events.map(normalizeEvent);
  const now = Date.now();
  const bufferMs = EVENT_DATE_BUFFER_DAYS * 24 * 60 * 60 * 1000;
  const todayKey = toDayKey(new Date(now), EVENT_TIMEZONE);

  const matches = normalized.filter((event) => {
    if (!event.startsAt) return false;
    const start = new Date(event.startsAt).getTime() - bufferMs;
    const end = new Date(event.endsAt || event.startsAt).getTime() + bufferMs;
    return now >= start && now <= end;
  });

  return {
    resolved: matches.length === 1 ? matches[0] : null,
    candidates: normalized,
    todayKey,
  };
}

module.exports = {
  MissingEnvError,
  MissingEventError,
  SymplaApiError,
  envEventId,
  listParticipants,
  checkinParticipant,
  listEvents,
  resolveTodayEvent,
  isCheckedIn,
  checkinDate,
  displayName,
  firstName,
};
