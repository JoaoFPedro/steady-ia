---
name: sdd-implement
description: Implementa uma story existente por TDD a partir de sua spec BDD e encerra com revisão. Use quando o usuário pedir /implement ou solicitar implementação de uma story já especificada.
---
## /implement

TDD a partir da spec BDD.

### Contexto

1. `.sdd/CONSTITUTION.md`
2. `.sdd/PLAYBOOK.md` — consulte patterns de teste no RED, refactorings no REFACTOR
3. `.sdd/memory/PROJECT.md`
4. `specs/{story-id}/` — todos os artefatos
5. Observe o código existente

### Ciclo para CADA cenário

```
🔴 RED      — teste baseado no Given/When/Then. DEVE falhar.
🟢 GREEN    — mínimo para passar. KISS. Sem antecipar.
🔄 REFACTOR — SOLID + DRY. Todos os testes DEVEM passar.
```

Ordem: happy path → edge cases → error cases. Não avance sem o anterior verde.

Se a spec não cobre algo: PARE, informe, proponha cenários.

---

### Fase final — `/review` automático

Quando **todos os cenários da spec estão verdes**, execute imediatamente o fluxo do `/review` (sem esperar comando do usuário): valide código vs spec, rode o checklist OWASP Top 10, detecte anti-patterns e overengineering. Produza o relatório de review como parte da entrega.

O `/review` não é mais um comando manual no fluxo padrão — é a **fase de fechamento** do `/implement`. O usuário só precisa rodar `/review` manualmente quando quiser re-validar código que já foi entregue.

> Exceção: se o `process-guard` indicou fluxo Jira/Azure (sem spec BDD), pule o `/review` e instrua o usuário a rodar `/sync` primeiro. O `/review` só pode rodar depois da spec existir.
