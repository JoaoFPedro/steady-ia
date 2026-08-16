## /feature

Pipeline completo: análise → captura → spec → blueprint → ADR → TDD → sync.

> Se a feature é complexa ou toca áreas desconhecidas, rode `/analyze` primeiro.
> Ao final, rode `/sync` para garantir que spec e código estão alinhados.

### Contexto

1. `.sdd/CONSTITUTION.md`
2. `.sdd/STACK.md`
3. `.sdd/memory/PROJECT.md`
4. `.sdd/memory/DECISIONS.md`

### Fase 1 — Captura

1. Crie `specs/{story-id}/story.md` com persona, ação, benefício
2. Liste critérios de aceite verificáveis
3. **PARE**: "Critérios OK? Posso avançar?"

### Fase 2 — Instrumentação

1. Avalie se precisa blueprint → `specs/{id}/blueprint.mermaid`
2. Avalie se há decisão arquitetural → `docs/adr/ADR-{NNN}.md`
3. **PARE**: "Arquitetura OK? Posso gerar spec BDD?"

### Fase 3 — Spec BDD + Tasks

1. Escreva `specs/{id}/spec.bdd.md` — happy path, edge cases, error cases
2. Quebre em `specs/{id}/tasks.md`
3. **PARE**: "Spec e tasks OK? Posso implementar?"

### Fase 4 — TDD

Para cada cenário BDD:
```
🔴 RED     — teste que falha
🟢 GREEN   — mínimo para passar (KISS)
🔄 REFACTOR — SOLID + DRY, mantendo verde
```

Não avance sem o cenário anterior verde.
