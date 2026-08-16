---
applyTo: "specs/**"
---

# Spec files — regras de localização

Você está em `specs/`. Cada história tem sua subpasta:

```
specs/{story-id}/
├── story.md          # Persona, ação, benefício
├── spec.bdd.md       # Cenários BDD
├── analysis.md       # Análise estratégica (/analyze)
├── blueprint.mermaid # Fluxo (se > 2 passos)
└── tasks.md          # Breakdown de tasks
```

- Use os templates de `.sdd/templates/`
- Leia `.sdd/memory/PROJECT.md` e `.sdd/memory/DOMAIN.md` antes de escrever
- Não crie arquivos de código aqui — specs/ é só para planejamento
- `story.md` é sempre o primeiro arquivo criado
- `spec.bdd.md` é obrigatório — sem spec, sem implementação
