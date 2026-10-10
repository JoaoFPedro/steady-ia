---
name: onboard
title: Onboarding em projeto existente
role: Produto & Design + Engineer & QA
description: Onboarding em projeto com código existente — idempotente, role-aware; gera stack, blueprint, ADR-000 e domínio.
model: strategy
agent: agent
argument-hint: nenhum
instructions: [onboarding]
---

Analise um projeto existente e gere ou complete os artefatos do isabel, **respeitando o que já existe** e **focando no papel de quem está rodando**.

> Use este comando na **primeira sessão sua** com um projeto que já tem código. Ele é **idempotente** — rodar várias vezes não sobrescreve trabalho feito por outras pessoas; só preenche lacunas.
> Pré-requisito: pasta do `isabel` (`.sdd/`, `.claude/`, `CLAUDE.md`) já copiada para a raiz do projeto.

### Contexto

Antes de qualquer ação, leia:

1. `.sdd/CONSTITUTION.md` — regras do framework
2. `.sdd/STACK.md` — stack detectada (se já existir; senão, gere na Fase 0.7 abaixo)
3. `.sdd/PLAYBOOK.md` — patterns e anti-patterns
4. `.sdd/memory/` — estado atual do que foi documentado
5. `docs/adr/` e `docs/blueprints/` — artefatos arquiteturais existentes
6. A **estrutura de pastas** do projeto e os **arquivos principais** (entrypoints, routers, models)

---

## Fase 0 — Stocktaking (o que já está pronto?)

Antes de qualquer geração, **inventarie o estado atual** dos artefatos. Apresente um mapa visual:

| Artefato | Status |
|---|---|
| `.sdd/STACK.md` | ✅ existe / ⚠ vazio / ✗ ausente |
| `.sdd/memory/PROJECT.md` | Preenchido ou só template? |
| `.sdd/memory/DOMAIN.md` | Entidades/fluxos/fronteiras preenchidos? |
| `docs/adr/ADR-000-*.md` | ✅ existe / ✗ ausente |
| `docs/blueprints/current-architecture.mermaid` | ✅ existe / ✗ ausente |
| `docs/documenta-ai/INDEX.md` | Quantos alvos documentados? |
| `.discovery/` | Quantos discoveries? |
| `specs/` | Quantas stories? |

**PARE e apresente o mapa**:

```
Estado atual do isabel neste projeto:

✅ Já feito:
  • .sdd/STACK.md            — TypeScript / Next.js / Vitest
  • docs/adr/ADR-000-...     — snapshot capturado
  • .sdd/memory/DOMAIN.md    — N entidades, M fluxos

⚠ Parcial:
  • .sdd/memory/PROJECT.md   — contexto OK, glossário vazio

✗ Faltando:
  • docs/blueprints/current-architecture.mermaid

Discoveries ativos: X  |  Stories abertas: Y
```

**Se tudo já existe e está preenchido**, verifique também a cobertura do `docs/documenta-ai/INDEX.md`. Se houver módulos do produto sem documentação, crie a linha de base com `/documenta-ai --auto` antes de encerrar. Se estiver coberta, informe que o onboarding está completo.

---

## Fase 0.5 — Identifique o papel

Pergunte:

> "Qual é seu papel principal neste projeto?
> 1. **Dev** — vou implementar, revisar PRs, refactor
> 2. **PD (Produto & Design)** — vou refinar histórias, specs, discoveries
> 3. **Design** — vou desenhar fluxos, telas, interações
> 4. **Solo** — faço de tudo"

Use esta matriz:

| Artefato | Dev | PD | Design | Solo |
|---|---|---|---|---|
| Conflitos com frameworks | ✅ | ⚠ | ⚠ | ✅ |
| `STACK.md` | ✅ valida | ⚠ ler | ⚠ ler | ✅ valida |
| `PROJECT.md` | ⚠ ler | ✅ refina | ✅ refina | ✅ refina |
| `blueprint` C4 | ✅ gera | — | — | ✅ gera |
| `ADR-000` | ✅ gera | — | — | ✅ gera |
| `DOMAIN.md` entidades | ✅ gera | ⚠ contexto | ⚠ contexto | ✅ gera |
| `DOMAIN.md` fluxos | ✅ gera | ✅ valida | ✅ valida | ✅ gera |
| `docs/documenta-ai/` | ✅ gera linha de base | ✅ gera linha de base | ✅ gera linha de base | ✅ gera linha de base |

---

## Fase 0.7 — Stack detection (gera `.sdd/STACK.md` se ausente)

Se `.sdd/STACK.md` já existe e está preenchido, pule esta fase.

Caso contrário, **detecte a stack lendo os arquivos do projeto** (sem CLI externa):

