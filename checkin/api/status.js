'use strict';

const {
  MissingEnvError,
  MissingEventError,
  SymplaApiError,
  envEventId,
  listParticipants,
  isCheckedIn,
  checkinDate,
  displayName,
} = require('./_sympla');

// Limite de quantos check-ins recentes voltam pro telão: o mais novo vira o
// card de destaque, os demais viram as bolinhas flutuantes. Não é "todo
// mundo presente" de propósito (custo de payload/DOM), só uma janela maior
// que os 8 antigos pra dar mais bolinhas conforme o evento anda.
const RECENT_LIMIT = 30;

// Evento gratuito raramente enche 100% dos ingressos confirmados. A meta
// "realista" que a barra de progresso persegue é uma fração da capacidade
// confirmada — ajuste aqui se a expectativa mudar.
const GOAL_RATIO = 0.6;

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Sao_Paulo',
});

function formatTime(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return timeFormatter.format(date);
}

function resolveEventId(req) {
  const fromQuery = req.query && req.query.event;
  if (fromQuery) return String(fromQuery);
  return envEventId();
}

module.exports = async function handler(req, res) {
  const eventId = resolveEventId(req);
  if (!eventId) {
    res.status(400).json({ status: 'error', message: 'Nenhum evento selecionado' });
    return;
  }

  try {
    const all = await listParticipants({ eventId });
    const checkedIn = all.filter(isCheckedIn);

    const recent = checkedIn
      .map((p) => ({ p, date: checkinDate(p) }))
      .filter((x) => x.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, RECENT_LIMIT)
      .map((x) => ({ name: displayName(x.p), time: formatTime(x.date) }));

    const total = all.length;
    const goal = Math.max(1, Math.round(total * GOAL_RATIO));

    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');
    res.status(200).json({ present: checkedIn.length, total, goal, recent });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      console.error('[status] configuração ausente', err.message);
      res.status(500).json({ status: 'error', message: 'Configuração ausente no servidor' });
      return;
    }
    if (err instanceof MissingEventError) {
      res.status(400).json({ status: 'error', message: 'Nenhum evento selecionado' });
      return;
    }
    if (err instanceof SymplaApiError) {
      res.status(502).json({ status: 'error', message: 'Falha ao comunicar com a Sympla' });
      return;
    }
    console.error('[status] erro inesperado', err);
    res.status(502).json({ status: 'error', message: 'Erro inesperado' });
  }
};
