# IDE Setup

> Como o SDD Kit se integra com Cursor e GitHub Copilot.
> O core em `.sdd/` é compartilhado. Cada IDE tem seu adaptador.

---

## Estrutura de arquivos por IDE

```
sdd-kit/
│
├── .sdd/                          # Core — compartilhado por todas as IDEs
│   ├── CONSTITUTION.md
│   ├── STACK.md                   # gerado por ./sdd scan
│   ├── PLAYBOOK.md
│   ├── DESIGN.md
│   ├── PATTERNS.md
│   ├── config.json
│   ├── memory/
│   │   ├── PROJECT.md
│   │   ├── DOMAIN.md
│   │   └── DECISIONS.md
│   └── templates/
│
├── .cursor/                       # Adaptador: Cursor
│   └── rules/
│       ├── sdd-kit.mdc            # Regra global (alwaysApply: true)
│       ├── lightweight-mode.mdc   # Modo leve em src/ e tests/
│       ├── spec-files.mdc         # Regras de localização em specs/
│       └── adr-files.mdc          # Regras de ADR em docs/adr/
│
├── .github/                       # Adaptador: GitHub Copilot
│   ├── copilot-instructions.md    # Instruções globais
│   └── instructions/
│       ├── spec-files.instructions.md        # applyTo: specs/**
│       ├── implementation.instructions.md    # applyTo: src/**, tests/**
│       └── adr-files.instructions.md         # applyTo: docs/adr/**
│
└── CLAUDE.md                      # Adaptador: Claude Code
    └── .claude/commands/          # Slash commands
```

---

## Cursor

### Como funciona

O Cursor carrega regras `.mdc` de `.cursor/rules/` automaticamente. Cada regra tem um frontmatter que define quando ela ativa.

### Arquivos e quando ativam

| Arquivo | `globs` | `alwaysApply` | Ativa quando |
|---------|---------|---------------|-------------|
| `sdd-kit.mdc` | `**/*` | `true` | **Sempre** — regra base do framework |
| `lightweight-mode.mdc` | `src/**, tests/**` | `false` | Editando código ou testes |
| `spec-files.mdc` | `specs/**` | `false` | Trabalhando em specs |
| `adr-files.mdc` | `docs/adr/**` | `false` | Criando ou editando ADRs |

### Frontmatter obrigatório

```markdown
---
description: Descrição da regra (aparece no Cursor UI)
globs: "padrão/de/arquivos/**"
alwaysApply: true | false
---
```

- `alwaysApply: true` → carrega para qualquer arquivo do projeto
- `alwaysApply: false` + `globs` → carrega contextualmente quando o arquivo abre

### O que vai em cada regra

```
sdd-kit.mdc          — contexto base: quem o agente é, o que ler, ciclo TDD, princípios
lightweight-mode.mdc — modo leve: quando ir direto, quando escalar, sugerir /sync
spec-files.mdc       — onde salvar specs, estrutura de pastas, templates
adr-files.mdc        — nomenclatura, template, quando criar, atualizar DECISIONS.md
```

### Regra de ouro

Nunca duplique conteúdo entre regras. O `.sdd/` é a fonte de verdade — as regras do Cursor apenas dizem "leia `.sdd/` antes de agir".

---

## GitHub Copilot

### Como funciona

O Copilot carrega `copilot-instructions.md` como instrução global e arquivos `.instructions.md` em `.github/instructions/` de forma contextual via `applyTo`.

### Arquivos e quando ativam

| Arquivo | `applyTo` | Ativa quando |
|---------|-----------|-------------|
| `copilot-instructions.md` | — (global) | **Sempre** |
| `onboarding.instructions.md` | `.sdd/memory/**, .sdd/STACK.md` | Editando arquivos de memória |
| `spec-files.instructions.md` | `specs/**` | Arquivos em specs/ |
| `implementation.instructions.md` | `src/**, tests/**` | Arquivos em src/ ou tests/ |
| `adr-files.instructions.md` | `docs/adr/**` | Arquivos em docs/adr/ |

### Onboarding no Copilot

O Copilot **não tem slash commands**. O equivalente ao `/onboard` do Claude Code é manual:

1. Abra `docs/ONBOARDING-PROMPT.md`
2. Selecione todo o conteúdo (Ctrl+A)
3. Cole no Copilot Chat

