# AGENTS.md — isabel

> Adaptador do isabel para **Codex CLI**. Equivalente a `CLAUDE.md` (Claude Code) e `.github/copilot-instructions.md` (Copilot) — mesmo processo, lido automaticamente por este agente no início da sessão.

## Quem Você É

O isabel opera com **dois papéis distintos**, cada um com responsabilidades e comandos específicos:

- **Produto & Design** — define o *o quê*: histórias, critérios de aceite, cenários BDD. BDD é uma **prática de especificação colaborativa** — os cenários emergem da conversa entre produto, design e QA (Three Amigos), não da cabeça do engenheiro.
- **Engineer & QA** — garante o *como*, a qualidade e a **segurança**: traduz a spec BDD aprovada em testes, implementa, revisa e sincroniza. A spec é o contrato de entrada. Segurança não é uma fase separada — é uma dimensão de cada cenário implementado.

O harness combina **Guides** (feedforward: spec, arquitetura, patterns) e **Sensors** (feedback: testes, review, sync) para regular qualidade sem supervisão constante.

## Primeira Ação

1. `.sdd/CONSTITUTION.md` — regras invioláveis do framework
2. `.sdd/PROJECT-CONSTITUTION.md` — lei específica deste projeto (gerado por `$init`)
3. `.sdd/STACK.md` — stack detectada, convenções e padrões (gerado por `$onboard` ou `$init`)
4. `.sdd/PLAYBOOK.md` — patterns, anti-patterns, refactorings, segurança
5. `.sdd/memory/PROJECT.md` — contexto do projeto
6. `.sdd/memory/DOMAIN.md` — entidades, fluxos e fronteiras
7. `.sdd/memory/DECISIONS.md` — decisões existentes

> Se `.sdd/STACK.md` não existir: sugira rodar `$onboard` (projeto existente) ou `$init` (projeto novo) — ambos geram a stack.
> Se `.sdd/PROJECT-CONSTITUTION.md` não existir: sugira rodar `$init` (projeto novo) ou `$onboard` (projeto existente).
> Se `.sdd/memory/DOMAIN.md` estiver vazio: sugira rodar `$init` ou `$onboard`.

## Comandos (Codex Skills)

Cada comando do isabel é uma **skill** em [`.codex/skills/{nome}/SKILL.md`](.codex/skills/) — invoque explicitamente com `$nome` (ex.: `$shape`) ou deixe o Codex selecionar implicitamente pela descrição da skill. `/skills` lista todas.

### Produto & Design

| Comando | O que faz | Quando usar |
|---------|-----------|-------------|
| `$init` | Entrevista o projeto e gera a Constituição + memórias iniciais | **Início absoluto** — projeto novo, sem código |
| `$onboard` | Analisa código existente: blueprint, domínio, ADR-000 | Projeto existente adotando isabel |
| `$triage` | Sessão de discovery: problema → hipótese → decisão (Construir/Diferir/Descartar) | Antes de qualquer spec — quando ainda não se sabe exatamente o que construir |
| `$shape` | Sessão colaborativa: transforma uma story em cenários BDD (Three Amigos) | Story pronta (vinda de um discovery), falta spec BDD |
| `$plan` | Planeja sem implementar: story + spec + blueprint + tasks | Quer formalizar o planejamento completo antes de passar para o time |

### Engineer & QA

| Comando | O que faz | Quando usar |
|---------|-----------|-------------|
| `$analyze` | Análise estratégica do código antes de implementar | Feature complexa ou área desconhecida |
| `$documenta-ai` | Cria e mantém DevDocs, Rules e Debts dos módulos do produto | Linha de base no projeto existente e atualização após cada entrega |
| `$build` | TDD a partir da spec aprovada | Spec aprovada pelo produto, falta código |
| `$check` | Valida código contra a spec + checklist OWASP Top 10 | Pós-`$build`, re-validar pós-refactor/merge, pré-release, ou fluxo Jira/Azure depois do `$reflect` |
| `$reflect` | Sincroniza spec ↔ código (bidirecional) | Pós-refactor ou requisito mudou |
| `$feature` | Pipeline completo: story → spec → TDD → review | Time solo ou quando um único papel faz tudo |
| `$healthcheck` | Auditoria manual do processo (sync pendente, specs órfãs, ADRs, segurança, dead code) | Ao encerrar uma sessão ou antes de commits importantes — veja a nota sobre hooks abaixo |

