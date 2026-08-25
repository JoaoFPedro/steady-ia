# Spec BDD: STORY-012 — Do treino do dia ao registro, e o plano avançando sozinho

> **Story**: [story.md](./story.md)
> **Discovery**: [../../.discovery/DISC-003-do-treino-do-dia-ao-registro/](../../.discovery/DISC-003-do-treino-do-dia-ao-registro/)
> **Status**: Implementada — todos os cenários automatizáveis 🟢 (245 testes na suíte)
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)

---

## Feature: Do treino do dia ao registro, com o dia se fechando sozinho

O card *Plano da semana* passa a levar direto ao dia de hoje, aberto, na aba
**Semana** do planejamento em vigor. Do dia aberto sai o registro — o formulário
que já existe, sabendo qual treino era. E o dia se fecha **sozinho** quando os
registros daquela data satisfazem o que a grade previa: não há botão de "concluí",
não há tabela nova, não há gesto extra.

A Dashboard passa a mostrar quanto do plano de 24 semanas já foi percorrido.

**Três decisões dão forma a tudo:**

1. **Derivado, não carimbado.** Conclusão de dia é leitura sobre
   `RunningSession`/`StrengthSession`, não escrita. Nenhuma entidade nova,
   nenhuma exceção à Lei do Domínio #2 — as sessões já são imutáveis e a
   leitura herda isso.
2. **Calculado no app.** `trainingHistory()` já devolve as sessões e a grade
   (`weekPlan`) já está no app. É o único arranjo em que um registro **ainda na
   fila offline** fecha o dia na hora (ADR-003) — a API ainda não o conhece.
   Segue o precedente de `trainingProgress.ts` (STORY-011): aritmética de
   calendário, não regra de treino. FF-004 não é tocada — a leitura continua
   sendo via API .NET.
3. **Denominador fixo em 144.** Quem entra no plano no meio não chega a 100%, e
   a tela **diz isso** em vez de deixar o número parecer fracasso.

---

### Regras de Negócio

#### Navegação

1. O botão do card *Plano da semana* leva ao planejamento **mais recente** (o
   plano em vigor, mesma escolha da STORY-008 e da STORY-011), abrindo o
   documento na aba **Semana** com o dia de hoje **expandido e visível sem o
   corredor precisar rolar**.
2. Sem nenhum planejamento, o botão continua levando ao formulário de criação —
   comportamento atual, inalterado.
3. Chegando ao documento por outro caminho (tab bar → card da lista), ele
   continua abrindo na aba **Dados** com todos os dias fechados. Só o card da
   Dashboard abre na Semana.

#### O que cada dia prevê

4. Um dia prevê **corrida** quando `hasRun` é verdadeiro (terça, quinta, sábado)
   e prevê **musculação** quando tem exercícios (segunda a sexta). Domingo não
   prevê nada — `hasRun: false` e `exercises: []`. A grade já carrega essa
   informação; nada novo é escrito em `trainingPlanDocument.ts`.

#### Registrar a partir do dia

5. No dia expandido há **um botão por modalidade prevista**: "Registrar
   musculação" nos dias com exercícios, "Registrar corrida" nos dias com
   corrida. Terça e quinta têm os dois; domingo não tem nenhum.
6. Os botões aparecem **apenas no dia de hoje**. Dias passados e futuros mostram
   o detalhamento como hoje mostram, sem botão — o registro grava sempre com a
   data de hoje (`todayIso()`), e registro retroativo está fora de escopo.
7. O formulário aberto por esse caminho mostra, no topo, **qual era o treino do
   dia** — é o que faz o corredor não ter de lembrar o que acabou de ler.
8. Na musculação, o grupo muscular vem **pré-selecionado quando a grade é
   inequívoca**: Peito e tríceps → `PeitoTriceps`, Ombro → `Ombro`, Costas e
   bíceps → `BicepsCostas`. Nos dias de perna a grade diz só "Perna
   (pesada)"/"Perna (leve)" e os exercícios cobrem frontal e posterior — a
   escolha fica **em branco**, e a tela não adivinha.
9. Na corrida não há pré-preenchimento: distância, duração, ritmo e esforço são
   medidas do que aconteceu, não do que estava previsto.
