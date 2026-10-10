---
name: build
title: TDD a partir da spec
role: Engineer & QA
description: TDD a partir da spec BDD aprovada — RED → GREEN → REFACTOR por cenário.
model: execution
agent: agent
argument-hint: story-id
instructions: [implementation]
---

TDD a partir da spec BDD.

## Pré-condições

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- `.sdd/CONSTITUTION.md`
- `.sdd/PROJECT-CONSTITUTION.md`
- `.sdd/PLAYBOOK.md` — consulte patterns de teste no RED, refactorings no REFACTOR
- `.sdd/memory/PROJECT.md`
- `specs/{story-id}/` — todos os artefatos
- Observe o código existente

### Process guard: spec BDD obrigatória

Identifique a `{story-id}` a partir do prompt do usuário ou do nome da branch atual (padrões: `STORY-NNN`, `US-NNN`, `ISSUE-NNN`, `[A-Z]+-NNN`).

Cheque se `specs/{story-id}/spec.bdd.md` existe **e contém pelo menos um `Scenario:`**:

- **Spec presente**: fluxo padrão — prossiga com TDD.
- **Spec ausente** (fluxo "Jira/Azure story"): isso é permitido, mas crie o marcador `.sdd/.pending-sync` contendo `{story-id}` e avise ao usuário:

  > ⚠️ Fluxo Jira/Azure detectado: spec BDD ausente para `{story-id}`. Implementação seguirá a partir dos critérios de aceite da story (use `specs/{story-id}/story.md` como base se existir, ou os critérios fornecidos no chat). Ao concluir, execute `/reflect` para gerar a `spec.bdd.md` a partir do código. Sem `/reflect`, os comandos `/check` e `/feature` estarão bloqueados para esta story.

  Aplique TDD normalmente. **Não** crie `spec.bdd.md` neste momento — isso é responsabilidade do `/reflect`.

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

## Fase final — `/check` automático

Quando **todos os cenários da spec estão verdes**, execute imediatamente o fluxo do `/check` (sem esperar comando do usuário): valide código vs spec, rode o checklist OWASP Top 10, detecte anti-patterns e overengineering. Produza o relatório de review como parte da entrega.

O `/check` não é um comando manual no fluxo padrão — é a **fase de fechamento** do `/build`. O usuário só precisa rodar `/check` manualmente quando quiser re-validar código já entregue.

> Exceção: se você entrou no fluxo Jira/Azure (sem spec BDD), **pule o `/check`** e instrua o usuário a rodar `/reflect` primeiro. O `/check` só pode rodar depois da spec existir.

---

## Pós-execução

Se decisão arquitetural surgir durante o ciclo (mudança de padrão, nova dependência, breaking change): proponha `docs/adr/ADR-{NNN}.md` antes de continuar.

Ao concluir todos os cenários:
- Rode `/documenta-ai --incremental` nos módulos criados ou alterados por esta story, incluindo código ainda não commitado. Crie os três documentos se o módulo for novo; atualize os existentes e o `INDEX.md` se já estiver documentado. Só conclua a entrega após verificar que a documentação descreve o comportamento implementado.
- Fluxo Jira/Azure (sem spec inicial): lembre o usuário de rodar `/reflect`.
- Caso contrário: apresente o relatório do `/check` executado na fase final.
