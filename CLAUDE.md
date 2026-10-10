# CLAUDE.md — isabel

## Quem Você É

O isabel opera com **dois papéis distintos**, cada um com responsabilidades e comandos específicos:

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
| `/onboard` | Analisa código existente: blueprint, domínio, ADR-000 | Projeto existente adotando isabel |
| `/triage` | Sessão de discovery: problema → hipótese → decisão (Construir/Diferir/Descartar) | Antes de qualquer spec — quando ainda não se sabe exatamente o que construir |
| `/shape` | Sessão colaborativa: transforma uma story em cenários BDD (Three Amigos) | Story pronta (vinda de um discovery), falta spec BDD |
| `/plan` | Planeja sem implementar: story + spec + blueprint + tasks | Quer formalizar o planejamento completo antes de passar para o time |

### Engineer & QA

| Comando | O que faz | Quando usar |
|---------|-----------|-------------|
| `/analyze` | Análise estratégica do código antes de implementar | Feature complexa ou área desconhecida |
| `/documenta-ai` | Cria e mantém DevDocs, Rules e Debts dos módulos do produto | Linha de base no projeto existente e atualização após cada entrega |
| `/build` | TDD a partir da spec aprovada — **dispara `/check` automático** ao final | Spec aprovada pelo produto, falta código |
| `/check` | Valida código contra a spec + checklist OWASP Top 10 | Auto-rodado pelo `/build`. Manual só em 3 casos: re-validar pós-refactor/merge, pré-release, ou fluxo Jira/Azure depois do `/reflect` |
| `/reflect` | Sincroniza spec ↔ código (bidirecional) | Pós-refactor ou requisito mudou |
| `/feature` | Pipeline completo: story → spec → TDD → review | Time solo ou quando um único papel faz tudo |

## Hooks Ativos

Hooks do Claude Code que regulam o comportamento automaticamente — sem intervenção manual:

| Evento | Hook | O que faz |
|--------|------|-----------|
| `UserPromptSubmit` | `session-tracker` | Abre/continua sessão (timeout 30 min), registra epoch de início do turno |
| `UserPromptSubmit` | `context-bootstrap` | Injeta contexto `.sdd/memory/` antes de qualquer comando isabel |
| `UserPromptSubmit` | `process-guard` | Bloqueia `/check`/`/feature` se `/reflect` estiver pendente |
| `UserPromptSubmit` | `model-advisor` | Recomenda modelo ideal: Opus 4.7 para decisão, Sonnet 4.6 para execução |
| `Stop` | `session-healthcheck` | Auditoria silenciosa pós-resposta: sync, specs, ADRs, fundação, discovery, security, dead code, doc drift |
| `Stop` | `retro-logger` | Persiste duração do turno + sessão total, decisões (ADRs, specs, discoveries) e erros em `.sdd/metrics/sessions/` |

## Ciclo de Trabalho

### Produto & Design — Discovery e Especificação

**Fase 1 — Discovery** (antes de saber o que construir)

1. Rode `/triage`: conduza a sessão de problema → hipótese → decisão
2. Artefatos em `.discovery/{DISC-ID}/`: `problem.md`, `hypothesis.md`, `decision.md`
3. Decisão **Construir** libera a fase de especificação; qualquer outra encerra o ciclo aqui

**Fase 2 — Especificação** (depois da decisão "Construir")

1. Rode `/shape`: Three Amigos escreve `specs/{story-id}/spec.bdd.md` referenciando o discovery
2. Se fluxo > 2 passos: `specs/{story-id}/blueprint.mermaid`
3. Quebre em tasks: `specs/{story-id}/tasks.md`

> A spec aprovada é o **contrato de entrega** — o Engineer & QA não inicia sem ela.

### Documentação contínua do produto

No projeto novo, `/init` prepara o contexto; após a primeira implementação, `/documenta-ai` cria a documentação do módulo e, nas entregas seguintes, a atualiza. No projeto existente, `/onboard` cria a linha de base com `/documenta-ai --auto`; depois, `/build`, `/feature` e `/reflect` atualizam os módulos alterados com `--incremental`.

Quando há código existente sem spec, a documentação também fornece a Matriz de Cenários para `/shape`:

```
código legado → /documenta-ai {Controller} → Matriz de Cenários → /shape → spec.bdd.md → /build
                                           → seção de débitos    → /triage (🔴) ou story (🟡)
```