10. Salvar o registro devolve o corredor ao dia de onde ele saiu, não à
    Dashboard.

#### Estado de cada dia (derivado, nunca gravado)

11. Um dia está **cumprido** quando **todas** as modalidades previstas têm ao
    menos um registro naquela data.
12. Um dia está **parcial** quando parte das previstas tem registro — só
    acontece em terça e quinta, os dias combinados.
13. Um dia está **não feito** quando é uma data **passada**, dentro da janela do
    plano, que previa treino e não tem registro nenhum.
14. **O dia em curso não recebe marca de falha.** Hoje sem registro não é "não
    feito" — ainda dá tempo. Dias futuros também não recebem marca.
15. Domingo nunca recebe marca de estado: não há o que cumprir.
16. Um registro ainda na **fila offline** conta como registro (ADR-003). O
    corredor confirmou o treino; a rede é problema do app, não dele.
17. O estado **não confere grupo muscular nem distância**: qualquer musculação
    naquela data satisfaz a musculação prevista, qualquer corrida satisfaz a
    corrida. Tolerante de propósito — casar `MuscleGroup` com a grade está fora
    de escopo.
18. Registrar de novo num dia já cumprido é permitido e não altera o estado —
    Lei do Domínio #2: correção gera registro novo, nunca sobrescreve.

#### A janela do plano e a porcentagem

19. A **janela do plano** são os **168 dias que terminam na data da prova** (24
    semanas × 7). Registro fora dela não conta para nada.
20. O **denominador é 144** — 24 semanas × 6 dias com treino (domingo é
    descanso). Fixo. Não depende de quando o corredor criou o planejamento.
    Como 168 dias contêm exatamente 24 de cada dia da semana, o número é exato.
21. O **numerador** são os dias **cumpridos** dentro da janela. Dia parcial não
    conta — meia quinta não é quinta.
22. A porcentagem nunca excede 100%.
23. Quando o planejamento foi criado **depois** do início da janela, a Dashboard
    **diz em que semana do plano o corredor entrou**. Sem esse texto, um teto de
    42% se lê como fracasso em vez de como entrada tardia.
24. Não há porcentagem quando: não existe planejamento, a prova está a mais de
    24 semanas (`beforeStart`), ou a prova já passou (`raceOver`). Nenhum desses
    estados inventa número — mesma disciplina da STORY-011.
25. Se o histórico **não puder ser lido**, a Dashboard não mostra porcentagem e
    avisa que não conseguiu ler. **Nunca 0%** — "não consegui ler" jamais vira
    "você não treinou nada" (ADR-004).
26. Nenhum endpoint novo, nenhuma migration, nenhuma coluna nova. A conta é uma
    função pura sobre `trainingHistory()` + fila local + `weekPlan`.

---

### Cenários — Happy Path

```gherkin
Scenario: O card leva ao dia de hoje, já aberto
  Given que hoje é quinta-feira
  And eu tenho um planejamento com prova daqui a 12 semanas
  When abro a Dashboard e toco em "Ver plano da semana"
  Then vejo o documento do meu planejamento mais recente
  And a aba "Semana" está ativa
  And o detalhamento de quinta está expandido e visível sem eu rolar
```

```gherkin
Scenario: Dia combinado oferece as duas modalidades
  Given que hoje é quinta-feira
  And estou no detalhamento de quinta, expandido
  Then vejo como registrar musculação
  And vejo como registrar corrida
```

```gherkin
Scenario: Dia só de musculação oferece só musculação
  Given que hoje é segunda-feira
  And estou no detalhamento de segunda, expandido
  Then vejo como registrar musculação
  And não vejo como registrar corrida
```

```gherkin
Scenario: Sábado oferece só corrida
  Given que hoje é sábado
  And estou no detalhamento de sábado, expandido
  Then vejo como registrar corrida
  And não vejo como registrar musculação
```

```gherkin
Scenario: O formulário de musculação abre sabendo o treino do dia
  Given que hoje é quinta-feira, dia de costas e bíceps
  When registro a musculação a partir do detalhamento de quinta
  Then o formulário mostra que hoje era costas e bíceps
  And o grupo muscular já vem selecionado como "Bíceps e costas"
```

