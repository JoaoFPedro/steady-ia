---
name: lightweight-mode
title: isabel — Modo leve (Cursor Agent)
description: Modo leve para fixes e mudanças pequenas via agent do Cursor
applies: src/**,tests/**
targets: [cursor]
---

Para tarefas simples (fix, ajuste, refactor pequeno), use o agent do Cursor normalmente.

## Antes de codificar

1. Leia `.sdd/STACK.md` — convenções da stack
2. Leia `.sdd/PLAYBOOK.md` — patterns e anti-patterns

## Ao terminar

Sugira ao dev: "Mudança feita. Rode `/reflect` no Claude Code para manter spec e código alinhados."

## Quando escalar para /feature

Se durante a tarefa você perceber que:
- Precisa de mais de 3 arquivos novos
- Envolve decisão arquitetural
- Muda um fluxo inteiro
- Precisa de cenários BDD novos

→ Pare e sugira: "Isso parece maior que um fix. Considere usar `/feature` para planejar."
