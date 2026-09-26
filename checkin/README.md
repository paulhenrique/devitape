# DevItape — Self check-in (Sympla)

Projeto estático (HTML puro) + funções serverless na Vercel, sem framework e sem build.

## Estrutura

- `index.html` — página do participante (celular): e-mail + botão de check-in.
- `telao.html` — tela pra projetar em 16:9: QR code + placar de chegadas.
- `assets/` — CSS e JS puros (sem bundler).
- `api/_sympla.js` — helper compartilhado com a API da Sympla (não vira rota).
- `api/checkin.js` — `POST { email }`.
- `api/status.js` — `GET` → `{ present, total, recent }`.
- `vercel.json` — `cleanUrls` (pra `/telao` funcionar sem `.html`).

## Variáveis de ambiente (só no servidor, nunca commitadas)

- `SYMPLA_TOKEN` — token da API pública da Sympla (header `s_token`).
- `SYMPLA_EVENT_ID` — id do evento na Sympla.

## Rodar os testes locais (mock da Sympla)

```sh
node --test checkin/test/checkin.test.js
```

Os testes cobrem: check-in de participante pendente, participante que já fez
check-in (nos dois formatos do campo `checkin`), e-mail não encontrado,
e-mail inválido, env vars ausentes, falha da API da Sympla e paginação por
cursor.

## Deploy (Vercel)

Este diretório é a raiz de um projeto Vercel próprio (separado do app Next.js
que vive no restante do repositório). Ao criar/linkar o projeto na Vercel,
configure o **Root Directory** como `checkin`.

> Nota: o nome do parâmetro de query usado para reenviar o cursor de
> paginação (`page_by` em `api/_sympla.js`) segue a convenção observada da
> API pública da Sympla. Se, com uma base grande de participantes (mais de
> 500), o `/api/status` não trouxer todo mundo, confira esse nome na
> documentação oficial da Sympla e ajuste.