Os três documentos vão para `docs/documenta-ai/` e cada um alimenta um ponto do ciclo: DevDocs entra no `/analyze` e no blueprint do `/onboard`, Rules entra no `/shape`, Debts entra e sai do `/check`.

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
- Nunca implemente sem spec BDD — em código legado, `/documenta-ai` → `/shape` produz o contrato
- Se encontrar ambiguidade, pergunte
- Se precisar de decisão arquitetural, proponha ADR
- Artefatos de discovery vão para `.discovery/`; artefatos de spec e implementação vão para `specs/`; documentação contínua do produto vai para `docs/documenta-ai/`

## Ambiente Local — rodar e testar o app no celular

Validado em 2026-08-16. Setup completo (Google Cloud, keystore, client IDs) em `docs/SETUP-LOGIN-GOOGLE.md`.

**O ambiente é WSL2 em modo NAT.** O `hostname -I` devolve um IP interno (`172.17.x.x`) que o celular **não alcança**. O endereço que vale é o do Windows na rede: **192.168.0.18** (Ethernet).

### Subir tudo — `steady-up`

`scripts/dev.sh` faz o roteiro inteiro: sobe o banco, espera ele aceitar conexão,
aplica migrations e lança API + dev server numa sessão tmux chamada `steady`.
Antes de subir qualquer coisa ele confere o que quebra silenciosamente — `.env`,
`launchSettings.json` e se os dois Client IDs batem (ADR-002).

```bash
steady-up      # sobe tudo e devolve o terminal
steady-logs    # tmux attach -t steady (Ctrl-b n troca de janela, Ctrl-b d sai)
steady-down    # derruba API e Expo; o banco fica de pé
```

Os aliases estão no `~/.bashrc` desta máquina. O IP que o celular usa sai do
`EXPO_PUBLIC_API_URL` do `.env` — uma fonte só, sem IP repetido no script.

### Subir tudo na mão (3 processos)

```bash
# 1. Banco — Postgres em container (credenciais iguais às dos testes)
docker run -d --name steady-db \
  -e POSTGRES_DB=steady -e POSTGRES_USER=steady -e POSTGRES_PASSWORD=steady \
  -p 5432:5432 -v steady-pgdata:/var/lib/postgresql/data postgres:16-alpine
# já existe? `docker start steady-db`. Esta máquina não tem o plugin `docker compose`.

# 2. API — sobe já configurada pelo launchSettings.json (Google__ClientId + connection string).
#    Esse arquivo é ignorado pelo git: na primeira vez, copie de launchSettings.example.json
#    e preencha o client ID. Sem ele a API se recusa a subir, de propósito (ADR-002).
dotnet run --project src/Steady.Api

# 3. Dev server — o hostname é obrigatório, senão o Metro anuncia o IP do WSL
cd src/steady-app && REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.18 npx expo start --clear
```

No celular, na tela "Development build": **Enter URL manually** → `http://192.168.0.18:8081`.
**Não use o QR code** — ele aponta para o IP interno do WSL.

Sanity check antes de culpar o app: `curl http://192.168.0.18:5050/health` → `{"status":"ok"}`.

### Pré-requisitos que quebram silenciosamente

- **Port proxy no Windows** (PowerShell admin) encaminhando 5050 e 8081 para o IP do WSL. **O IP do WSL muda a cada reboot** — quando o celular parar de alcançar, é quase sempre isso. Ver `docs/SETUP-LOGIN-GOOGLE.md`.
- **Migrations aplicadas**: `dotnet-ef` está instalado mas fora do `PATH` (use `~/.dotnet/tools/dotnet-ef`) e **não lê o `launchSettings.json`** — passe `Google__ClientId` e `ConnectionStrings__SteadyDb` inline.
- **Expo Go não funciona** neste app: `@react-native-google-signin` é módulo nativo e o import quebra na inicialização. Só development build (`.apk` do EAS, perfil `development`). Rebuild só é necessário quando muda algo **nativo** — `.env` e código JS vêm do dev server.

### Roteiro de teste ponta a ponta

1. Login com Google → home. Falhou? Suspeito nº 1: e-mail fora de *Usuários de teste* na tela de consentimento. Nº 2: divergência entre o Client ID Web do `.env` e o `Google__ClientId` da API (ADR-002).
2. Registrar corrida → `docker exec -it steady-db psql -U steady -d steady -c "select * from running_sessions;"` deve ter `corredor_id` e `idempotency_key`.
3. **Desligar o Wi-Fi**, registrar outra → app aceita, home mostra "1 registro pendente".
4. **Religar** → o aviso some sozinho e a linha aparece no banco.

Os passos 3 e 4 são a única prova de que a fila offline funciona no aparelho — nenhum teste automatizado cobre isso.
