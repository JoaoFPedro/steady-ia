---
description: Sessão colaborativa Three Amigos — transforma story em cenários BDD (story.md + spec.bdd.md).
agent: ask
model: Claude Opus 4.7
argument-hint: story-id (opcional)
---

<!-- GERADO por tools/build.py — edite a fonte em kit/, não este arquivo -->

# /shape — Especificação BDD (Produto & Design)

Sessão colaborativa de especificação BDD com Produto & Design.

> Este comando é para **Produto & Design**, não para o Engineer & QA.
> O `/shape` vem depois do `/triage` — a decisão "Construir" já foi tomada.
> BDD é uma prática de Three Amigos — produto, design e QA constroem a spec juntos.

## Pré-condições

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- `.discovery/{DISC-ID}/` — problema, hipótese e decisão do discovery (se existir)
- [.sdd/memory/DOMAIN.md](../../.sdd/memory/DOMAIN.md) — entidades e fluxos existentes
- [.sdd/memory/PROJECT.md](../../.sdd/memory/PROJECT.md) — contexto do projeto
- [.sdd/PROJECT-CONSTITUTION.md](../../.sdd/PROJECT-CONSTITUTION.md) — lei do projeto
- `docs/documenta-ai/business/*-Rules.md` — Matriz de Cenários, se a funcionalidade já existe no código

> Se não há discovery associado: pergunte ao PD qual problema esta story resolve antes de avançar.
> O discovery não é obrigatório para stories simples e bem compreendidas — mas deve existir para features novas.



Aplique também as regras de [spec-files.instructions.md](../instructions/spec-files.instructions.md).
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

## Caminho reverso — spec a partir de código que já existe

Quando a story mexe em comportamento **já implementado**, não há discovery e mesmo assim a Constituição exige spec antes de tocar no código. O `/documenta-ai` resolve o impasse: rode-o no controller afetado e use a **Matriz de Cenários** de `docs/documenta-ai/business/{arquivo}-Rules.md` como entrada desta sessão.

Cada linha da matriz vira um cenário:

| Coluna da matriz | Vira |
|---|---|
| Cenário | `Scenario:` — o nome, no imperativo |
| Entrada | `Given` — estado e dados de partida |
| Ação do Sistema | `When` — a ação disparada |
| Resultado Esperado | `Then` — o resultado observável |

```gherkin
# | Rejeitar pedido acima do limite | pedido R$15k, aprovador limite R$10k | valida alçada | 422 + mensagem de alçada |

Scenario: Rejeitar pedido acima do limite do aprovador
  Given um pedido de R$ 15.000
  And um aprovador com limite de R$ 10.000
  When o aprovador tenta aprovar o pedido
  Then a aprovação é recusada com status 422
  And a mensagem informa o limite de alçada excedido
```

Regras da conversão:

- A matriz descreve o comportamento **atual**. Comportamento que o produto quer mudar não é conversão — é cenário novo, escrito na sessão e marcado como mudança.
- Uma linha que embute happy path e erro vira dois cenários.
- Cenário convertido **ainda passa pelo Three Amigos**: a matriz acelera a sessão, não a substitui.
- Registre a origem no topo da `spec.bdd.md`: `Origem: docs/documenta-ai/business/{arquivo} (commit {sha})`.
- Sem matriz e com código legado na área: **PARE** e sugira `/documenta-ai {Controller}` antes de continuar.

---

## Output

`specs/{story-id}/story.md` + `specs/{story-id}/spec.bdd.md` — aprovados pelo produto, prontos para o Engineer & QA iniciar `/build`.

Se o fluxo tem mais de 2 passos, adicione `specs/{story-id}/blueprint.mermaid`.
