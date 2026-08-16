---
description: Onboarding em projeto com código existente — gera blueprint, ADR-000 e inventário de domínio.
agent: agent
model: Claude Opus 4
---

# /onboard — Onboarding em projeto existente (Produto & Design)

Analise um projeto existente e gere os artefatos iniciais do SDD Kit.

> Use este comando na **primeira sessão** com um projeto que já tem código.
> Pré-requisito: `./sdd init` e `./sdd scan` já executados.

## Pré-condições

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- [.sdd/CONSTITUTION.md](../../.sdd/CONSTITUTION.md) — regras do framework
- [.sdd/STACK.md](../../.sdd/STACK.md) — stack detectada pelo scan
- [.sdd/PLAYBOOK.md](../../.sdd/PLAYBOOK.md) — patterns e anti-patterns
- A **estrutura de pastas** do projeto (tree de diretórios)
- Os **arquivos principais**: entrypoints, configs, routers, models, schemas

Aplique também as regras de [onboarding.instructions.md](../instructions/onboarding.instructions.md), que dispara automaticamente em `.sdd/memory/**` e `.sdd/STACK.md`.

---

## O que gerar

Execute na seguinte ordem, apresentando cada artefato ao usuário antes de avançar.

### 0. Detectar conflitos com frameworks existentes

Antes de qualquer coisa, verifique se o projeto já tem artefatos que podem conflitar com o SDD Kit:

| O que procurar | Como detectar | Equivalência SDD Kit |
|---------------|---------------|----------------------|
| AI rules existentes | `.cursorrules`, `.cursor/rules/`, `copilot-instructions.md` próprio, `CLAUDE.md` próprio | `.cursor/rules/*.mdc`, `.github/instructions/`, `CLAUDE.md` (base SDD Kit) |
| BDD/Spec existente | `*.feature`, `features/`, `spec/`, Cucumber, SpecFlow, Behave | `specs/{id}/spec.bdd.md` |
| ADRs em outro formato | `docs/decisions/`, wiki links, Confluence, `*.adr.*` | `docs/adr/ADR-*.md` |
| Git hooks próprios | `.husky/`, `lint-staged`, hooks em `package.json` | `.sdd/hooks/` + `.claude/hooks/` |
| Regras de commit | Commitizen, custom scripts | Conventional Commits (já compatível) |

Para cada conflito encontrado, apresente ao usuário:
- O que foi encontrado e onde
- A equivalência no SDD Kit
- A ação recomendada (merge, migração gradual, ou manter lado a lado)

**Princípio**: Additive first — nunca delete artefatos existentes sem confirmação explícita. Conflitos reais geram ADR de migração.

**PARE**: "Encontrei os seguintes artefatos existentes: [lista]. Como deseja proceder?"

---

### 1. Atualizar `PROJECT.md`

Preencha `.sdd/memory/PROJECT.md` com informações reais do projeto:

- **Contexto**: o que o projeto faz, para quem, por quê (inferido do código)
- **Glossário**: termos de domínio encontrados no código (models, entidades, conceitos)
- **Links**: repositório, README existente, docs

**PARE**: "O contexto do projeto está correto? Posso avançar?"

---

### 2. Gerar blueprint da arquitetura atual

Crie `docs/blueprints/current-architecture.mermaid` com:

- Diagrama de componentes (C4 nível 2): quais módulos/serviços existem
- Como se conectam (HTTP, filas, banco, etc.)
- Dependências externas (APIs, serviços terceiros)

Escolha o tipo de diagrama mais adequado:
- **flowchart** se o projeto é um monolito com módulos
- **sequenceDiagram** se há comunicação entre serviços
- **ambos** se necessário

**PARE**: "Blueprint está correto? Posso avançar?"

---

### 3. Gerar ADR-000 — Estado atual

Crie `docs/adr/ADR-000-estado-atual.md` documentando:

- Stack atual (referenciando STACK.md)
- Padrões arquiteturais em uso (MVC, Clean Architecture, Hexagonal, etc.)
- Decisões implícitas encontradas no código (ex: "usa Repository pattern", "auth via JWT middleware")
- Débitos técnicos identificados (se visíveis)

O ADR-000 é especial — não é uma decisão, é o **snapshot do ponto de partida**.

Atualize `.sdd/memory/DECISIONS.md` com o ADR-000.

**PARE**: "ADR-000 está correto? Posso avançar?"

---

### 4. Inventário de domínio

Crie `.sdd/memory/DOMAIN.md` com:

- **Entidades**: os models/entities do projeto, com campos principais
- **Fluxos principais**: os 3-5 fluxos mais importantes do sistema (ex: "cadastro → login → pedido → pagamento")
- **Fronteiras**: onde o sistema se conecta com o mundo externo (APIs, webhooks, filas, cron)

**PARE**: "Inventário de domínio está correto?"

---

### 5. Apresentar resumo

Depois de tudo aprovado, apresente:

```
Onboarding completo.

Artefatos gerados:
  ✓ .sdd/memory/PROJECT.md      — contexto do projeto
  ✓ .sdd/memory/DOMAIN.md       — inventário de domínio
  ✓ .sdd/memory/DECISIONS.md    — atualizado com ADR-000
  ✓ docs/blueprints/current-architecture.mermaid
  ✓ docs/adr/ADR-000-estado-atual.md

Próximo passo: ./sdd new STORY-001 e /feature para a primeira história.
```

---

## Regras

- Não invente informação. Se não conseguir inferir, pergunte.
- Não crie specs — o onboarding documenta o que existe, não planeja trabalho novo.
- Não proponha refatorações. Apenas documente. As melhorias vêm como stories.
- Mantenha o blueprint simples. C4 nível 2 é suficiente. Não detalhe cada classe.
- Se o projeto for muito grande, foque nos módulos principais e marque os demais como "a detalhar".
