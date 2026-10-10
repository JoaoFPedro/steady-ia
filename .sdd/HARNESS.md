# isabel como Harness

> Mapa de referência: onde cada artefato se encaixa na taxonomia de harness engineering.
>
> **Agent = Model + Harness**
> O isabel é o harness — tudo que envolve o agente além do modelo em si.

---

## Guides (Feedforward)

Documentos que o agente lê **antes** de agir para aumentar a probabilidade de acerto na primeira tentativa.

| Artefato | Tipo de Guide | Camada | Quando consultar |
|----------|---------------|--------|-----------------|
| `CONSTITUTION.md` | Princípios universais | Todos | Todo início de sessão |
| `PROJECT-CONSTITUTION.md` | Lei do projeto | Todos | Todo início de sessão |
| `STACK.md` | Contexto técnico + Harnessability | Maintainability | Toda implementação |
| `PLAYBOOK.md` | Patterns e anti-patterns | Maintainability | RED e REFACTOR |
| `spec.bdd.md` | Especificação funcional | Behaviour | RED (escrever o teste) |
| `blueprint.mermaid` | Diagrama arquitetural | Architecture | Toda decisão de design |
| `docs/adr/ADR-*.md` | Decisões arquiteturais | Architecture | Antes de decisões que afetam 2+ módulos |
| `.sdd/memory/PROJECT.md` | Contexto persistente do projeto | Todos | Todo início de sessão |
| `.sdd/memory/DOMAIN.md` | Entidades e fluxos de domínio | Behaviour | Toda implementação de negócio |
| `.sdd/memory/DECISIONS.md` | Índice de ADRs ativos | Architecture | Antes de propor nova decisão |
| `docs/documenta-ai/dev/*-DevDocs.md` | Fluxo real por camada | Architecture | `/analyze` e toda decisão de design em área legada |
| `docs/documenta-ai/business/*-Rules.md` | Comportamento atual do código | Behaviour | `/shape` (Matriz de Cenários → Gherkin) e RED |

---

## Sensors (Feedback)

Mecanismos que observam **após** a ação para detectar desvios e permitir autocorreção.

| Sensor | Tipo | Camada | Quando dispara |
|--------|------|--------|---------------|
| Testes TDD (fase RED) | Computacional | Behaviour | Pré-commit |
| Approved Fixtures | Computacional | Behaviour | Pré-commit |
| Testes E2E | Computacional | Behaviour | CI / pré-release |
| Linter | Computacional | Maintainability | Pré-commit |
| Type checker | Computacional | Maintainability | Pré-commit |
| Análise de complexidade | Computacional | Maintainability | Pré-commit / CI |
| Cobertura de testes | Computacional | Maintainability | CI |
| Mutation testing | Computacional | Maintainability | CI (pós-merge) |
| Testes de arquitetura | Computacional | Architecture Fitness | CI |
| Fitness Functions | Computacional | Architecture Fitness | Pre-commit + CI |
| `/check` | Inferencial | Maintainability | Pós-implementação |
| `/reflect` | Inferencial | Behaviour | Pós-refactor / pós-merge |
| `docs/documenta-ai/debts/*-Debts.md` | Inferencial | Maintainability | Catálogo de débito — lido e realimentado pelo `/check` |
| Doc drift (`commit:` vs SHA da fonte) | Computacional | Architecture | `session-healthcheck` após cada resposta |
| Revisão humana (PR) | Inferencial | Todos | Pull Request |

---

## As três camadas e seus responsáveis

```
┌─────────────────────────────────────────────────┐
│              BEHAVIOUR HARNESS                  │
│  "O sistema faz o que foi especificado?"        │
│                                                 │
│  Guides: spec.bdd.md, story.md, DOMAIN.md,     │
│          documenta-ai/business/*-Rules.md       │
│  Sensors: TDD tests, fixtures, /reflect, E2E    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│            MAINTAINABILITY HARNESS              │
│  "O código é sustentável internamente?"         │
│                                                 │
│  Guides: PLAYBOOK.md, STACK.md                 │
│  Sensors: linter, type checker, /check,         │
│           documenta-ai/debts/*-Debts.md         │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│          ARCHITECTURE FITNESS HARNESS           │
│  "As características arquiteturais se mantêm?" │
│                                                 │
│  Guides: ADRs, blueprint.mermaid,              │
│          documenta-ai/dev/*-DevDocs.md          │
│  Sensors: Fitness Functions, constraint tests,  │
│           doc drift (healthcheck)               │
└─────────────────────────────────────────────────┘
```

---

## Distribuição temporal (Keep Quality Left)

```
Pré-commit → linter, type check, testes unitários afetados
Commit     → /check local pelo agente (diff analysis)
PR         → revisão humana, suite completa, Fitness Functions
CI/CD      → mutation testing, testes E2E, testes de arquitetura
Contínuo   → /reflect periódico, monitoramento de cobertura, drift detection
```

---

## Harnessability

O `STACK.md` gerado por `/init` ou `/onboard` inclui uma seção de **Harnessability** — avaliação das affordances ambientais do codebase. Affordances de alta pontuação habilitam sensores computacionais mais eficazes:

- **Tipagem estática** → type-checking como sensor gratuito
- **Limites de módulo claros** → constraint de arquitetura automática
- **Framework estabelecido** → agente erra menos (convenções conhecidas)
- **Baseline de testes** → sensores comportamentais funcionam
- **Linter configurado** → sensor de maintainability ativo

Score baixo não impede o isabel — indica onde investir primeiro para ampliar a cobertura do harness.

---

## Referência

Baseado em: *"Harness Engineering for Coding Agent Users"* — Birgitta Böckeler, Thoughtworks (2026)
`martinfowler.com/articles/harness-engineering.html`
