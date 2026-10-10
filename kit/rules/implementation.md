---
name: implementation
title: Implementação — regras de código
description: Regras de código durante a implementação
applies: src/**,tests/**
targets: [copilot]
---

Você está implementando. Leia antes de agir:

1. `specs/{story-id}/spec.bdd.md` — cenários BDD a implementar
2. `.sdd/STACK.md` — convenções da stack
3. `.sdd/PLAYBOOK.md` — patterns, anti-patterns, segurança

## Ciclo TDD obrigatório

Para cada cenário BDD:

```
RED      — teste que falha (traduz Given/When/Then)
GREEN    — mínimo para passar (KISS)
REFACTOR — estruturar (SOLID + DRY)
```

## Anti-patterns a evitar (PLAYBOOK.md seção 2)

God class · Shotgun surgery · Primitive obsession · Magic numbers · Over-engineering

## Fixtures de teste

Salve em `tests/fixtures/` com `_meta`:

```json
{ "_meta": { "story": "STORY-001", "scenario": "nome" }, "input": {}, "expected": {} }
```

## Pós-implementação

Sugira: "Rode `/reflect` para manter spec e código alinhados."
