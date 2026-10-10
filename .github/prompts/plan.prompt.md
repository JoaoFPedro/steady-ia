---
description: Planeja uma história sem implementar — story, spec BDD, blueprint, ADR e tasks.
agent: agent
model: Claude Opus 4.7
argument-hint: story-id
---

<!-- GERADO por tools/build.py — edite a fonte em kit/, não este arquivo -->

# /plan — Planejamento de história (Produto & Design)

Planeja uma história sem implementar. Use quando quiser formalizar o planejamento completo antes do Engineer & QA iniciar.

## Pré-condições

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- [.sdd/CONSTITUTION.md](../../.sdd/CONSTITUTION.md)
- [.sdd/PROJECT-CONSTITUTION.md](../../.sdd/PROJECT-CONSTITUTION.md)
- [.sdd/memory/PROJECT.md](../../.sdd/memory/PROJECT.md)
- [.sdd/memory/DECISIONS.md](../../.sdd/memory/DECISIONS.md)
- `.discovery/{DISC-ID}/` — se a story vem de uma discovery



Aplique também as regras de [spec-files.instructions.md](../instructions/spec-files.instructions.md), [adr-files.instructions.md](../instructions/adr-files.instructions.md).
---

## Passos

1. `specs/{story-id}/story.md` — persona, ação, benefício, critérios de aceite (referencie o discovery se houver)
2. `specs/{story-id}/spec.bdd.md` — cenários happy path, edge cases, error cases
3. Se fluxo > 2 passos: `specs/{story-id}/blueprint.mermaid`
4. Se decisão arquitetural: `docs/adr/ADR-{NNN}.md`
5. `specs/{story-id}/tasks.md` — tasks ordenadas

Ao final, apresente um sumário dos artefatos gerados e pergunte se a story está pronta para o Engineer & QA executar `/build`.
