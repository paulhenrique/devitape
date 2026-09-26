# DevItape — Self check-in (Sympla)

Projeto estático (HTML puro) + funções serverless na Vercel, sem framework e sem build.

## Estrutura

- `index.html` — página do participante (celular): e-mail + botão de check-in.
- `telao.html` — tela pra projetar em 16:9: QR code + placar de chegadas.
- `assets/` — CSS e JS puros (sem bundler), incluindo o logo do DevItape.
- `api/_sympla.js` — helper compartilhado com a API da Sympla (não vira rota).
- `api/_events-map.json` — mapa manual `{ "id do evento na Sympla": "slug em content/events" }`,
  usado só pra linkar o roteiro do evento após o check-in. **Atualize esse
  arquivo quando adicionar um evento novo em `content/events/*.md`** — o id
  é o número no fim do `externalLink` do frontmatter.
- `api/events.js` — `GET` → lista/resolve qual evento é "hoje".
- `api/checkin.js` — `POST { email, event?, participantId? }`.
- `api/status.js` — `GET ?event=<id>` → `{ present, total, goal, recent }`.
- `vercel.json` — `cleanUrls` (pra `/telao` funcionar sem `.html`).

## Variáveis de ambiente (só no servidor, nunca commitadas)

- `SYMPLA_TOKEN` — token da API pública da Sympla (header `s_token`). Sempre obrigatória.
- `SYMPLA_EVENT_ID` — **opcional**. Se definida, o sistema sempre usa esse
  evento fixo (comportamento antigo, sem chamar `/events` da Sympla). Se
  **não** definida, o evento do dia é detectado automaticamente (veja abaixo).

## Detecção automática do evento (sem reconfigurar env var por evento)

Sem `SYMPLA_EVENT_ID`, o front-end chama `GET /api/events` ao carregar, que:

1. Lista os eventos do organizador na Sympla (`GET /events`, com a mesma
   paginação por cursor usada em `/participants`).
2. Tenta achar **exatamente um** evento cuja data cobre "hoje" (fuso
   `America/Sao_Paulo`, com 1 dia de folga pra cobrir check-in na véspera ou
   virada). Achando um só, usa ele direto — ninguém vê tela nenhuma extra.
3. Se tiver **mais de um evento no mesmo dia** ou **nenhum**, `index.html` e
   `telao.html` mostram uma telinha simples pra escolher manualmente entre os
   eventos listados. A escolha fica salva em `localStorage` no aparelho, então
   um celular ou o computador do telão não perguntam de novo depois.

> ⚠️ **Não consegui confirmar contra a documentação oficial da Sympla** (sem
> acesso de rede a ela neste ambiente) os nomes exatos dos campos de data no
> payload de `GET /events` — `resolveTodayEvent()` em `api/_sympla.js` tenta
> `start_date`, `start_date_ref`, `published_date` e `date`, nessa ordem. Se
> a detecção automática nunca resolver sozinha mesmo com um único evento
> acontecendo, confira no payload real qual campo a Sympla está usando e
> ajuste `eventDateCandidates()`.

## Duas inscrições com o mesmo e-mail

Se a busca por e-mail achar mais de uma inscrição (aconteceu: alguém se
inscreveu duas vezes com o mesmo nome), o check-in **não adivinha mais qual é
a pendente** — `POST /api/checkin` devolve `{status: "choose", options: [...]}`
e a pessoa escolhe na hora qual inscrição é a dela (mostrando nome e se já
tinha feito check-in ou não). Só depois disso o check-in de fato acontece,
via um segundo `POST` com `participantId`.

Isso resolve o check-in errado, mas **não corrige o nome duplicado na
Sympla** — a API pública (pelo menos a parte documentada que usamos) não
expõe um jeito de renomear participante. Isso ainda precisa ser ajustado
manualmente no painel da Sympla, se for o caso.

## Telão: QR no centro, meta de público e pilha de chegadas

O telão não mostra mais "X de Y presentes" — evento gratuito raramente bate
o número de ingressos confirmados, e comparar com o total inteiro parecia
sempre "vazio". Layout atual, tudo numa coluna central:

1. **QR code** grande no centro, com brilho neon.
2. **"Faça seu check-in"** + os 3 passos, e logo abaixo o endereço do site.
3. **Barra de progresso "elétrica"** (gradiente correndo, listras, brilho
   pulsando e uma faísca na ponta), com a porcentagem pequena à direita.
   Ela mira uma **meta realista**: 60% do total confirmado (`GOAL_RATIO` em
   `api/status.js` e em `assets/telao.js` — ajuste os dois se mudar). Ao
   bater a meta, fica verde/amarela e o texto vira "Meta batida!".
4. **Pilha de cards** de quem está chegando: o mais novo entra na frente e
   empurra os outros pra trás; os 3 primeiros dá pra ler, os de trás só
   mostram a bordinha, com degradê no fim.

No fundo, manchas neon desfocadas se movem devagar, e os check-ins
recentes (até 30, `RECENT_LIMIT` em `api/status.js`) viram **cards neon
flutuando** desfocados pelas laterais da tela, só pra dar movimento.

Tudo respeita `prefers-reduced-motion` (as animações param, o conteúdo
continua aparecendo normalmente).

### Testar sem estar no evento: `telao?demo=1`

Sem depender da Sympla, `/telao?demo=1` roda com dados fake: simula
chegadas sozinho a cada poucos segundos e mostra um painel no canto
inferior esquerdo com **"➕ Simular chegada"** (nome aleatório na hora),
**"⚡ +10 de uma vez"** (pra ver a barra encher e bater a meta rápido) e
**"🔄 Reiniciar"**. Também aceita `&total=120` pra testar com outra
capacidade (padrão 80) e `&present=N` pra já começar com N pessoas.

## Rodar os testes locais (mock da Sympla)

```sh
node --test checkin/test/checkin.test.js
```

17 testes cobrem: check-in de participante pendente, participante que já fez
check-in (nos dois formatos do campo `checkin`), e-mail não encontrado,
e-mail inválido, env vars ausentes, falha da API da Sympla, paginação por
cursor, o fluxo de escolha entre inscrições duplicadas, e a resolução
automática de evento por data (evento único / dois no mesmo dia / modo fixo).

## Deploy (Vercel)

Este diretório é a raiz de um projeto Vercel próprio (separado do app Next.js
que vive no restante do repositório). Ao criar/linkar o projeto na Vercel,
configure o **Root Directory** como `checkin`.

> Nota: o nome do parâmetro de query usado para reenviar o cursor de
> paginação (`page_by` em `api/_sympla.js`) segue a convenção observada da
> API pública da Sympla. Se, com uma base grande de participantes (mais de
> 500), o `/api/status` não trouxer todo mundo, confira esse nome na
> documentação oficial da Sympla e ajuste.
