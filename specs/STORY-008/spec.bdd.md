# Spec BDD: STORY-008 — Aba Planejamento vira lista de planos criados

> **Story**: [story.md](./story.md)
> **Discovery**: [../../.discovery/DISC-002-plano-de-treino-semanal/](../../.discovery/DISC-002-plano-de-treino-semanal/)
> **Status**: Implementado — todos os cenários 🟢
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)

---

## Feature: Histórico de planos gerados na sessão

Cada envio do formulário de Planejamento cria uma entrada numa lista de
planos gerados (em memória, sem persistência — ver nota em `story.md`). A
aba Planejamento **é** essa lista, com um botão para criar mais um; criar e
visualizar um plano são rotas próprias, irmãs de `log/*`, não estados
alternados dentro da aba. A Dashboard usa a mesma lista para ir direto ao
plano mais recente.

### Regras de Negócio

1. Uma entrada é criada a cada "Gerar plano" — nunca ao editar o formulário
   sem enviar, nunca automaticamente.
2. Cada entrada guarda: id, `raceDistance`, `raceDate`, `createdAt` (momento
   da geração). O documento mostrado é sempre `TRAINING_PLAN_DOCUMENT` —
   nenhuma entrada tem conteúdo diferente de outra.
3. **A aba Planejamento é a lista de planos criados** — não um estado
   alternando com formulário/documento. Com `N = 0`, mostra uma mensagem
   ("você ainda não criou nenhum planejamento") e o botão de criar; com
   `N ≥ 1`, mostra um card por entrada, mais recente primeiro, e o mesmo
   botão abaixo da lista.
