---
applyTo: "specs/**"
---

<!-- GERADO por tools/build.py — edite a fonte em kit/, não este arquivo -->

# Spec files — localização e estrutura

Você está em `specs/`. Todo planejamento vive aqui — cada história tem sua subpasta:

```
specs/{story-id}/
├── story.md          # Persona, ação, benefício (obrigatório)
├── spec.bdd.md       # Cenários BDD (obrigatório)
├── analysis.md       # Análise estratégica (/analyze)
├── blueprint.mermaid # Fluxo (se > 2 passos)
└── tasks.md          # Breakdown de tasks
```

## Regras

- Use os templates de `.sdd/templates/`
- Leia `.sdd/memory/PROJECT.md` e `.sdd/memory/DOMAIN.md` antes de escrever
- Não crie arquivos de código aqui — `specs/` é só para planejamento
- `story.md` é sempre o primeiro arquivo criado
- `spec.bdd.md` é obrigatório — sem spec, sem implementação
- Nunca crie specs fora de `specs/`