```gherkin
Scenario: O formulário de corrida abre com o contexto, sem inventar medidas
  Given que hoje é quinta-feira, dia de corrida de qualidade
  When registro a corrida a partir do detalhamento de quinta
  Then o formulário mostra que hoje era corrida de qualidade
  And distância, duração, ritmo e esforço estão em branco
```

```gherkin
Scenario: Registrar as duas modalidades fecha o dia sem nenhum gesto extra
  Given que hoje é quinta-feira, dentro da janela do meu plano
  And já registrei a musculação de hoje
  When registro a corrida de hoje
  Then quinta aparece como cumprida
  And em nenhum momento eu marquei o dia como concluído
```

```gherkin
Scenario: Salvar o registro devolve ao dia de onde saí
  Given que estou no detalhamento de quinta, expandido
  When registro a musculação e ela é salva
  Then volto ao detalhamento de quinta
  And não volto à Dashboard
```

```gherkin
Scenario: A Dashboard mostra quanto do plano já andei
  Given que meu plano começou na semana 1 e estou na semana 6
  And cumpri 26 dos dias com treino já decorridos
  When abro a Dashboard
  Then vejo que percorri 18% do plano
```

```gherkin
Scenario: Cumprir o plano inteiro desde a semana 1 chega a 100%
  Given que acompanhei o plano desde a semana 1
  And cumpri todos os 144 dias com treino da janela
  When abro a Dashboard no dia da prova
  Then vejo que percorri 100% do plano
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Domingo é descanso e não oferece registro
  Given que hoje é domingo
  When chego ao detalhamento de domingo pelo card da Dashboard
  Then vejo o texto de descanso
  And não vejo como registrar nada
  And domingo não aparece como cumprido nem como não feito
```

```gherkin
Scenario: Dia de perna não adivinha o grupo muscular
  Given que hoje é segunda-feira, dia de perna pesada
  When registro a musculação a partir do detalhamento de segunda
  Then o formulário mostra que hoje era perna pesada
  And nenhum grupo muscular vem selecionado
```

```gherkin
Scenario: Metade de um dia combinado é parcial, não cumprido
  Given que na quinta passada registrei apenas a musculação
  When abro o detalhamento da semana
  Then quinta aparece como parcial
  And quinta não conta para a porcentagem do plano
```

```gherkin
Scenario: Hoje sem registro ainda não é falha
  Given que hoje é quinta-feira e ainda não registrei nada
  When abro o detalhamento de quinta
  Then quinta não aparece como não feita
```

```gherkin
Scenario: Dia futuro não recebe marca
  Given que hoje é terça-feira
  When abro o detalhamento da semana
  Then sábado não aparece como não feito
```

```gherkin
Scenario: Dia passado sem registro nenhum aparece como não feito
  Given que hoje é quinta-feira, dentro da janela do meu plano
  And não registrei nada na quarta-feira
  When abro o detalhamento da semana
  Then quarta aparece como não feita
```

```gherkin
Scenario: Registro ainda na fila offline já fecha o dia
  Given que hoje é sábado e estou sem conexão
  When registro o longão de hoje
  Then sábado aparece como cumprido imediatamente
  And a porcentagem do plano já considera sábado
```

```gherkin
Scenario: Quem entrou no plano no meio vê o teto explicado
  Given que criei meu planejamento quando faltavam 10 semanas para a prova
  And cumpri todos os treinos desde então
  When abro a Dashboard no dia da prova
  Then vejo que percorri 42% do plano
  And vejo que entrei na semana 15
```

```gherkin
Scenario: Registrar de novo num dia cumprido não muda nada
  Given que quinta já está cumprida
  When registro outra corrida hoje
  Then quinta continua cumprida
  And a porcentagem do plano não muda
```

```gherkin
Scenario: Registro anterior ao início do plano não conta
  Given que meu plano começou há 3 semanas
  And tenho registros de corrida de 6 meses atrás
  When abro a Dashboard
  Then a porcentagem considera apenas os registros dentro da janela do plano
```

```gherkin
Scenario: Sem planejamento, o card convida a criar e não há porcentagem
  Given que ainda não criei nenhum planejamento
  When abro a Dashboard
  Then não vejo porcentagem de plano
  And ao tocar em "Ver plano da semana" chego ao formulário de criação
```

