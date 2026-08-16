---
description: Sessão colaborativa Three Amigos — transforma story em cenários BDD (story.md + spec.bdd.md).
agent: ask
model: Claude Opus 4
argument-hint: story-id (opcional)
---

# /spec — Especificação BDD (Produto & Design)

Sessão colaborativa de especificação BDD com Produto & Design.

> Este comando é para **Produto & Design**, não para o Engineer & QA.
> O `/spec` vem depois do `/discover` — a decisão "Construir" já foi tomada.
> BDD é uma prática de Three Amigos — produto, design e QA constroem a spec juntos.

## Pré-condições

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- `.discovery/{DISC-ID}/` — problema, hipótese e decisão do discovery (se existir)
- [.sdd/memory/DOMAIN.md](../../.sdd/memory/DOMAIN.md) — entidades e fluxos existentes
- [.sdd/memory/PROJECT.md](../../.sdd/memory/PROJECT.md) — contexto do projeto
- [.sdd/PROJECT-CONSTITUTION.md](../../.sdd/PROJECT-CONSTITUTION.md) — lei do projeto

> Se não há discovery associado: pergunte ao PD qual problema esta story resolve antes de avançar.
> O discovery não é obrigatório para stories simples e bem compreendidas — mas deve existir para features novas.

Aplique também as regras de [spec-files.instructions.md](../instructions/spec-files.instructions.md), que dispara em `specs/**`.

---

## Sessão de especificação

Com o problema e a hipótese do discovery em mãos, formalize o comportamento esperado:

1. **Crie `specs/{story-id}/story.md`** com persona, ação e benefício — referencie o discovery:
   ```
   Discovery: .discovery/{DISC-ID}/
   ```
2. **Faça perguntas para surfaçar comportamentos** que o produto ainda não considerou:
   - "O que acontece quando...?"
   - "Qual o comportamento se o usuário não tiver permissão?"
   - "Existe estado inválido que precisamos tratar?"
   - "O que muda para o usuário que já usa o sistema hoje?"

3. **Escreva os cenários Gherkin** cobrindo: happy path, edge cases, error cases
4. Cada cenário: independente, determinístico, verificável
5. Valide cada cenário com o produto antes de avançar

---

## Output

`specs/{story-id}/story.md` + `specs/{story-id}/spec.bdd.md` — aprovados pelo produto, prontos para o Engineer & QA iniciar `/implement`.

Se o fluxo tem mais de 2 passos, adicione `specs/{story-id}/blueprint.mermaid`.
