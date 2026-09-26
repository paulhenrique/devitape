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

const RECENT_LIMIT = 8;

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

    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');
    res.status(200).json({ present: checkedIn.length, total: all.length, recent });
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
