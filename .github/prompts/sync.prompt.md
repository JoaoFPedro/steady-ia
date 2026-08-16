---
description: Sincroniza spec ↔ código bidirecionalmente — resolve drift pós-refactor ou pós-mudança de requisito.
agent: agent
model: Claude Sonnet 4
argument-hint: story-id
---

# /sync — Sincroniza spec ↔ código (Engineer & QA)

Sincronize spec e código bidirecionalmente.

> O código mudou (refactor, fix, PR review) mas a spec não acompanhou?
> A spec mudou (requisito novo) mas o código não reflete?
> Este comando resolve o drift.

## Pré-condições

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- `specs/{story-id}/spec.bdd.md` — spec atual (pode não existir no fluxo Jira/Azure)
- `specs/{story-id}/story.md` — story (com critérios de aceite se vier do fluxo Jira/Azure)
- `specs/{story-id}/blueprint.mermaid` — blueprint (se existir)
- Código em `src/` e testes em `tests/`
- [.sdd/memory/DECISIONS.md](../../.sdd/memory/DECISIONS.md) — ADRs

### Limpa marcador de pendência

Se `.sdd/.pending-sync` existir e seu conteúdo corresponder à `{story-id}` em questão, **remova o arquivo ao final do sync bem-sucedido**. Isso libera `/review` e `/feature`.

---

## Modos de operação

### Modo 1: Código → Spec (pós-refactor ou fluxo Jira/Azure)

Quando o código mudou por refactor, fix ou PR review e a spec precisa refletir a realidade. **Também é o modo do fluxo Jira/Azure** — quando `/implement` rodou sem `spec.bdd.md` prévio e o `.pending-sync` está ativo.

1. Compare o código atual (e testes) com a spec existente — se houver
2. Identifique divergências:
   - Cenários BDD que não correspondem mais ao comportamento
   - Fluxos no blueprint que mudaram
   - Decisões tomadas no código que não estão em ADR
3. Atualize os artefatos:
   - `specs/{id}/spec.bdd.md` — ajuste cenários para refletir o comportamento atual (ou crie do zero a partir dos testes existentes)
   - `specs/{id}/blueprint.mermaid` — atualize se o fluxo mudou
   - `docs/adr/ADR-{NNN}.md` — crie se uma decisão foi tomada implicitamente no código
   - Atualize mapping cenário→teste

**Regra**: o código é a verdade. A spec se adapta ao que foi implementado e aprovado.

### Modo 2: Spec → Código (requisito mudou)

Quando o requisito mudou e a spec foi atualizada, mas o código ainda reflete o comportamento antigo.

1. Compare a spec atualizada com o código atual
2. Identifique o que precisa mudar:
   - Cenários novos que não têm teste
   - Cenários alterados cujos testes não refletem
   - Cenários removidos cujos testes devem ser removidos
3. Para cada divergência:
   - Se cenário novo: siga TDD (RED → GREEN → REFACTOR)
   - Se cenário alterado: atualize o teste primeiro (RED), depois o código (GREEN)
   - Se cenário removido: remova teste e código morto
4. Atualize mapping cenário→teste

**Regra**: a spec é a intenção. O código se adapta ao que foi especificado e aprovado.

---

## Output — Relatório antes de agir

Apresente um relatório de divergências antes de fazer qualquer mudança:

```
Sync Report — STORY-042

Direção: Código → Spec  (ou Spec → Código)

Divergências encontradas:
  [ALTERADO] Cenário "Login com email" — comportamento mudou no refactor
  [NOVO]     Cenário "Login com 2FA" — existe no código, não na spec
  [REMOVIDO] Cenário "Login com username" — removido no código

Artefatos a atualizar:
  • specs/STORY-042/spec.bdd.md — 2 cenários a ajustar, 1 a adicionar
  • specs/STORY-042/blueprint.mermaid — fluxo de auth mudou
  • docs/adr/ — nenhum ADR necessário

Prosseguir com a sincronização?
```

**PARE e espere confirmação antes de fazer qualquer alteração.**

Após a confirmação e execução das mudanças, remova `.sdd/.pending-sync` se ele apontar para esta story.

---

## Quando usar

- Depois de um refactor que mudou comportamento
- Depois de um PR review que alterou a implementação
- Quando o PO mudou requisitos e a spec foi atualizada
- Periodicamente, para garantir que spec e código não driftaram
- Antes de iniciar uma nova feature em área que já foi modificada
- Sempre que `.sdd/.pending-sync` estiver presente

## Regra fundamental

> Spec e código devem contar a mesma história. Se divergem, um dos dois está errado.
> O `/sync` identifica a divergência. O humano decide qual lado é a verdade.
