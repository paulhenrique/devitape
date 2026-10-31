'use strict';

// Testes do timekeeper: regras (api/_timer.js), armazenamento (api/_store.js),
// rota /api/timer e o núcleo do front (assets/timer-core.js).
// Roda com: node --test checkin/test/timer.test.js

const test = require('node:test');
const assert = require('node:assert/strict');

const { applyAction, initialState, ActionError } = require('../api/_timer');
const core = require('../assets/timer-core');

const T0 = 1_000_000;

function withSteps() {
  return applyAction(
    initialState(),
    {
      action: 'setSteps',
      steps: [
        { id: 'abertura', title: 'Abertura', durationSec: 600 },
        { id: 'palestra', title: 'Palestra', durationSec: 1800 },
      ],
    },
    T0
  );
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

function freshHandler() {
  delete require.cache[require.resolve('../api/_store')];
  delete require.cache[require.resolve('../api/timer')];
  return require('../api/timer');
}

function clearStoreEnv() {
  for (const key of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'VERCEL']) {
    delete process.env[key];
  }
}

// ---------- Regras ----------

test('play, pause e play de novo acumulam só o tempo rodando', () => {
  let s = withSteps();
  s = applyAction(s, { action: 'play' }, T0);
  s = applyAction(s, { action: 'pause' }, T0 + 4000);
  assert.equal(s.elapsedBeforeMs, 4000);
  assert.equal(s.running, false);
  // tempo parado não conta
  s = applyAction(s, { action: 'play' }, T0 + 60_000);
  assert.equal(core.remainingMs(s, T0 + 61_000), 600_000 - 5000);
});

test('passa do tempo e continua contando no negativo', () => {
  let s = applyAction(withSteps(), { action: 'play' }, T0);
  const ms = core.remainingMs(s, T0 + 600_000 + 75_000);
  assert.equal(ms, -75_000);
  assert.equal(core.formatClock(ms), '-01:15');
  assert.equal(core.phase(s, T0 + 600_000 + 75_000), 'expired');
});

test('próxima etapa zera o tempo e continua rodando se estava rodando', () => {
  let s = applyAction(withSteps(), { action: 'play' }, T0);
  s = applyAction(s, { action: 'next' }, T0 + 700_000);
  assert.equal(s.currentIndex, 1);
  assert.equal(s.running, true);
  assert.equal(core.remainingMs(s, T0 + 710_000), 1_800_000 - 10_000);
  // na última etapa, "próxima" não faz nada
  s = applyAction(s, { action: 'next' }, T0 + 720_000);
  assert.equal(s.currentIndex, 1);
});

test('voltar etapa parada continua parada e com o tempo cheio', () => {
  let s = applyAction(withSteps(), { action: 'goto', index: 1 }, T0);
  s = applyAction(s, { action: 'prev' }, T0 + 5000);
  assert.equal(s.currentIndex, 0);
  assert.equal(s.running, false);
  assert.equal(core.remainingMs(s, T0 + 9000), 600_000);
});

test('+1 min e -1 min mexem no tempo restante', () => {
  let s = applyAction(withSteps(), { action: 'play' }, T0);
  s = applyAction(s, { action: 'adjust', deltaSec: 60 }, T0 + 1000);
  assert.equal(core.remainingMs(s, T0 + 1000), 600_000 + 60_000 - 1000);
  s = applyAction(s, { action: 'adjust', deltaSec: -120 }, T0 + 1000);
  assert.equal(core.remainingMs(s, T0 + 1000), 600_000 - 60_000 - 1000);
});

test('reiniciar etapa volta o tempo cheio sem parar o relógio', () => {
  let s = applyAction(withSteps(), { action: 'play' }, T0);
  s = applyAction(s, { action: 'resetStep' }, T0 + 300_000);
  assert.equal(s.running, true);
  assert.equal(core.remainingMs(s, T0 + 300_000), 600_000);
});