O arquivo contém os passos completos (stack → PROJECT.md → blueprint → ADR-000 → DOMAIN.md) com instruções para o Copilot executar em sequência.

Alternativamente, o Copilot ativa `onboarding.instructions.md` automaticamente quando você edita arquivos em `.sdd/memory/` — mas sem a condução interativa dos gates.

### Análise de features (/analyze equivalente)

No Copilot Chat, descreva:

```
Antes de implementar, analise o código relevante para esta feature:
"[descrição da feature]"
Identifique: módulos afetados, padrões em uso, riscos e edge cases.
```

### Sync (/sync equivalente)

No Copilot Chat:

```
Compare a spec em specs/[story-id]/spec.bdd.md com o código atual em src/.
Identifique divergências e sugira como atualizá-los para ficarem alinhados.
```

### Frontmatter obrigatório (instructions files)

```markdown
---
applyTo: "specs/**"
---

Conteúdo da instrução aqui.
```

### Diferença do Cursor

O Copilot usa `applyTo` (um padrão de glob). O Cursor usa `globs` com a mesma semântica, mas também suporta `alwaysApply: true` para regras globais — o Copilot usa o `copilot-instructions.md` para isso.

### O que vai em cada arquivo

```
copilot-instructions.md          — contexto base, dois modos, princípios, regras
spec-files.instructions.md       — estrutura de specs, templates, regras de localização
implementation.instructions.md   — TDD, anti-patterns, fixtures, sugerir /sync
adr-files.instructions.md        — nomenclatura, template, quando criar
```

---

## Claude Code

O Claude Code usa dois mecanismos:

| Mecanismo | Arquivo/Pasta | Função |
|-----------|--------------|--------|
| Root instructions | `CLAUDE.md` | Lido automaticamente ao abrir o projeto |
| Slash commands | `.claude/commands/*.md` | Comandos invocados com `/nome` |

### Comandos disponíveis

| Comando | Arquivo | O que faz |
|---------|---------|-----------|
| `/onboard` | `onboard.md` | Analisa projeto existente |
| `/analyze` | `analyze.md` | Análise estratégica antes de implementar |
| `/feature` | `feature.md` | Pipeline completo com gates |
| `/plan` | `plan.md` | Planeja sem implementar |
| `/spec` | `spec.md` | Gera spec BDD |
| `/implement` | `implement.md` | TDD a partir da spec |
| `/review` | `review.md` | Valida código vs spec |
| `/sync` | `sync.md` | Sincroniza spec ↔ código |

---

## Comparativo rápido

| | Cursor | GitHub Copilot | Claude Code |
|--|--------|---------------|-------------|
| Config global | `sdd-kit.mdc` (alwaysApply) | `copilot-instructions.md` | `CLAUDE.md` |
| Config contextual | `*.mdc` com `globs` | `*.instructions.md` com `applyTo` | Slash commands |
| Pasta | `.cursor/rules/` | `.github/instructions/` | `.claude/commands/` |
| Formato | Markdown com frontmatter YAML | Markdown com frontmatter YAML | Markdown puro |
| Comandos | Não tem (regras automáticas) | Não tem (regras automáticas) | `/feature`, `/sync`, etc. |

---

## Setup inicial

```bash
# 1. Clone o SDD Kit
git clone https://github.com/{org}/sdd-kit.git meu-projeto

# 2. Inicialize (detecta stack automaticamente)
./sdd init meu-projeto

# 3. Para Cursor: abra o projeto — as regras já estão em .cursor/rules/
# Para Copilot: já está em .github/ — funciona automaticamente
# Para Claude Code: abra o projeto — o CLAUDE.md é lido automaticamente

# 4. Configure o contexto do projeto
# Edite .sdd/memory/PROJECT.md

# 5. Para projetos existentes: rode o onboarding
# Claude Code: /onboard
```

---

## Manutenção das regras

As regras do Cursor e Copilot são adaptadores — elas **apontam para** o `.sdd/`, não duplicam conteúdo. Se uma regra está crescendo demais, o conteúdo provavelmente pertence ao `.sdd/PLAYBOOK.md` ou `.sdd/CONSTITUTION.md`.

**Quando atualizar regras**: quando a IDE muda de comportamento (nova versão do Cursor, nova feature do Copilot).

**Quando NÃO atualizar regras**: quando muda o processo ou os princípios — isso vai para `.sdd/`.