```gherkin
Scenario: Prova a mais de 24 semanas — o plano ainda não começou
  Given que minha prova é daqui a 30 semanas
  When abro a Dashboard
  Then não vejo porcentagem de plano
```

```gherkin
Scenario: Passada a prova, a porcentagem sai da tela
  Given que minha prova foi na semana passada
  When abro a Dashboard
  Then não vejo porcentagem de plano
```

```gherkin
Scenario: Chegar pela aba Planejamento não muda o comportamento antigo
  Given que estou na aba Planejamento
  When toco no card de um planejamento
  Then o documento abre na aba "Dados"
  And nenhum dia está expandido
```

---

### Cenários — Error Cases

```gherkin
Scenario: Histórico indisponível não vira zero por cento
  Given que meu histórico de treinos não pôde ser lido
  When abro a Dashboard
  Then não vejo porcentagem de plano
  And sou avisado de que não foi possível ler meus registros
  And não vejo "0%"
```

```gherkin
Scenario: Planejamento não encontrado ao abrir pelo card
  Given que o planejamento em vigor não pôde ser carregado
  When toco em "Ver plano da semana"
  Then vejo que o planejamento não foi encontrado
  And não vejo um dia expandido com dados inventados
```

```gherkin
Scenario: Sessão perdida ao ler o histórico leva ao login
  Given que meu token não pôde ser renovado
  When abro a Dashboard
  Then sou levado à tela de login
  And minha fila de registros pendentes é preservada
```

---

## Mapping: Cenário → Teste

