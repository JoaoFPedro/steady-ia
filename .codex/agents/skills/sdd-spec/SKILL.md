---
name: sdd-spec
description: Conduz especificação BDD colaborativa após discovery e produz story e cenários aprovados. Use quando o usuário pedir /spec ou quiser formalizar comportamento antes da implementação.
---
## /spec

Sessão colaborativa de especificação BDD com Produto & Design.

> Este comando é para **Produto & Design**, não para o Engineer & QA.
> O `/spec` vem depois do `/discover` — a decisão "Construir" já foi tomada.
> BDD é uma prática de Three Amigos — produto, design e QA constroem a spec juntos.

### Contexto

1. `.discovery/{DISC-ID}/` — problema, hipótese e decisão do discovery (se existir)
2. `.sdd/memory/DOMAIN.md` — entidades e fluxos existentes
3. `.sdd/memory/PROJECT.md` — contexto do projeto

> Se não há discovery associado: pergunte ao PD qual problema esta story resolve antes de avançar.
> O discovery não é obrigatório para stories simples e bem compreendidas — mas deve existir para features novas.

### Sessão de especificação

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

### Output

`specs/{story-id}/story.md` + `specs/{story-id}/spec.bdd.md` — aprovados pelo produto, prontos para o Engineer & QA iniciar `/implement`.