4. Cada card mostra: um selo de status ("Ativo" no plano mais recente,
   "Anterior" nos demais — cor de destaque só no "Ativo"), a distância da
   prova como título, "Prova em {data}" como subtítulo, e um `›`. **Sem**
   barra de progresso nem "semana X de Y" — o protótipo (`Steady - Marathon
   App.dc.html`, artboard 2c) mostra isso para o plano ativo, mas calcular
   em que semana o corredor está é a mesma geração dinâmica que o DISC-002
   exclui (hypothesis.md, correção de escopo); mostrar um número inventado
   violaria o princípio já registrado no STORY-006 ("o botão nunca promete
   um número que o resultado não cumpre").
5. O botão **"Criar planejamento"** e o toque num card navegam para rotas
   próprias — `/planning/new` (formulário) e `/planning/plan` (documento) —
   empilhadas sobre a aba, do mesmo jeito que `/log/run` já empilha sobre a
   Dashboard. `/planning/new` tem cabeçalho nativo do `Stack` (título
   "Criar planejamento", voltar automático); `/planning/plan` desenha o
   próprio cabeçalho (como `PlanningDocument` sempre fez) e por isso o
   `Stack` não mostra um por cima.
6. Ao gerar em `/planning/new`, a rota é **substituída** (`router.replace`)
   pelo documento — a pilha não acumula um formulário já enviado atrás do
   plano. Tocar em "Editar dados" no documento empurra `/planning/new` de
   novo (`router.push`); enviar de novo cria mais uma entrada (regra 1).
7. O botão **"Ver plano da semana"** da Dashboard verifica se existe algum
   plano: se sim, empurra direto `/planning/plan` (o mais recente); se não,
   empurra `/planning/new` — comportamento herdado do STORY-007.
8. Tocar num card da lista empurra o documento (mesmo conteúdo estático — o
   id não muda o que é renderizado, só identifica qual entrada foi tocada,
   preparando o terreno para quando a geração for real).
9. Nenhuma entrada é persistida além do processo atual do app — fechar e
   reabrir o app perde a lista (nota de produto em `story.md`: será
   persistida no backend numa story futura).

---

### Cenários — Happy Path

```gherkin
Scenario: Corredor sem plano nenhum abre a aba Planejamento
  Given que não gerei nenhum plano nesta sessão
  When toco na aba Planejamento
  Then vejo a mensagem de que ainda não criei nenhum planejamento
  And vejo o botão "Criar planejamento"
```

```gherkin
Scenario: Corredor com planos gerados abre a aba Planejamento
  Given que gerei um plano com distância "10" e data "2026-09-01"
  And depois gerei um plano com distância "42.2" e data "2027-04-12"
  When toco na aba Planejamento
  Then vejo dois cards, o mais recente primeiro
  And o primeiro card mostra "42.2" com o selo "Ativo"
  And o segundo card mostra "10" com o selo "Anterior"
  And nenhum card mostra barra de progresso ou "semana X de Y"
```

```gherkin
Scenario: Corredor toca em "Criar planejamento"
  Given que estou na aba Planejamento
  When toco em "Criar planejamento"
  Then vejo o formulário, com cabeçalho "Criar planejamento" e voltar
```

```gherkin
Scenario: Corredor gera um plano a partir do formulário
  Given que preenchi os campos obrigatórios em "/planning/new"
  When toco em "Gerar plano"
  Then vejo o documento do plano gerado
  And o card desse plano aparece na aba Planejamento como "Ativo"
```

```gherkin
Scenario: Corredor toca num card da lista
  Given que estou na aba Planejamento, com pelo menos um plano
  When toco em um dos cards
  Then vejo o documento daquele plano
```

```gherkin
Scenario: Corredor sem plano gerado toca no atalho da Dashboard
  Given que não gerei nenhum plano nesta sessão
  When toco em "Ver plano da semana" na Dashboard
  Then vejo o formulário de criação de planejamento
```

```gherkin
Scenario: Corredor com um plano gerado toca no atalho da Dashboard
  Given que gerei um plano nesta sessão
  When toco em "Ver plano da semana" na Dashboard
  Then vejo o documento do plano gerado, sem passar pelo formulário
```

```gherkin
Scenario: Corredor com vários planos gerados vai direto ao mais recente
  Given que gerei um plano com distância "10" e data "2026-09-01"
  And depois gerei um plano com distância "42.2" e data "2027-04-12"
  When toco em "Ver plano da semana" na Dashboard
  Then vejo o documento — mesmo conteúdo de sempre, mas o plano registrado
    como mais recente é o de distância "42.2"
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Corredor toca em "Editar dados" no documento
  Given que estou vendo o documento de um plano gerado
  When toco em "Editar dados"
  Then vejo o formulário de novo
```

```gherkin
Scenario: Gerar de novo a partir de "Editar dados" cria mais uma entrada
  Given que já tinha um plano gerado e toquei em "Editar dados"
  When preencho o formulário de novo e toco em "Gerar plano"
  Then a aba Planejamento passa a mostrar dois cards
  And o novo é o "Ativo"
```

---

### Cenários — Error Cases

Não há casos de erro: a lista é um array em memória, sempre consistente com
o que o próprio processo criou; não há leitura de fonte externa, rede, nem
parsing de dado que possa falhar.

---

## Mapping: Cenário → Teste

> Test runner: Jest (`.sdd/STACK.md`).

| Cenário | Testes | Status |
|---------|--------|--------|
| Criação de entrada a cada geração | `planning/__tests__/generatedPlansStore.test.ts` | 🟢 Green |
| Mais recente primeiro / plano mais recente | `planning/__tests__/generatedPlansStore.test.ts` | 🟢 Green |
| Sem plano gerado → lista vazia / formulário | `planning/__tests__/generatedPlansStore.test.ts` | 🟢 Green |
| Navegação (lista ↔ `/planning/new` ↔ `/planning/plan`, atalho da Dashboard) | — | 🔵 Manual — mesma limitação de `@testing-library/react-native` já registrada nas stories anteriores |

---

## Notas de Especificação

- **`generatedPlansStore.ts`** é o único lugar com estado — módulo com um
  array em memória e funções `addGeneratedPlan`, `listGeneratedPlans`,
  `latestGeneratedPlan`. Escolhido em vez de Context/estado elevado porque
  Dashboard e Planejamento são abas irmãs sem ancestral comum abaixo do
  `_layout.tsx` raiz, e o projeto não tem lib de estado global — um módulo
  singleton é o padrão mais simples que resolve o compartilhamento (mesmo
  espírito de `recordQueue`, embora sem persistência em `AsyncStorage`).
- **Rotas, não estado interno**: `/planning/new` e `/planning/plan` são
  telas próprias em `app/planning/`, registradas no `Stack` raiz — o mesmo
  padrão de `app/log/run.tsx` etc. A aba `(tabs)/planning.tsx` não guarda
  `useState<'form' | 'list' | 'document'>` nenhum; ela é só a lista, sempre.
  Isso substitui duas tentativas anteriores no mesmo dia que usaram estado
  interno da aba (uma com a lista como padrão, outra com o documento como
  padrão) — ambas erradas pelo mesmo motivo: misturavam "o que a aba
  mostra" com "para onde a navegação leva", que devem ser a mesma coisa
  numa lista mas rotas diferentes num fluxo de criar/ver.
- **Fora do escopo**: geração dinâmica de conteúdo por plano (todos os
  documentos são idênticos, herdado do DISC-002); apagar uma entrada da
  lista; persistir a lista além da sessão atual (nota em `story.md`).
- **Fonte visual**: layout e cópia da lista seguem o protótipo importado do
  Claude Design — `Steady - Marathon App.dc.html`, turno 2, artboard 2c
  ("Planejamento — depois de criado") — com a omissão deliberada da regra 4
  (barra de progresso/semana calculada).