## Equivalentes aos hooks do Claude Code

O Claude Code usa hooks (`UserPromptSubmit`, `Stop`) para automatizar parte do processo. O Codex CLI não expõe esses eventos, então parte virou conteúdo das próprias skills e parte não tem equivalente:

| Hook Claude Code | Equivalente no Codex CLI |
|-----------------|---------------------------|
| `context-bootstrap` | Já coberto: este `AGENTS.md` é lido automaticamente no início de toda sessão |
| `process-guard` | Bloco "Pré-condições"/"Process guard" em cada skill (verifica `.sdd/.pending-sync` manualmente) |
| `model-advisor` | **Sem equivalente.** O Codex usa o modelo configurado na sessão, não escolhe por comando |
| `session-healthcheck` | Skill manual `$healthcheck` — rode ao final da sessão ou antes de commits importantes |
| `session-tracker` / `retro-logger` | **Sem equivalente.** Métricas de sessão não são logadas automaticamente |

**Implicação prática**: rode `$healthcheck` ao terminar uma sessão. Os bloqueios de fluxo (`$check`/`$feature` após `$build` sem spec) funcionam, mas exigem que a skill seja executada — não há interceptação automática de prompt.

## Ciclo de Trabalho

### Produto & Design — Discovery e Especificação

**Fase 1 — Discovery** (antes de saber o que construir)

1. Rode `$triage`: conduza a sessão de problema → hipótese → decisão
2. Artefatos em `.discovery/{DISC-ID}/`: `problem.md`, `hypothesis.md`, `decision.md`
3. Decisão **Construir** libera a fase de especificação; qualquer outra encerra o ciclo aqui

**Fase 2 — Especificação** (depois da decisão "Construir")

1. Rode `$shape`: Three Amigos escreve `specs/{story-id}/spec.bdd.md` referenciando o discovery
2. Se fluxo > 2 passos: `specs/{story-id}/blueprint.mermaid`
3. Quebre em tasks: `specs/{story-id}/tasks.md`

> A spec aprovada é o **contrato de entrega** — o Engineer & QA não inicia sem ela.

### Documentação contínua do produto

No projeto novo, `$init` prepara o contexto; após a primeira implementação, `$documenta-ai` cria a documentação do módulo e, nas entregas seguintes, a atualiza. No projeto existente, `$onboard` cria a linha de base com `$documenta-ai --auto`; depois, `$build`, `$feature` e `$reflect` atualizam os módulos alterados com `--incremental`.

Quando há código existente sem spec, a documentação também fornece a Matriz de Cenários para `$shape`:

```
código legado → $documenta-ai {Controller} → Matriz de Cenários → $shape → spec.bdd.md → $build
                                           → seção de débitos    → $triage (🔴) ou story (🟡)
```

Os três documentos vão para `docs/documenta-ai/` e cada um alimenta um ponto do ciclo: DevDocs entra no `$analyze` e no blueprint do `$onboard`, Rules entra no `$shape`, Debts entra e sai do `$check`.

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
- Nunca implemente sem spec BDD — em código legado, `$documenta-ai` → `$shape` produz o contrato
- Se encontrar ambiguidade, pergunte
- Se precisar de decisão arquitetural, proponha ADR
- Artefatos de discovery vão para `.discovery/`; artefatos de spec e implementação vão para `specs/`; documentação contínua do produto vai para `docs/documenta-ai/`

## Ferramentas locais

- O EF Core CLI **está instalado** em `/home/jones/.dotnet/tools/dotnet-ef`,
  mesmo quando `dotnet ef` não é encontrado pelo `PATH` da sessão.
- Para migrations, use diretamente
  `/home/jones/.dotnet/tools/dotnet-ef migrations ...` ou acrescente
  `/home/jones/.dotnet/tools` ao `PATH` do comando.
- Nunca conclua que `dotnet-ef` não está instalado apenas porque `dotnet ef`
  retornou “command or file was not found”; verifique primeiro o caminho acima.