> Test runner: Jest (`.sdd/STACK.md`). Telas de RN seguem sem teste de
> renderização — `@testing-library/react-native` não instala neste SDK
> (pendência #4 do `PROJECT.md`), então cenários de navegação e de layout são
> 🔵 Manual, como nas STORY-006/007/008.

A story introduz **duas funções puras** — é onde a cobertura mora.

| Cenário | Teste | Status |
|---------|-------|--------|
| O que cada dia prevê (regra 4) — 7 dias da grade | `planning/__tests__/dayRequirements.test.ts` | 🟢 Green |
| Cumprido / parcial / não feito / sem marca (regras 11–15) | `planning/__tests__/dayCompletion.test.ts` | 🟢 Green |
| Tolerância a grupo muscular e distância (regra 17) | `planning/__tests__/dayCompletion.test.ts` | 🟢 Green |
| Registro duplicado não altera estado (regra 18) | `planning/__tests__/dayCompletion.test.ts` | 🟢 Green |
| Fila offline conta como registro (regra 16) | `planning/__tests__/loggedSessions.test.ts` | 🟢 Green |
| Estado dos 7 dias que a aba Semana mostra (regras 11–15, 19) | `planning/__tests__/weekStatuses.test.ts` | 🟢 Green |
| Janela de 168 dias e denominador 144 (regras 19–21) | `planning/__tests__/planProgress.test.ts` | 🟢 Green |
| Teto de 100% (regra 22) | `planning/__tests__/planProgress.test.ts` | 🟢 Green |
| Semana de entrada quando o plano já tinha começado (regra 23) | `planning/__tests__/planProgress.test.ts` | 🟢 Green |
| Sem plano / antes do início / prova passada (regra 24) | `planning/__tests__/planProgress.test.ts` | 🟢 Green |
| Histórico indisponível não vira 0% (regra 25) | `planning/__tests__/planProgress.test.ts` · `home/__tests__/planProgressView.test.ts` | 🟢 Green |
| Texto do avanço e da semana de entrada (regras 23–25) | `home/__tests__/planProgressView.test.ts` | 🟢 Green |
| Pré-seleção do grupo muscular e dias de perna (regra 8) | `planning/__tests__/plannedMuscleGroup.test.ts` | 🟢 Green |
| Deep link malformado abre a tela como sempre (regras 3, 7) | `planning/__tests__/planDayParam.test.ts` | 🟢 Green |
| Card abre na aba Semana com o dia de hoje expandido e visível (regras 1–3) | — | 🔵 Manual |
| Botões por modalidade e só no dia de hoje (regras 5, 6) | — | 🔵 Manual |
| Contexto do treino no topo do formulário (regra 7) | — | 🔵 Manual |
| Voltar ao dia após salvar (regra 10) | — | 🔵 Manual — `router.back()` de `useRecordLogger`, sem código novo |
| Sessão perdida leva ao login | `home/__tests__/homeState.test.ts` (já existente) | 🟢 Green |

> **Cenário que a implementação acrescentou.** O `planDayParam.test.ts` não estava
> previsto: nasceu ao perceber que `Number('')` é `0` e `Number('0x2')` é `2` — um
> `?day=` vazio abriria a segunda-feira e `?day=0x2` abriria a quarta. Parâmetro de
> rota é entrada externa mesmo quando quem o escreveu foi a nossa própria tela.

---

## Notas de Especificação

- **Funções puras sugeridas** (nome e assinatura ficam a critério do
  `/implement`):
  - `dayRequirements(day: WeekPlanDay)` → `{ run: boolean; strength: boolean }`,
    derivado de `hasRun` e `exercises.length`. Sem dado novo na grade.
  - `dayCompletion(date, today, requirements, sessions)` →
    `'cumprido' | 'parcial' | 'naoFeito' | 'semMarca'`.
  - `planProgress(today, raceDate, planCreatedAt, sessions)` →
    `{ cumpridos, total: 144, percent, enteredAtWeek }`.
- **Reaproveitar `trainingProgress.ts`**, não duplicar. A semana de entrada da
  regra 23 é `trainingProgress(planCreatedAt, raceDate).week` — a mesma
  aritmética regressiva da STORY-011, aplicada à data de criação em vez de hoje.
  `PLAN_TOTAL_WEEKS` já está exportado ali.
- **`PlanRequestSummary.createdAt` já existe** e é o que responde "em que semana
  eu entrei" (regra 23). Nenhum campo novo.
- **Sessões pendentes e sincronizadas juntas**: `trainingHistory()` devolve as
  do servidor; `recordQueue.read()` devolve as da fila, cujo `payload` carrega
  `date`. A união é o insumo da conta (regra 16). Cuidado com a dupla contagem
  na janela entre o envio e a próxima leitura — a chave de idempotência
  (ADR-003) é o que identifica o par, e o estado de um dia é binário por
  modalidade, então duplicar não altera o resultado (regra 18 cobre isso).
- **FF-003 (≤ 300 linhas)**: `PlanningDocument.tsx` já tem 457 linhas e vai
  crescer com marcas de estado e botões. Já está fora do limite antes desta
  story — extrair `SemanaSection`/`DayRow` para um módulo próprio é o refactor
  natural do passo 🔄, não escopo novo.
- **Fatiamento sugerido**: os cenários de navegação e registro (regras 1–10)
  entregam valor sem porcentagem nenhuma e não dependem das regras 19–26. Se a
  story precisar ser quebrada, é nessa linha.
- **Fora do escopo, registrado**: carga e séries por exercício; check por
  exercício; registro retroativo ou desmarcar; aderência (% que cai); casar
  `MuscleGroup` com a grade; geração dinâmica do plano. Todos com razão no
  `story.md`.

---

## Relatório do `/review` — 2026-08-22

> Fase de fechamento do `/implement`. Suíte: **33 suítes, 249 testes, verde**.
> Typecheck limpo. Cobertura dos módulos desta story: **91% linhas / 94% branches**
> (FF-001 exige ≥ 70%).

### Achados corrigidos nesta rodada

| # | Achado | Gravidade | Correção |
|---|--------|-----------|----------|
| 1 | O branch de `createdAt` com timestamp (`2026-08-22T13:45:00Z`) estava **sem teste** — e é o único que produção percorre, porque o servidor nunca devolve data pura | Alta (risco), nula (defeito) | Dois testes novos em `planProgress.test.ts`. O código já estava correto; o que faltava era a trava |
| 2 | `loadLoggedSessions` devolvia `null` tanto para 401 quanto para falha de rede, contrariando o cenário *"Sessão perdida ao ler o histórico leva ao login"*. Funcionava por acidente — `loadPlanList` e `loadHomeState` detectavam o 401 antes | Média | Resultado discriminado `ok · unavailable · sessionLost`, no mesmo formato de `PlanListState`. As duas telas passam a rotear ao login |
| 3 | `planDayIndexFromParam` duplicava a validação de `planDayFromParam`, e a cópia era justamente a sem teste | Baixa (DRY) | Uma validação só; a que devolve o dia deriva da que devolve o índice |
| 4 | `idempotencyKey` interpolada crua na query string — um `&` na chave sobrescreveria `section`/`day` | Baixa | `encodeURIComponent` |
| 5 | **Bug de interação**: `onLayout` redispara a cada remedição da lista, então o primeiro toque em qualquer outro dia puxava a tela de volta para hoje | Média | Trava de disparo único |

> Os achados 4 e 5 não apareceriam em teste automatizado — o 4 exige uma chave
> malformada que a API nunca emitiu, o 5 é gesto de tela. Saíram de releitura.

### OWASP Top 10

| Risco | Situação |
|-------|----------|
| A01 Broken Access Control | Nenhum endpoint novo. As sessões vêm de `trainingHistory()`, já filtrado por `CorredorId` na query (ADR-002). A conta roda sobre dados que já eram do próprio corredor — não há superfície nova de vazamento entre contas |
| A03 Injection | Parâmetro de rota é a única entrada externa nova. Validado por regex estrita (`/^\d$/`) depois de o teste expor que `Number('')` é `0` e `Number('0x2')` é `2`. Chave escapada na URL (achado 4) |
| A07 Identification & Auth | Corrigido no achado 2: 401 deixa de se disfarçar de falha de rede |
| A02 · A04 · A05 · A06 · A08 · A09 · A10 | Sem superfície nova: nenhuma dependência, nenhum segredo, nenhuma escrita, nenhuma chamada de saída |

**LGPD / Mandato Inviolável**: dado de desempenho físico não sai do aparelho nem
do escopo do corredor — a conta é local, sobre o histórico dele. Nenhum GPS envolvido.

### Constituição e fitness functions

| Item | Situação |
|------|----------|
| Lei do Domínio #2 (sessão imutável) | **Preservada e não tocada.** Conclusão de dia é leitura derivada; nenhum repositório ganhou update ou delete |
| Lei do Domínio #4 (regra de treino precisa de fonte) | **Não acionada.** Contar dias cumpridos é aritmética de calendário, não regra de progressão. Nenhum ADR necessário |
| FF-001 (cobertura ≥ 70%) | ✅ 91% linhas / 94% branches nos módulos novos |
| FF-002 (complexidade ≤ 10) | ✅ maior função é `planProgress`, com 5 saídas antecipadas e um laço |
| FF-003 (módulo ≤ 300 linhas) | ⚠️ **`PlanningDocument.tsx` segue em 371** — melhorou de 457 com a extração de `SemanaSection` e `ExerciseList`, mas continua fora do limite. Já estava violado antes desta story. `app/(tabs)/index.tsx` está em 335. Não há linter configurado no projeto: FF-003 hoje **não tem sensor ativo** |
| FF-004 (RN não acessa banco) | ✅ toda leitura continua passando pela API .NET |
| FF-006 (progressão > 10%) | Não aplicável: nada aqui gera plano |

### Anti-patterns e overengineering

Sem abstração prematura encontrada. Os três módulos compartilhados extraídos no
REFACTOR (`weekPlanDay`, `planWindow`, `planningStyles`) têm dois ou mais
consumidores reais cada — nenhum foi criado para futuro hipotético. `planWindow`
em particular existe porque a janela de 168 dias estava duplicada em dois
cálculos que divergiriam sozinhos.

Sem código defensivo especulativo: o teto de 100% da regra 22 é garantido pela
estrutura da janela (168 dias contêm exatamente 24 domingos), então **não** foi
escrito um `Math.min` que nunca dispararia — a razão está comentada no código.

### Pendências que ficam registradas

- **`PlanningDocument.tsx` acima do FF-003** (371 linhas). A próxima extração
  natural é `SeusDadosSection`, que é autocontida.
- **Sem teste de renderização** — limitação já registrada como pendência #4 do
  `PROJECT.md` (`@testing-library/react-native` não instala no Expo SDK 57). Os
  cenários 🔵 Manual da tabela acima seguem sem cobertura automatizada.
- **`/sync` pendente**: `DOMAIN.md` ainda descreve "não existe distinção entre
  planejado e realizado". Depois desta story existe — derivada, não persistida.
