'use strict';

const {
  MissingEnvError,
  SymplaApiError,
  envEventId,
  listEvents,
  resolveTodayEvent,
} = require('./_sympla');
const eventsMap = require('./_events-map.json');

function withSlug(event) {
  return { ...event, slug: eventsMap[event.id] || null };
}

module.exports = async function handler(req, res) {
  try {
    const fixedId = envEventId();
    if (fixedId) {
      // Modo de evento fixo (compatibilidade com deploys de um evento só):
      // não chama a Sympla, só devolve o id configurado.
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
      res.status(200).json({
        mode: 'fixed',
        resolved: withSlug({ id: fixedId, name: null, startsAt: null, endsAt: null }),
        candidates: [],
      });
      return;
    }

    const events = await listEvents();
    const { resolved, candidates } = resolveTodayEvent(events);

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({
      mode: 'auto',
      resolved: resolved ? withSlug(resolved) : null,
      candidates: candidates.map(withSlug),
    });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      console.error('[events] configuração ausente', err.message);
      res.status(500).json({ status: 'error', message: 'Configuração ausente no servidor' });
      return;
    }
    if (err instanceof SymplaApiError) {
      res.status(502).json({ status: 'error', message: 'Falha ao comunicar com a Sympla' });
      return;
    }
    console.error('[events] erro inesperado', err);
    res.status(502).json({ status: 'error', message: 'Erro inesperado' });
  }
};
