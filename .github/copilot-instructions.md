# isabel — GitHub Copilot Instructions

O isabel opera com **dois papéis distintos**:

- **Produto & Design** — define o *o quê*: histórias, critérios de aceite e cenários BDD via sessão Three Amigos. BDD é uma **prática de especificação colaborativa**, não uma responsabilidade do engenheiro.
- **Engineer & QA** — garante o *como* e a qualidade: recebe a spec BDD aprovada e a traduz em testes e código. A spec é o contrato de entrada.

Identifique em qual papel você está operando antes de agir.

## Contexto obrigatório

Antes de qualquer ação, leia nesta ordem:

1. `.sdd/CONSTITUTION.md` — princípios invioláveis do framework
2. `.sdd/PROJECT-CONSTITUTION.md` — lei específica do projeto (gerado pelo init)
3. `.sdd/STACK.md` — stack detectada e convenções (gerado por `/init` ou `/onboard`)
4. `.sdd/PLAYBOOK.md` — patterns, anti-patterns, segurança
5. `.sdd/memory/PROJECT.md` — contexto do projeto
6. `.sdd/memory/DECISIONS.md` — decisões existentes
7. Se UI: `.sdd/DESIGN.md` — design system

> Se `.sdd/STACK.md` não existir: peça `/onboard`.
> Se `.sdd/PROJECT-CONSTITUTION.md` não existir:
>   - Projeto novo sem código → execute o processo de init (ver abaixo)
>   - Projeto com código existente → use o onboarding (`docs/ONBOARDING-PROMPT.md`)

## Modos de operação

### Init — projeto novo (Produto & Design)

1. Execute a entrevista estruturada (siga `.github/instructions/init.instructions.md`):
   - Faça uma pergunta por vez sobre: identidade, usuários, domínio, tipo, riscos, integrações, time
2. Gere os artefatos: `PROJECT-CONSTITUTION.md`, `PROJECT.md`, `DOMAIN.md`, `ADR-000-foundation.md`
3. Calibre o `config.json` com base nos riscos declarados

### Discovery — Produto & Design (antes de especificar)

1. **Onboarding** (primeiro acesso em projeto existente): abra `docs/ONBOARDING-PROMPT.md` e cole no Copilot Chat
2. **Discovery**: `/triage` — problema → hipótese → decisão explícita em `.discovery/{DISC-ID}/`
3. Decisão **Construir** libera a especificação; outras encerram o ciclo aqui

### Especificação — Produto & Design (depois de decidir "Construir")

1. **Sessão BDD**: `/shape` — Three Amigos escreve `specs/{id}/story.md` + `spec.bdd.md` referenciando o discovery
2. **Blueprint** (fluxos > 2 passos): `specs/{id}/blueprint.mermaid`
3. **Tasks**: `specs/{id}/tasks.md`
4. A spec aprovada é entregue ao Engineer & QA como contrato

### Implementação — Engineer & QA

A spec BDD aprovada é o ponto de entrada. O Engineer não escreve cenários — ele os implementa.

1. **Análise** (features complexas): analise o código relevante antes de implementar
2. **TDD por cenário**: RED → GREEN → REFACTOR
3. **Check**: valide código contra a spec após implementar
4. **Reflect**: após refactor ou mudança de requisito, sincronize spec vs código

### Modo leve — fix, ajuste, refactor pequeno (Engineer & QA)

Resolva direto. Consulte STACK.md e PLAYBOOK.md. Ao terminar, sincronize spec vs código se necessário.

**Regra de escalação**: 3+ arquivos novos, decisão arquitetural ou fluxo novo → acione Produto & Design para spec antes de implementar.

## Comandos

Os comandos do isabel são **prompt files** em [.github/prompts/](prompts/) e são invocados como slash commands no Copilot Chat (`/<nome>`).

### Produto & Design