1. **Linguagem & package manager**: `package.json` + lock files (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb`) → JS/TS; `requirements.txt`/`pyproject.toml`/`uv.lock`/`poetry.lock` → Python; `go.mod` → Go; `Cargo.toml` → Rust; `pom.xml`/`build.gradle` → Java; `Gemfile` → Ruby; `composer.json` → PHP.
2. **Framework**: leia as dependências e identifique (Next.js, Nuxt, Remix, NestJS, Express, FastAPI, Django, Flask, Spring Boot, Gin, Echo, Rails, Laravel, etc.).
3. **Test runner**: Vitest, Jest, Playwright, pytest, JUnit, Go test, Cargo test…
4. **ORM/DB**: Prisma, TypeORM, Drizzle, SQLAlchemy, Hibernate, GORM, ActiveRecord…
5. **UI library**: Tailwind, MUI, Chakra, shadcn…
6. **Monorepo**: pnpm workspace, nx, turbo, lerna, cargo workspace.

Escreva o resultado em `.sdd/STACK.md` no formato:

```markdown
# Stack

- **Linguagem**: TypeScript 5.4
- **Framework**: Next.js 14 (App Router)
- **Test runner**: Vitest + Playwright
- **ORM**: Prisma
- **UI**: Tailwind CSS + shadcn/ui
- **Package manager**: pnpm
- **Monorepo**: não

## Convenções da stack

- (preencha com convenções específicas — naming, estrutura de pastas, padrões de teste…)
```

**PARE**: "Stack detectada: [resumo]. Está correto?"

---

## Fase 1 — Conflitos com frameworks existentes

*(Pula se papel = Design.)*

Procure por:

| O que procurar | Como detectar | Equivalência isabel |
|---|---|---|
| AI rules | `.cursorrules`, `.cursor/rules/`, `copilot-instructions.md`, `CLAUDE.md` | `.cursor/rules/*.mdc`, `.github/instructions/` |
| BDD/Spec | `*.feature`, `features/`, Cucumber, Behave | `specs/{id}/spec.bdd.md` |
| ADRs | `docs/decisions/`, Confluence | `docs/adr/ADR-*.md` |
| Git hooks | `.husky/`, `lint-staged` | `.sdd/hooks/` |
| Commit rules | Commitizen | Conventional Commits |

**Princípio**: Additive first. **PARE**: "Encontrei: [lista]. Como deseja proceder?"

---

## Fase 2 — `PROJECT.md` (contexto + glossário)

*(Dev: só ler. PD/Design/Solo: refinar.)*

Se **já tem conteúdo**, mostre e pergunte se precisa ajuste — não regenere.

Se vazio, preencha:
- **Contexto**: o que faz, para quem, por quê
- **Glossário**: termos de domínio
- **Links**: repo, docs externas

**PARE**: "Contexto está correto?"

---

## Fase 3 — Blueprint da arquitetura

*(Apenas Dev e Solo.)*

Se **já existe**, apresente e pergunte se está atualizado. Se não, crie `docs/blueprints/current-architecture.mermaid`:
- C4 nível 2: módulos, conexões, dependências externas

### Use o `/documenta-ai` como fonte do blueprint

Ao documentar os módulos na Fase 5.5, use os sequence diagrams dos DevDocs como fonte para o blueprint: cada `participant` é um módulo, cada seta é uma conexão, cada `ExternalAPI`/`Database` é dependência externa. Se ainda não houver DevDocs, desenhe um primeiro blueprint a partir do código e confira após a linha de base.

**PARE**: "Blueprint reflete a arquitetura real?"

---

## Fase 4 — ADR-000 (estado atual)

*(Apenas Dev e Solo.)*

Se **já existe**, **não substitua**. Mostre e ofereça novo ADR-NNN se houver adendo.

Se não existe, crie `docs/adr/ADR-000-estado-atual.md`:
- Stack
- Padrões em uso
- Decisões implícitas
- Débitos técnicos

**PARE**: "ADR-000 está correto?"

---

## Fase 5 — `DOMAIN.md` (entidades, fluxos, fronteiras)

*(Dev/Solo geram. PD/Design validam.)*

Se **preenchido**, mostre e pergunte. Se vazio:
- **Entidades**: models + campos
- **Fluxos**: 3-5 principais
- **Fronteiras**: APIs, webhooks, filas

Se a Fase 3 gerou DevDocs, o domínio sai deles quase de graça: os participantes `Repository` e `Database` dão as **entidades**, os `sequenceDiagram` dão os **fluxos**, e os `ExternalAPI` dão as **fronteiras**. Use os documentos como fonte antes de voltar ao código.

Anexe também ao glossário de `PROJECT.md` as siglas que o `/documenta-ai` deixou como `❓ pendente` — o onboarding é o melhor momento para o time resolvê-las de uma vez.

**PARE**: "Domínio está correto?"

---

## Fase 5.5 — Linha de base da documentação do produto

*(Todos os papéis.)*

Inventarie os módulos com comportamento de produto e compare com `docs/documenta-ai/INDEX.md`. Rode `/documenta-ai --auto` para criar DevDocs, BusinessRules e TechnicalDebts dos módulos ainda não documentados. Se um módulo já estiver documentado, use `--incremental` para atualizar somente o que mudou. Registre a cobertura e eventuais lacunas no resumo do onboarding. Não invente comportamento para scaffolds vazios.

Essa é a documentação inicial do projeto existente. Depois, `/build`, `/feature` e `/reflect` a mantêm atualizada.

---

## Fase 6 — Sumário (papel-específico)

Mostre:

**Todos:**
- Stories em `specs/` (status spec/blueprint)
- Discoveries em `.discovery/` (decisão)
- ADRs em `docs/adr/`

**PD/Design**: glossário + fluxos

**Dev**: stack + padrões

---

## Fase 7 — Próximos passos

- **Dev**: "Pegue uma story em `specs/` ou rode `/analyze`."
- **Dev/Solo em legado sem spec**: "Use a Matriz de Cenários já documentada como entrada de `/shape` antes de alterar a área."
- **PD**: "Use `/triage` ou `/shape`."
- **Design**: "Cole fluxos em discoveries ou refine `DOMAIN.md`."
- **Solo**: "Rode `/feature` para abrir uma story nova com pipeline completo."

---

## Regras

- **Idempotência primeiro**: se existe e está preenchido, não sobrescreva — mostre e pergunte.
- Não invente. Pergunte.
- Não crie specs no onboard.
- Não proponha refatorações.
- Blueprint simples (C4 nível 2).
- Respeite o papel.
