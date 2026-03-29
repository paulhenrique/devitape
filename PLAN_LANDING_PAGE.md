# Plano de Desenvolvimento: Landing Page Devitape

Este documento detalha o plano de desenvolvimento para a landing page da comunidade **devitape**, uma comunidade de desenvolvedores para Itapetininga e região.

## 1. Objetivo
Criar uma presença digital moderna e funcional para a comunidade devitape, permitindo a gestão de eventos via GitHub (arquivos Markdown) e integrando links de comunicação (WhatsApp, LinkedIn, Instagram).

## 2. Tech Stack Sugerida
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)
- **Gestão de Conteúdo:** Markdown (`.md`) com [gray-matter](https://github.com/jonschlinkert/gray-matter) para metadados (YAML frontmatter).
- **Deployment:** [Vercel](https://vercel.com/) integrado ao GitHub.

## 3. Arquitetura de Informação

### Home Page
- **Hero Section:** Título impactante, descrição da comunidade e CTA (Call to Action) principal para o grupo do WhatsApp.
- **Sobre:** Breve texto sobre a missão da devitape em Itapetininga e região.
- **Próximo Evento:** Card em destaque com o evento mais recente (puxado do MD).
- **Redes Sociais:** Links fixos ou em seção dedicada para:
    - WhatsApp (Grupo da comunidade)
    - LinkedIn (Página/Perfil)
    - Instagram (Perfil)
- **Footer:** Copyright e links rápidos.

### Página de Eventos
- **Eventos Futuros:** Listagem de eventos com data, local (ou "Online") e link externo para inscrição (Sympla, Meetup, etc.).
- **Arquivo de Eventos:** Seção para eventos passados (histórico da comunidade).

## 4. Estrutura de Pastas Sugerida
```text
/
├── content/
│   └── events/
│       ├── 2024-05-20-primeiro-meetup.md
│       └── 2024-06-15-workshop-react.md
├── src/
│   ├── app/ (Páginas e Layouts)
│   ├── components/ (Componentes reutilizáveis Shadcn/Custom)
│   ├── lib/ (Utilitários de leitura de MD, formatação de data)
│   └── types/ (Interfaces TypeScript)
├── public/ (Imagens e Assets)
└── tailwind.config.ts
```

## 5. Modelo de Evento (Markdown)
Os eventos serão cadastrados no diretório `content/events/` seguindo este padrão:
```markdown
---
title: "1º Meetup Devitape"
date: "2024-05-20T19:00:00Z"
location: "Itapetininga - Hub Inovação"
externalLink: "https://www.sympla.com.br/evento-exemplo"
description: "Nosso primeiro encontro oficial para networking e palestras sobre o mercado local."
image: "/images/events/meetup-1.jpg"
status: "published" # ou "draft"
---
Conteúdo opcional com mais detalhes do evento...
```

## 6. Design & Identidade Visual
- **Tema:** Dark Mode por padrão (tendência dev), com sotaque em uma cor primária vibrante (ex: Roxo, Azul ou Verde neon).
- **Componentes:** Utilização de Cards, Badges e Botões do Shadcn UI para um visual limpo e profissional.
- **Responsividade:** Mobile-first, garantindo que o acesso via WhatsApp/Instagram seja perfeito no celular.

## 7. Estratégia de SEO Robusta
Para garantir que a devitape seja a principal referência para tecnologia em Itapetininga, a implementação seguirá estas diretrizes:

### Palavras-chave Alvo (PT/EN)
- **Primárias:** "comunidade dev Itapetininga", "desenvolvedores Itapetininga", "tecnologia Itapetininga".
- **Secundárias:** "software engineering Itapetininga", "programação Itapetininga", "meetup tech Itapetininga", "vagas dev Itapetininga", "itapetininga tech community".

### Implementação Técnica (Next.js Metadata API)
- **Metatags Dinâmicas:** Títulos e descrições otimizados para cada página (Home e Eventos).
- **JSON-LD (Structured Data):** Implementação de `Schema.org` para:
    - `Organization`: Definindo a devitape como uma organização educacional/tecnológica.
    - `Event`: Para que os eventos apareçam diretamente nos resultados de busca do Google (Rich Snippets).
- **Open Graph & Twitter Cards:** Imagens de compartilhamento (OG Images) personalizadas para que links no WhatsApp/LinkedIn/Twitter fiquem visualmente atraentes.
- **Sitemap & Robots.txt:** Geração automática de `sitemap.xml` para indexação completa.
- **Internacionalização de SEO:** Uso de tags `hreflang` (se aplicável) e inclusão de termos em inglês nas descrições e metadados para capturar buscas técnicas.
- **Performance (Core Web Vitals):** Next.js por padrão já ajuda, mas garantiremos nota máxima no Lighthouse para favorecer o ranking orgânico.

## 8. Fluxo de Trabalho (GitHub)
1. **Nova Demanda/Evento:** Membro abre um Pull Request adicionando um novo arquivo `.md` em `content/events/`.
2. **Review:** Mantenedores revisam o conteúdo.
3. **Merge:** Ao fazer o merge na `main`, a Vercel detecta a mudança e faz o deploy automático, atualizando a lista de eventos no site.

## 9. Próximos Passos
1. **Aprovação deste plano.**
2. **Inicialização do projeto Next.js.**
3. **Configuração do Tailwind e Shadcn UI.**
4. **Implementação da leitura de arquivos Markdown.**
5. **Criação das páginas Home e Eventos com SEO otimizado.**
6. **Configuração de metatags globais e Schema.org.**
7. **Deploy inicial na Vercel (Manual).**

---
*Plano atualizado em 29/03/2026*