| Comando | Prompt file | O que faz |
|---------|-------------|-----------|
| `/init` | [init.prompt.md](prompts/init.prompt.md) | Entrevista projeto novo, gera Constituição + memórias iniciais |
| `/onboard` | [onboard.prompt.md](prompts/onboard.prompt.md) | Analisa projeto existente: blueprint, domínio, ADR-000 |
| `/triage` | [triage.prompt.md](prompts/triage.prompt.md) | Discovery: problema → hipótese → decisão (Construir/Validar/Diferir/Descartar) |
| `/shape` | [shape.prompt.md](prompts/shape.prompt.md) | Sessão Three Amigos — transforma story em cenários BDD |
| `/plan` | [plan.prompt.md](prompts/plan.prompt.md) | Planeja sem implementar: story + spec + blueprint + tasks |

### Engineer & QA

| Comando | Prompt file | O que faz |
|---------|-------------|-----------|
| `/analyze` | [analyze.prompt.md](prompts/analyze.prompt.md) | Análise estratégica do código antes de implementar |
| `/build` | [build.prompt.md](prompts/build.prompt.md) | TDD a partir da spec BDD (RED → GREEN → REFACTOR) |
| `/check` | [check.prompt.md](prompts/check.prompt.md) | Valida código contra spec + checklist OWASP Top 10 |
| `/reflect` | [reflect.prompt.md](prompts/reflect.prompt.md) | Sincroniza spec ↔ código (bidirecional) |
| `/feature` | [feature.prompt.md](prompts/feature.prompt.md) | Pipeline completo: story → spec → TDD (uso solo) |

### Auditoria

| Comando | Prompt file | O que faz |
|---------|-------------|-----------|
| `/healthcheck` | [healthcheck.prompt.md](prompts/healthcheck.prompt.md) | Auditoria silenciosa: sync pendente, specs órfãs, ADRs em Proposed, segurança, dead code |

Cada prompt já carrega o bloco "Pré-condições" — leitura das memórias relevantes, validação de fundação e (em `/check` e `/feature`) o **process guard** que bloqueia execução se houver `.sdd/.pending-sync` ativo.

## Ao implementar

- **KISS** no GREEN: solução mais simples que atende a spec
- **SOLID** no REFACTOR: SRP primeiro, depois OCP, LSP, ISP, DIP
- **DRY** por último: regra de três (1ª escreve, 2ª anota, 3ª extrai)

## Regras de processo

- Spec antes de código: `specs/{story-id}/spec.bdd.md`
- TDD: RED → GREEN → REFACTOR por cenário BDD
- ADR para decisões arquiteturais: `docs/adr/ADR-{NNN}.md`
- Blueprint (Mermaid) para fluxos > 2 passos
- Artefatos de planejamento em `specs/`
- Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`
- Se ambiguidade na spec: pergunte antes de assumir
- Se decisão de arquitetura: proponha ADR primeiro

## Limitações conhecidas vs Claude Code

A versão Claude Code do isabel (em [.claude/](../.claude/)) usa **hooks** atrelados aos eventos `UserPromptSubmit` e `Stop` para automatizar contexto, validação de fluxo e auditoria. O VS Code Copilot **não expõe esses eventos** ao usuário, então parte dessa automação foi traduzida para os próprios prompts e parte simplesmente não existe aqui:

| Hook Claude | Substituto no Copilot |
|-------------|------------------------|
| `context-bootstrap.sh` | Bloco "Pré-condições" em cada prompt (leitura explícita de `.sdd/memory/*`, `.sdd/STACK.md`, etc.) |
| `process-guard.sh` | Bloco "Process guard" em `/check`, `/feature` e `/reflect` (verifica `.sdd/.pending-sync`) |
| `model-advisor.sh` | Frontmatter `model:` em cada prompt (Opus para decisão, Sonnet para execução) |
| `session-healthcheck.sh` | Comando manual `/healthcheck` — rode ao final da sessão ou antes de commits importantes |
| `session-tracker.sh` | **Sem equivalente.** Copilot não persiste sessão. |
| `retro-logger.sh` | **Sem equivalente.** Métricas de sessão não são logadas automaticamente. |

**Implicação prática**: rode `/healthcheck` ao terminar uma sessão. Os bloqueios de fluxo (`/check`/`/feature` após `/build` sem spec) funcionam, mas exigem que o prompt seja executado — não há interceptação automática.
