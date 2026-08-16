# CLAUDE.md — SDD Kit

## Quem Você É

O SDD Kit opera com **dois papéis distintos**, cada um com responsabilidades e comandos específicos:

- **Produto & Design** — define o *o quê*: histórias, critérios de aceite, cenários BDD. BDD é uma **prática de especificação colaborativa** — os cenários emergem da conversa entre produto, design e QA (Three Amigos), não da cabeça do engenheiro.
- **Engineer & QA** — garante o *como*, a qualidade e a **segurança**: traduz a spec BDD aprovada em testes, implementa, revisa e sincroniza. A spec é o contrato de entrada. Segurança não é uma fase separada — é uma dimensão de cada cenário implementado.

O harness combina **Guides** (feedforward: spec, arquitetura, patterns) e **Sensors** (feedback: testes, review, sync) para regular qualidade sem supervisão constante.

## Primeira Ação

1. `.sdd/CONSTITUTION.md` — regras invioláveis do framework
2. `.sdd/PROJECT-CONSTITUTION.md` — lei específica deste projeto (gerado por `/init`)
3. `.sdd/STACK.md` — stack detectada, convenções e padrões (gerado por `/onboard` ou `/init`)
4. `.sdd/PLAYBOOK.md` — patterns, anti-patterns, refactorings, segurança
5. `.sdd/memory/PROJECT.md` — contexto do projeto
6. `.sdd/memory/DOMAIN.md` — entidades, fluxos e fronteiras
7. `.sdd/memory/DECISIONS.md` — decisões existentes

> Se `.sdd/STACK.md` não existir: sugira rodar `/onboard` (projeto existente) ou `/init` (projeto novo) — ambos geram a stack.
> Se `.sdd/PROJECT-CONSTITUTION.md` não existir: sugira rodar `/init` (projeto novo) ou `/onboard` (projeto existente).
> Se `.sdd/memory/DOMAIN.md` estiver vazio: sugira rodar `/init` ou `/onboard`.

## Comandos

### Produto & Design

| Comando | O que faz | Quando usar |
|---------|-----------|-------------|
| `/init` | Entrevista o projeto e gera a Constituição + memórias iniciais | **Início absoluto** — projeto novo, sem código |
| `/onboard` | Analisa código existente: blueprint, domínio, ADR-000 | Projeto existente adotando SDD Kit |
| `/discover` | Sessão de discovery: problema → hipótese → decisão (Construir/Diferir/Descartar) | Antes de qualquer spec — quando ainda não se sabe exatamente o que construir |
| `/spec` | Sessão colaborativa: transforma uma story em cenários BDD (Three Amigos) | Story pronta (vinda de um discovery), falta spec BDD |
| `/plan` | Planeja sem implementar: story + spec + blueprint + tasks | Quer formalizar o planejamento completo antes de passar para o time |

### Engineer & QA

| Comando | O que faz | Quando usar |
|---------|-----------|-------------|
| `/analyze` | Análise estratégica do código antes de implementar | Feature complexa ou área desconhecida |
| `/implement` | TDD a partir da spec aprovada — **dispara `/review` automático** ao final | Spec aprovada pelo produto, falta código |
| `/review` | Valida código contra a spec + checklist OWASP Top 10 | Auto-rodado pelo `/implement`. Manual só em 3 casos: re-validar pós-refactor/merge, pré-release, ou fluxo Jira/Azure depois do `/sync` |
| `/sync` | Sincroniza spec ↔ código (bidirecional) | Pós-refactor ou requisito mudou |
| `/feature` | Pipeline completo: story → spec → TDD → review | Time solo ou quando um único papel faz tudo |

## Hooks Ativos

Hooks do Claude Code que regulam o comportamento automaticamente — sem intervenção manual:

| Evento | Hook | O que faz |
|--------|------|-----------|
| `UserPromptSubmit` | `session-tracker` | Abre/continua sessão (timeout 30 min), registra epoch de início do turno |
| `UserPromptSubmit` | `context-bootstrap` | Injeta contexto `.sdd/memory/` antes de qualquer comando SDD |
| `UserPromptSubmit` | `process-guard` | Bloqueia `/review`/`/feature` se `/sync` estiver pendente |
| `UserPromptSubmit` | `model-advisor` | Recomenda modelo ideal: Opus 4.7 para decisão, Sonnet 4.6 para execução |
| `Stop` | `session-healthcheck` | Auditoria silenciosa pós-resposta: sync, specs, ADRs, fundação, discovery, security, dead code |
| `Stop` | `retro-logger` | Persiste duração do turno + sessão total, decisões (ADRs, specs, discoveries) e erros em `.sdd/metrics/sessions/` |

## Ciclo de Trabalho

### Produto & Design — Discovery e Especificação

**Fase 1 — Discovery** (antes de saber o que construir)

1. Rode `/discover`: conduza a sessão de problema → hipótese → decisão
2. Artefatos em `.discovery/{DISC-ID}/`: `problem.md`, `hypothesis.md`, `decision.md`
3. Decisão **Construir** libera a fase de especificação; qualquer outra encerra o ciclo aqui

**Fase 2 — Especificação** (depois da decisão "Construir")

1. Rode `/spec`: Three Amigos escreve `specs/{story-id}/spec.bdd.md` referenciando o discovery
2. Se fluxo > 2 passos: `specs/{story-id}/blueprint.mermaid`
3. Quebre em tasks: `specs/{story-id}/tasks.md`

> A spec aprovada é o **contrato de entrega** — o Engineer & QA não inicia sem ela.

### Engineer & QA — Execução e Qualidade

TDD cenário a cenário, a partir da spec aprovada:

```
🔴 RED     — teste que falha (traduz o cenário BDD)
🟢 GREEN   — mínimo para passar (KISS)
🔄 REFACTOR — estruturar (SOLID + DRY)
```

Não avance sem o cenário anterior verde. Se surgir decisão arquitetural: `docs/adr/ADR-{NNN}.md`.

## Princípios

**KISS** primeiro → **SOLID** no refactor → **DRY** quando o padrão se repetiu 3x.

## Regras

- Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`
- Nunca implemente sem spec BDD
- Se encontrar ambiguidade, pergunte
- Se precisar de decisão arquitetural, proponha ADR
- Artefatos de discovery vão para `.discovery/`; artefatos de spec e implementação vão para `specs/`
