# Patterns

## Formatos

```
Narrativa, contexto    →  .md
Dados, fixtures        →  .json
Diagramas              →  .mermaid
```

## Output de artefatos

| Fazendo... | Salva em | Formato |
|-----------|---------|---------|
| Planejando story | `specs/{id}/story.md` | .md |
| Escrevendo spec | `specs/{id}/spec.bdd.md` | .md |
| Desenhando fluxo | `specs/{id}/blueprint.mermaid` | .mermaid |
| Registrando decisão | `docs/adr/ADR-{NNN}.md` | .md |
| Quebrando em tasks | `specs/{id}/tasks.md` | .md |
| Gerando fixtures | `tests/fixtures/{nome}.json` | .json |

## Nomenclatura

**Branches**: `{type}/{story-id}-{descricao}` — tipos: feature, fix, chore, refactor, docs.

**Commits**: Conventional Commits — `{type}({scope}): {descricao}`

## Fixtures

```json
{
  "_meta": { "story": "STORY-001", "scenario": "Nome do cenário" },
  "input": { },
  "expected": { }
}
```