test('editar o roteiro mantém a etapa atual rodando se ela continuar nele', () => {
  let s = applyAction(withSteps(), { action: 'goto', index: 1 }, T0);
  s = applyAction(s, { action: 'play' }, T0);
  s = applyAction(
    s,
    {
      action: 'setSteps',
      steps: [
        { id: 'palestra', title: 'Palestra principal', durationSec: 1200 },
        { id: 'abertura', title: 'Abertura', durationSec: 600 },
      ],
    },
    T0 + 10_000
  );
  assert.equal(s.currentIndex, 0);
  assert.equal(s.running, true);
  assert.equal(core.remainingMs(s, T0 + 10_000), 1_200_000 - 10_000);
});

test('remover a etapa atual do roteiro para o relógio e zera', () => {
  let s = applyAction(withSteps(), { action: 'play' }, T0);
  s = applyAction(s, { action: 'setSteps', steps: [{ id: 'palestra', title: 'Palestra', durationSec: 1800 }] }, T0 + 5000);
  assert.equal(s.running, false);
  assert.equal(s.currentIndex, 0);
  assert.equal(core.remainingMs(s, T0 + 9000), 1_800_000);
});

test('roteiro inválido é recusado com mensagem clara', () => {
  assert.throws(() => applyAction(initialState(), { action: 'setSteps', steps: [{ title: '', durationSec: 60 }] }, T0), ActionError);
  assert.throws(() => applyAction(initialState(), { action: 'setSteps', steps: [{ title: 'X', durationSec: 0 }] }, T0), ActionError);
  assert.throws(() => applyAction(initialState(), { action: 'play' }, T0), /pelo menos uma etapa/);
  assert.throws(() => applyAction(withSteps(), { action: 'explodir' }, T0), /desconhecida/);
});

test('aviso pro apresentador tem limite de tamanho e expira', () => {
  let s = applyAction(withSteps(), { action: 'notify', text: `  ${'a'.repeat(300)}  ` }, T0);
  assert.equal(s.message.text.length, 140);
  assert.ok(core.activeMessage(s, T0 + 1000));
  assert.equal(core.activeMessage(s, T0 + core.MESSAGE_VISIBLE_MS + 1), null);
  s = applyAction(s, { action: 'clearMessage' }, T0 + 2000);
  assert.equal(s.message, null);
});

test('cada ação incrementa a versão', () => {
  let s = withSteps();
  const v = s.version;
  s = applyAction(s, { action: 'play' }, T0);
  assert.equal(s.version, v + 1);
});

// ---------- Formatação ----------

test('formatClock arredonda como um cronômetro de palco', () => {
  assert.equal(core.formatClock(600_000), '10:00');
  assert.equal(core.formatClock(599_001), '10:00');
  assert.equal(core.formatClock(500), '00:01');
  assert.equal(core.formatClock(0), '00:00');
  assert.equal(core.formatClock(-500), '00:00');
  assert.equal(core.formatClock(-1000), '-00:01');
  assert.equal(core.formatClock(3_725_000), '1:02:05');
});

test('phase indica aviso no último minuto', () => {
  const s = applyAction(withSteps(), { action: 'play' }, T0);
  assert.equal(core.phase(s, T0 + 1000), 'normal');
  assert.equal(core.phase(s, T0 + 545_000), 'warning');
  assert.equal(core.phase(initialState(), T0), 'empty');
});

// ---------- Rota /api/timer + armazenamento ----------

