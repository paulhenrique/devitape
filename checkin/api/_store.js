// Armazenamento chave/valor pro estado compartilhado (timekeeper).
// Em produção: Upstash Redis via REST (sem dependência npm). Localmente e
// nos testes, sem as variáveis do Redis, cai num Map em memória.
'use strict';

class StoreNotConfiguredError extends Error {
  constructor() {
    super('Armazenamento não configurado: conecte um Upstash Redis ao projeto na Vercel');
    this.name = 'StoreNotConfiguredError';
  }
}

class StoreError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StoreError';
  }
}

const memory = new Map();

// A integração da Vercel injeta KV_REST_API_*; uma conta Upstash direta usa UPSTASH_REDIS_REST_*.
function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

// Na Vercel, sem Redis, o Map em memória não é compartilhado entre instâncias:
// melhor falhar claro do que ter admin e apresentador vendo estados diferentes.
function useMemory() {
  if (redisConfig()) return false;
  if (process.env.VERCEL) throw new StoreNotConfiguredError();
  return true;
}

async function redis(command) {
  const { url, token } = redisConfig();
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
  } catch (err) {
    console.error('[store] falha de rede com o Redis', err);
    throw new StoreError('Falha ao falar com o armazenamento');
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || !body || body.error) {
    console.error('[store] erro do Redis', { status: res.status, error: body && body.error });
    throw new StoreError('Falha ao falar com o armazenamento');
  }
  return body.result;
}

async function getJSON(key) {
  const raw = useMemory() ? memory.get(key) : await redis(['GET', key]);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setJSON(key, value, ttlSec) {
  const raw = JSON.stringify(value);
  if (useMemory()) {
    memory.set(key, raw);
    return;
  }
  await redis(['SET', key, raw, 'EX', String(ttlSec)]);
}

module.exports = { StoreNotConfiguredError, StoreError, getJSON, setJSON };
