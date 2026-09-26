# devitape

Site oficial da **DevItape**, comunidade de tecnologia de Itapetininga e região. O site reúne os eventos da comunidade, a equipe de voluntários e links úteis para quem quer participar.

🔗 [devitape.com.br](https://www.devitape.com.br) · [@dev.itape](https://instagram.com/dev.itape)

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) / [Radix UI](https://www.radix-ui.com)
- Conteúdo dos eventos em Markdown, processado com [gray-matter](https://github.com/jonschlinkert/gray-matter) — sem banco de dados ou CMS externo

## Como rodar localmente

Pré-requisitos: [Node.js](https://nodejs.org) 20+ e npm.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Outros scripts disponíveis:

```bash
npm run build   # build de produção
npm run start   # sobe o build de produção
npm run lint    # roda o ESLint
```

## Estrutura do projeto

```
content/
  events/         # um arquivo .md por evento (ver seção "Adicionando um evento")
  links.json      # mapeamento de atalhos usados em devitape.com.br/go/<slug>
public/           # imagens estáticas (capas de eventos, logos etc.)
src/
  app/            # rotas (App Router): home, /eventos, /eventos/[slug], /equipe, /go/[slug]...
  components/     # componentes de UI compartilhados (inclui src/components/ui, do shadcn)
  lib/            # leitura/parse dos eventos (events.ts) e helpers (utils.ts)
  types/          # tipos compartilhados (Event, Volunteer, ...)
```

## Adicionando um evento

Cada evento é um arquivo Markdown em `content/events/<slug>.md`, com metadados em front matter. Use um arquivo existente como referência, por exemplo:

```md
---
title: "Nome do evento"
date: "2026-10-29T19:00:00-03:00"
location: "Nome do local"
externalLink: "https://www.sympla.com.br/evento/..."
description: "Resumo curto usado nos cards e no SEO."
image: "/capa-do-evento.webp"   # arquivo em public/, ou uma URL https:// completa
status: "published"             # "draft" para não publicar ainda
featured: true                  # opcional: destaca este evento na home ("Próximo Evento")
volunteers:                     # opcional: palestrantes e voluntários envolvidos
  - name: "Nome"
    role: "Cargo/empresa"
    isSpeaker: true
    linkedin: "https://www.linkedin.com/in/..."
    talkTitle: "Título da palestra"
    presentationLink: ""
photosLink: "/go/fotos-do-evento" # opcional: link para álbum de fotos após o evento
---

Corpo do evento em Markdown, exibido na página do evento.
```

Detalhes importantes:

- **`date`** define a ordenação e se o evento aparece como "próximo" ou "passado" (ver `src/lib/events.ts`). Use o horário local de Itapetininga (`-03:00`).
- **`featured: true`** força esse evento a aparecer em destaque na home. Use com cuidado: apenas um evento deve estar marcado como featured por vez — ao publicar uma nova edição, lembre-se de remover a flag da edição anterior.
- Imagens de capa devem ir em `public/` (ex.: `public/nome-do-evento.webp`) e ser referenciadas com caminho relativo (`/nome-do-evento.webp`).
- Depois de criar o arquivo, confira o resultado em `/eventos` e na home rodando `npm run dev`.

## Contribuindo

Contribuições são bem-vindas! Um fluxo comum:

1. Crie um branch a partir da `main`.
2. Faça sua alteração (novo evento, ajuste de conteúdo, feature no site).
3. Rode `npm run lint` e confira visualmente no `npm run dev`.
4. Abra um Pull Request descrevendo a mudança.

Dúvidas ou sugestões também podem ser levadas para o grupo da comunidade — os links estão em `content/links.json` e em [devitape.com.br](https://www.devitape.com.br).

## Deploy

O projeto é publicado na [Vercel](https://vercel.com). Todo push na `main` gera um novo deploy automaticamente.