test('GET sem nada salvo devolve estado vazio e o horário do servidor', async () => {
  clearStoreEnv();
  const handler = freshHandler();
  const res = fakeRes();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.state.steps, []);
  assert.equal(typeof res.body.serverNow, 'number');
  assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('POST salva e o GET seguinte enxerga (armazenamento em memória local)', async () => {
  clearStoreEnv();
  const handler = freshHandler();
  await handler(
    { method: 'POST', body: { action: 'setSteps', steps: [{ id: 'a', title: 'Abertura', durationSec: 600 }] } },
    fakeRes()
  );
  await handler({ method: 'POST', body: { action: 'play' } }, fakeRes());
  const res = fakeRes();
  await handler({ method: 'GET' }, res);
  assert.equal(res.body.state.steps[0].title, 'Abertura');
  assert.equal(res.body.state.running, true);
});

test('ação inválida volta 400 com a mensagem', async () => {
  clearStoreEnv();
  const handler = freshHandler();
  const res = fakeRes();
  await handler({ method: 'POST', body: { action: 'play' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, 'invalid');
  assert.match(res.body.message, /pelo menos uma etapa/);
});

test('na Vercel sem Redis configurado, avisa storage_missing em vez de usar memória', async () => {
  clearStoreEnv();
  process.env.VERCEL = '1';
  const handler = freshHandler();
  const res = fakeRes();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.status, 'storage_missing');
  delete process.env.VERCEL;
});

test('com Redis configurado, fala com a API REST da Upstash', async () => {
  clearStoreEnv();
  process.env.KV_REST_API_URL = 'https://fake.upstash.io';
  process.env.KV_REST_API_TOKEN = 'tok';
  const calls = [];
  const db = new Map();
  global.fetch = async (url, init) => {
    const command = JSON.parse(init.body);
    calls.push({ url, auth: init.headers.Authorization, command });
    if (command[0] === 'SET') {
      db.set(command[1], command[2]);
      return { ok: true, status: 200, json: async () => ({ result: 'OK' }) };
    }
    return { ok: true, status: 200, json: async () => ({ result: db.get(command[1]) ?? null }) };
  };

  const handler = freshHandler();
  await handler(
    { method: 'POST', body: { action: 'setSteps', steps: [{ id: 'a', title: 'Abertura', durationSec: 600 }] } },
    fakeRes()
  );
  const res = fakeRes();
  await handler({ method: 'GET' }, res);

  assert.equal(res.body.state.steps[0].title, 'Abertura');
  assert.equal(calls[0].url, 'https://fake.upstash.io');
  assert.equal(calls[0].auth, 'Bearer tok');
  assert.deepEqual(calls[0].command, ['GET', 'timekeeper:state']);
  const set = calls.find((c) => c.command[0] === 'SET');
  assert.equal(set.command[3], 'EX');
  clearStoreEnv();
});

test('falha do Redis vira 502', async () => {
  clearStoreEnv();
  process.env.UPSTASH_REDIS_REST_URL = 'https://fake.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'tok';
  global.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: 'WRONGPASS' }) });
  const handler = freshHandler();
  const res = fakeRes();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 502);
  clearStoreEnv();
});

test('JSON malformado no corpo vira 400 (o req.body da Vercel lança erro)', async () => {
  clearStoreEnv();
  const handler = freshHandler();
  const req = { method: 'POST' };
  Object.defineProperty(req, 'body', {
    get() {
      throw new Error('Invalid JSON');
    },
  });
  const res = fakeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
});

test('estado salvo sem campos não derruba a rota', async () => {
  clearStoreEnv();
  process.env.KV_REST_API_URL = 'https://fake.upstash.io';
  process.env.KV_REST_API_TOKEN = 'tok';
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ result: '{"version":3}' }) });
  const handler = freshHandler();
  const res = fakeRes();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.state.steps, []);
  assert.equal(res.body.state.version, 3);
  clearStoreEnv();
});

// ---------- Sincronização (createSync) ----------

function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function stateResponse(version) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ state: { ...initialState(), version }, serverNow: Date.now() }),
  };
}

test('leitura que saiu durante uma ação não desfaz a ação na tela', async () => {
  global.document = { hidden: false };
  const pending = [];
  global.fetch = () => {
    const d = deferred();
    pending.push(d);
    return d.promise;
  };
  const sync = core.createSync({ onState: () => {} });

  const post = sync.send({ action: 'play' });
  const read = sync.refresh(); // o servidor respondeu essa leitura antes de gravar o play
  pending[0].resolve(stateResponse(2));
  await post;
  pending[1].resolve(stateResponse(1));
  await read;
  assert.equal(sync.getState().version, 2);

  // Uma leitura nova, depois disso, com versão menor (estado zerado/expirado) vale.
  const later = sync.refresh();
  pending[2].resolve(stateResponse(0));
  await later;
  assert.equal(sync.getState().version, 0);
  delete global.document;
});

test('requisição travada desiste depois do tempo limite', async () => {
  global.document = { hidden: false };
  global.fetch = (url, init) =>
    new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    });
  const sync = core.createSync({ onState: () => {}, timeoutMs: 30 });
  await assert.rejects(sync.refresh(), /demorou demais/);
  delete global.document;
});
