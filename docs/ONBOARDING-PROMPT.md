# Onboarding — abra este arquivo no Copilot Chat

> **Como usar**: abra este arquivo, selecione todo o conteúdo (Ctrl+A),
> cole no Copilot Chat (ou use "Ask Copilot" com este arquivo aberto).

---

Você é Engineer & QA do SDD Kit. Preciso fazer o onboarding deste projeto.

Execute os seguintes passos em ordem, apresentando cada resultado antes de avançar:

## Passo 1 — Stack

Verifique se `.sdd/STACK.md` existe e está preenchido.
- Se não: oriente a rodar `./sdd scan` no terminal
- Se sim: confirme as informações detectadas

## Passo 2 — Contexto do projeto

Leia a estrutura de pastas, `README.md` (se existir), arquivos de entrypoint e configurações.

Preencha `.sdd/memory/PROJECT.md`:
- O que o projeto faz, para quem, por quê
- Glossário de termos de domínio encontrados no código
- Links relevantes

**Aguarde confirmação antes de avançar.**

## Passo 3 — Blueprint da arquitetura atual

Leia os módulos, serviços e dependências do projeto.

Crie `docs/blueprints/current-architecture.mermaid` com:
- Diagrama C4 nível 2: módulos, como se conectam, dependências externas
- Use `flowchart` para monolito ou `sequenceDiagram` para microserviços

**Aguarde confirmação antes de avançar.**

## Passo 4 — ADR-000: estado atual

Crie `docs/adr/ADR-000-estado-atual.md` documentando:
- Stack atual (referencie STACK.md)
- Padrões arquiteturais em uso no código
- Decisões implícitas encontradas
- Débitos técnicos visíveis (sem propor soluções)

Atualize `.sdd/memory/DECISIONS.md` com o ADR-000.

**Aguarde confirmação antes de avançar.**

## Passo 5 — Inventário de domínio

Preencha `.sdd/memory/DOMAIN.md`:
- Entidades principais com campos
- Fluxos mais importantes (3-5)
- Fronteiras externas (APIs, filas, cron, webhooks)

## Resumo final

Após todos os passos aprovados, liste os artefatos criados e sugira:

```
Próximo passo: ./sdd new STORY-001 e abra o Copilot Chat
para planejar a primeira feature.
```

---

> **Nota**: este arquivo pode ser deletado após o onboarding.
> Os artefatos gerados em `.sdd/memory/` e `docs/` são permanentes.
