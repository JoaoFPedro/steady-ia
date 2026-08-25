---
name: sdd-plan
description: Planeja uma story com critérios, BDD, blueprint, ADR e tarefas sem implementar código. Use quando o usuário pedir /plan ou quiser somente o plano de uma história.
---
## /plan

Planeja uma história sem implementar.

### Contexto

1. `.sdd/CONSTITUTION.md`
2. `.sdd/memory/PROJECT.md`
3. `.sdd/memory/DECISIONS.md`

### Passos

1. `specs/{story-id}/story.md` — persona, ação, benefício, critérios de aceite
2. `specs/{story-id}/spec.bdd.md` — cenários happy path, edge cases, error cases
3. Se fluxo > 2 passos: `specs/{story-id}/blueprint.mermaid`
4. Se decisão arquitetural: `docs/adr/ADR-{NNN}.md`
5. `specs/{story-id}/tasks.md` — tasks ordenadas
