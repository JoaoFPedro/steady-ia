---
description: TDD a partir da spec BDD aprovada — RED → GREEN → REFACTOR por cenário.
agent: agent
model: Claude Sonnet 4
argument-hint: story-id
---

# /implement — TDD a partir da spec (Engineer & QA)

TDD a partir da spec BDD.

## Pré-condições

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- [.sdd/CONSTITUTION.md](../../.sdd/CONSTITUTION.md)
- [.sdd/PROJECT-CONSTITUTION.md](../../.sdd/PROJECT-CONSTITUTION.md)
- [.sdd/PLAYBOOK.md](../../.sdd/PLAYBOOK.md) — consulte patterns de teste no RED, refactorings no REFACTOR
- [.sdd/memory/PROJECT.md](../../.sdd/memory/PROJECT.md)
- `specs/{story-id}/` — todos os artefatos
- Observe o código existente

### Process guard: spec BDD obrigatória

Identifique a `{story-id}` a partir do prompt do usuário ou do nome da branch atual (padrões: `STORY-NNN`, `US-NNN`, `ISSUE-NNN`, `[A-Z]+-NNN`).

Cheque se `specs/{story-id}/spec.bdd.md` existe **e contém pelo menos um `Scenario:`**:

- **Spec presente**: fluxo padrão — prossiga com TDD.
- **Spec ausente** (fluxo "Jira/Azure story"): isso é permitido, mas crie o marcador `.sdd/.pending-sync` contendo `{story-id}` e avise ao usuário:

  > ⚠️ Fluxo Jira/Azure detectado: spec BDD ausente para `{story-id}`. Implementação seguirá a partir dos critérios de aceite da story (use `specs/{story-id}/story.md` como base se existir, ou os critérios fornecidos no chat). Ao concluir, execute `/sync` para gerar a `spec.bdd.md` a partir do código. Sem `/sync`, os comandos `/review` e `/feature` estarão bloqueados para esta story.

  Aplique TDD normalmente. **Não** crie `spec.bdd.md` neste momento — isso é responsabilidade do `/sync`.

Aplique também as regras de [implementation.instructions.md](../instructions/implementation.instructions.md), que dispara em `src/**` e `tests/**`.

---

## Ciclo para CADA cenário

```
🔴 RED      — teste baseado no Given/When/Then. DEVE falhar.
🟢 GREEN    — mínimo para passar. KISS. Sem antecipar.
🔄 REFACTOR — SOLID + DRY. Todos os testes DEVEM passar.
```

Ordem: happy path → edge cases → error cases. **Não avance sem o anterior verde.**

Se a spec não cobre algo: PARE, informe, proponha cenários (não os escreva sozinho — isso é Three Amigos).

### Fixtures de teste

Para cada fixture nova, inclua bloco `_meta` rastreando a spec:

```json
{
  "_meta": {
    "story": "STORY-NNN",
    "scenario": "Nome do cenário Gherkin"
  },
  "...": "dados da fixture"
}
```

---

## Pós-execução

Se decisão arquitetural surgir durante o ciclo (mudança de padrão, nova dependência, breaking change): proponha `docs/adr/ADR-{NNN}.md` antes de continuar.

Ao concluir todos os cenários:
- Se você entrou no fluxo "Jira/Azure" (sem spec inicial): lembre o usuário de rodar `/sync`.
- Caso contrário: sugira `/review` para validar contra a spec.
