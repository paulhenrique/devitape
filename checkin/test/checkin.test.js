'use strict';

// Teste local das funções serverless com um mock da API da Sympla.
// Roda com: node --test checkin/test/checkin.test.js
// (usa apenas o test runner nativo do Node, sem instalar nada)

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SYMPLA_TOKEN = 'fake-token';
process.env.SYMPLA_EVENT_ID = 'evt-1';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
  };
}

function freshModules() {
  delete require.cache[require.resolve('../api/_sympla')];
  delete require.cache[require.resolve('../api/checkin')];
  delete require.cache[require.resolve('../api/status')];
  return {
    checkinHandler: require('../api/checkin'),
    statusHandler: require('../api/status'),
  };
}

// Participante ativo desde a inscrição (formato A do campo checkin).
const anaFormatA = {
  id: 'p1',
  first_name: 'Ana',
  last_name: 'Souza',
  email: 'ana@example.com',
  checkin: { check_in: false, check_in_date: null },
};

// Participante que já fez check-in, no formato B ({date, id}).
const brunoFormatB = {
  id: 'p2',
  first_name: 'Bruno',
  last_name: 'Lima',
  email: 'bruno@example.com',
  checkin: { date: '2026-09-26T13:05:00-03:00', id: 'chk-2' },
};

// Participante que já fez check-in, no formato A.
const carlaFormatA = {
  id: 'p3',
  first_name: 'Carla',
  last_name: 'Nogueira',
  email: 'carla@example.com',
  checkin: { check_in: true, check_in_date: '2026-09-26T13:10:00-03:00' },
};

const dataset = [anaFormatA, brunoFormatB, carlaFormatA];

function installMockFetch({ onCheckin } = {}) {
  global.fetch = async (url) => {
    const parsed = new URL(url);

    if (parsed.pathname.endsWith('/check-in')) {
      const match = parsed.pathname.match(/participants\/([^/]+)\/check-in/);
      const participantId = match && match[1];
      if (onCheckin) onCheckin(participantId);
      return jsonResponse(200, { data: { id: participantId } });
    }

    const email = parsed.searchParams.get('participant_email');
    const filtered = email
      ? dataset.filter((p) => p.email.toLowerCase() === email.toLowerCase())
      : dataset;

    return jsonResponse(200, { data: filtered, pagination: { next_cursor: null } });
  };
}

test('check-in de participante pendente (formato A) retorna ok e marca presença', async () => {
  const checkedIds = [];
  installMockFetch({ onCheckin: (id) => checkedIds.push(id) });
  const { checkinHandler } = freshModules();

  const res = fakeRes();
  await checkinHandler({ method: 'POST', body: { email: 'ANA@example.com' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(res.body.name, 'Ana S.');
  assert.deepEqual(checkedIds, ['p1']);
});

test('check-in de quem já fez check-in (formato B) retorna already', async () => {
  installMockFetch();
  const { checkinHandler } = freshModules();

  const res = fakeRes();
  await checkinHandler({ method: 'POST', body: { email: 'bruno@example.com' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'already');
  assert.equal(res.body.name, 'Bruno L.');
});

test('check-in de quem já fez check-in (formato A) retorna already', async () => {
  installMockFetch();
  const { checkinHandler } = freshModules();

  const res = fakeRes();
  await checkinHandler({ method: 'POST', body: { email: 'carla@example.com' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'already');
});

test('e-mail não encontrado retorna 404 not_found', async () => {
  installMockFetch();
  const { checkinHandler } = freshModules();

  const res = fakeRes();
  await checkinHandler({ method: 'POST', body: { email: 'ninguem@example.com' } }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.status, 'not_found');
});

test('e-mail inválido retorna 400', async () => {
  installMockFetch();
  const { checkinHandler } = freshModules();

  const res = fakeRes();
  await checkinHandler({ method: 'POST', body: { email: 'nao-e-email' } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, 'invalid_email');
});

test('falta de env vars retorna 500', async () => {
  installMockFetch();
  const { checkinHandler } = freshModules();

  const savedToken = process.env.SYMPLA_TOKEN;
  delete process.env.SYMPLA_TOKEN;

  const res = fakeRes();
  await checkinHandler({ method: 'POST', body: { email: 'ana@example.com' } }, res);

  assert.equal(res.statusCode, 500);

  process.env.SYMPLA_TOKEN = savedToken;
});

test('falha da Sympla retorna 502', async () => {
  global.fetch = async () => jsonResponse(500, { message: 'boom' });
  const { checkinHandler } = freshModules();

  const res = fakeRes();
  await checkinHandler({ method: 'POST', body: { email: 'ana@example.com' } }, res);

  assert.equal(res.statusCode, 502);
});

test('status retorna present/total corretos e os 8 mais recentes ordenados', async () => {
  installMockFetch();
  const { statusHandler } = freshModules();

  const res = fakeRes();
  await statusHandler({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.total, 3);
  assert.equal(res.body.present, 2);
  assert.equal(res.body.recent[0].name, 'Carla N.');
  assert.equal(res.body.recent[1].name, 'Bruno L.');
  assert.equal(res.headers['Cache-Control'], 's-maxage=5, stale-while-revalidate=10');
});

test('pagina os resultados seguindo pagination.next_cursor', async () => {
  const page1 = [anaFormatA];
  const page2 = [brunoFormatB, carlaFormatA];

  global.fetch = async (url) => {
    const parsed = new URL(url);
    const cursor = parsed.searchParams.get('page_by');
    if (!cursor) {
      return jsonResponse(200, { data: page1, pagination: { next_cursor: 'page2' } });
    }
    assert.equal(cursor, 'page2');
    return jsonResponse(200, { data: page2, pagination: { next_cursor: null } });
  };

  const { statusHandler } = freshModules();
  const res = fakeRes();
  await statusHandler({}, res);

  assert.equal(res.body.total, 3);
});
