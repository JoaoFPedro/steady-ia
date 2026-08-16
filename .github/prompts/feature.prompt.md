---
description: Pipeline completo — captura → instrumentação → spec BDD → TDD. Para uso solo ou time pequeno.
agent: agent
model: Claude Opus 4
argument-hint: story-id ou descrição da feature
---

# /feature — Pipeline completo (Produto & Design + Engineer & QA)

Pipeline completo: análise → captura → spec → blueprint → ADR → TDD → sync.

> Se a feature é complexa ou toca áreas desconhecidas, rode `/analyze` primeiro.
> Ao final, rode `/sync` para garantir que spec e código estão alinhados.

## Pré-condições

### Process guard: bloqueio se `/sync` pendente

**Primeiro**, verifique se o arquivo `.sdd/.pending-sync` existe.

- Se existir: **RECUSE** a execução. Apresente esta mensagem e pare:

  > ⛔ **BLOQUEIO**: `/feature` não pode ser executado agora.
  >
  > Motivo: `/implement` foi executado sem spec BDD para a story `{conteúdo de .sdd/.pending-sync}`. O `/sync` ainda não foi executado.
  >
  > Execute agora:
  > - `/sync` → gera a spec BDD a partir do código implementado
  >
  > Somente após o `/sync` o fluxo pode continuar.

- Se não existir: prossiga.

### Leituras obrigatórias

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- [.sdd/CONSTITUTION.md](../../.sdd/CONSTITUTION.md)
- [.sdd/PROJECT-CONSTITUTION.md](../../.sdd/PROJECT-CONSTITUTION.md)
- [.sdd/STACK.md](../../.sdd/STACK.md)
- [.sdd/PLAYBOOK.md](../../.sdd/PLAYBOOK.md)
- [.sdd/memory/PROJECT.md](../../.sdd/memory/PROJECT.md)
- [.sdd/memory/DECISIONS.md](../../.sdd/memory/DECISIONS.md)

Se a feature vem de uma discovery, leia também `.discovery/{DISC-ID}/`.

---

## Fase 1 — Captura

1. Crie `specs/{story-id}/story.md` com persona, ação, benefício (referencie o discovery se existir)
2. Liste critérios de aceite verificáveis
3. **PARE**: "Critérios OK? Posso avançar?"

## Fase 2 — Instrumentação

1. Avalie se precisa blueprint → `specs/{id}/blueprint.mermaid`
2. Avalie se há decisão arquitetural → `docs/adr/ADR-{NNN}.md`
3. **PARE**: "Arquitetura OK? Posso gerar spec BDD?"

## Fase 3 — Spec BDD + Tasks

1. Escreva `specs/{id}/spec.bdd.md` — happy path, edge cases, error cases
2. Quebre em `specs/{id}/tasks.md`
3. **PARE**: "Spec e tasks OK? Posso implementar?"

## Fase 4 — TDD

Para cada cenário BDD:
```
🔴 RED      — teste que falha
🟢 GREEN    — mínimo para passar (KISS)
🔄 REFACTOR — SOLID + DRY, mantendo verde
```

Não avance sem o cenário anterior verde.

---

## Pós-execução

Ao concluir, sugira `/review` (valida contra spec + OWASP) e `/sync` se algo divergiu durante a implementação.
