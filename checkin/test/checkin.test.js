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
  delete require.cache[require.resolve('../api/events')];
  return {
    checkinHandler: require('../api/checkin'),
    statusHandler: require('../api/status'),
    eventsHandler: require('../api/events'),
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

// Duas inscrições com o mesmo e-mail e o mesmo nome (o bug real relatado:
// a pessoa se inscreveu duas vezes e o sistema não devia adivinhar qual é).
const diegoPendente = {
  id: 'p4',
  first_name: 'Diego',
  last_name: 'Santos',
  email: 'diego@example.com',
  checkin: { check_in: false, check_in_date: null },
};
const diegoJaFeito = {
  id: 'p5',
  first_name: 'Diego',
  last_name: 'Santos',
  email: 'diego@example.com',
  checkin: { check_in: true, check_in_date: '2026-09-26T13:00:00-03:00' },
};

const dataset = [anaFormatA, brunoFormatB, carlaFormatA, diegoPendente, diegoJaFeito];

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
  assert.equal(res.body.total, 5);
  assert.equal(res.body.present, 3);
  assert.equal(res.body.recent[0].name, 'Carla N.');
  assert.equal(res.body.recent[1].name, 'Bruno L.');
  assert.equal(res.body.recent[2].name, 'Diego S.');
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

test('e-mail com duas inscrições pede pra escolher, sem adivinhar', async () => {
  installMockFetch();
  const { checkinHandler } = freshModules();

  const res = fakeRes();
  await checkinHandler({ method: 'POST', body: { email: 'diego@example.com' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'choose');
  assert.equal(res.body.options.length, 2);
  assert.deepEqual(
    res.body.options.map((o) => o.checkedIn).sort(),
    [false, true]
  );
});

test('escolhendo a inscrição pendente faz o check-in só dela', async () => {
  const checkedIds = [];
  installMockFetch({ onCheckin: (id) => checkedIds.push(id) });
  const { checkinHandler } = freshModules();

  const res = fakeRes();
  await checkinHandler(
    { method: 'POST', body: { email: 'diego@example.com', participantId: 'p4' } },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'ok');
  assert.deepEqual(checkedIds, ['p4']);
});

test('escolhendo a inscrição que já fez check-in retorna already', async () => {
  installMockFetch();
  const { checkinHandler } = freshModules();

  const res = fakeRes();
  await checkinHandler(
    { method: 'POST', body: { email: 'diego@example.com', participantId: 'p5' } },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'already');
});

test('sem evento fixo e sem event no body retorna missing_event', async () => {
  installMockFetch();
  const { checkinHandler } = freshModules();

  const savedEventId = process.env.SYMPLA_EVENT_ID;
  delete process.env.SYMPLA_EVENT_ID;

  const res = fakeRes();
  await checkinHandler({ method: 'POST', body: { email: 'ana@example.com' } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, 'missing_event');

  process.env.SYMPLA_EVENT_ID = savedEventId;
});

test('event no body é usado mesmo sem SYMPLA_EVENT_ID configurada', async () => {
  const checkedIds = [];
  installMockFetch({ onCheckin: (id) => checkedIds.push(id) });
  const { checkinHandler } = freshModules();

  const savedEventId = process.env.SYMPLA_EVENT_ID;
  delete process.env.SYMPLA_EVENT_ID;

  const res = fakeRes();
  await checkinHandler({ method: 'POST', body: { email: 'ana@example.com', event: 'evt-2' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'ok');

  process.env.SYMPLA_EVENT_ID = savedEventId;
});

test('GET /api/events em modo fixo devolve o SYMPLA_EVENT_ID sem chamar a Sympla', async () => {
  global.fetch = async () => {
    throw new Error('não deveria chamar a Sympla em modo fixo');
  };
  const { eventsHandler } = freshModules();

  const res = fakeRes();
  await eventsHandler({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, 'fixed');
  assert.equal(res.body.resolved.id, 'evt-1');
  assert.deepEqual(res.body.candidates, []);
});

test('GET /api/events em modo automático resolve o evento de hoje pela data', async () => {
  const savedEventId = process.env.SYMPLA_EVENT_ID;
  delete process.env.SYMPLA_EVENT_ID;

  const now = new Date();
  const todayEvent = {
    id: 3551360,
    name: 'DevItape Connect',
    start_date: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    end_date: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
  };
  const farEvent = {
    id: 999,
    name: 'Evento distante',
    start_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString(),
  };

  global.fetch = async () =>
    jsonResponse(200, { data: [todayEvent, farEvent], pagination: { next_cursor: null } });

  const { eventsHandler } = freshModules();
  const res = fakeRes();
  await eventsHandler({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, 'auto');
  assert.equal(res.body.resolved.id, '3551360');
  assert.equal(res.body.resolved.slug, 'devitape-connect');
  assert.equal(res.body.candidates.length, 2);

  process.env.SYMPLA_EVENT_ID = savedEventId;
});

test('GET /api/events com dois eventos no mesmo dia não resolve sozinho', async () => {
  const savedEventId = process.env.SYMPLA_EVENT_ID;
  delete process.env.SYMPLA_EVENT_ID;

  const now = new Date();
  const eventA = {
    id: 1,
    name: 'Evento A',
    start_date: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    end_date: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
  };
  const eventB = {
    id: 2,
    name: 'Evento B',
    start_date: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    end_date: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
  };

  global.fetch = async () =>
    jsonResponse(200, { data: [eventA, eventB], pagination: { next_cursor: null } });

  const { eventsHandler } = freshModules();
  const res = fakeRes();
  await eventsHandler({}, res);

  assert.equal(res.body.resolved, null);
  assert.equal(res.body.candidates.length, 2);

  process.env.SYMPLA_EVENT_ID = savedEventId;
});
