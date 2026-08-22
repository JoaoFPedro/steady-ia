# Spec BDD: STORY-007 — Card da Dashboard mostra o treino do dia

> **Story**: [story.md](./story.md)
> **Discovery**: [../../.discovery/DISC-002-plano-de-treino-semanal/](../../.discovery/DISC-002-plano-de-treino-semanal/)
> **Status**: Implementado — todos os cenários 🟢
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)

---

## Feature: Treino do dia no card da Dashboard

O card "Plano da semana" da Dashboard passa a mostrar o treino do dia da
semana atual, resolvido contra o split fixo de `weekPlan`
(`trainingPlanDocument.ts`, STORY-006). Sem cálculo de progressão — é
seleção de um dos 7 dias já escritos, pela data do aparelho.

### Regras de Negócio

1. O dia do card é determinado por `Date.getDay()` do aparelho no momento em
   que a Dashboard renderiza (0 = domingo … 6 = sábado), mapeado para a
   entrada correspondente de `weekPlan`.
2. Em dias **sem corrida** (segunda, quarta, sexta), o card mostra o
   `focus` do dia (ex.: "Perna (pesada)") e, como descrição, o `intro`
   do dia.
3. Em dias **com corrida e musculação** (terça, quinta), o card mostra
   `"{focus} + corrida {runLabel em minúsculas}"` (ex.: "Peito e tríceps +
   corrida moderada") e, como descrição, o `runNote` do dia — não o `intro`
   (que nesses dias é só o cabeçalho "Musculação:", sem conteúdo descritivo).
4. No sábado (corrida sem musculação — Longão), o card mostra apenas
   `focus` ("Longão"), **sem** "+", e como descrição o `intro` do dia.
5. No domingo (descanso), o card mostra `focus` ("Descanso") e o `intro`
   do dia como descrição — mesmo tratamento visual dos demais dias.
6. O botão "Ver plano da semana" não muda de comportamento — sempre navega
   para a aba Planejamento, independente do dia.
7. Nenhum dado novo é persistido ou lido de rede — o lookup é síncrono,
   local, a partir de `TRAINING_PLAN_DOCUMENT.weekPlan` já embutido no app.

---

### Cenários — Happy Path

```gherkin
Scenario: Segunda-feira mostra o dia de perna pesada, sem corrida
  Given que hoje é segunda-feira no aparelho
  When abro a Dashboard
  Then o card mostra "Perna (pesada)"
  And o card mostra a descrição do dia de perna pesada
  And o card não mostra "+"
```

```gherkin
Scenario: Terça-feira interpola musculação e corrida com "+"
  Given que hoje é terça-feira no aparelho
  When abro a Dashboard
  Then o card mostra "Peito e tríceps + corrida moderada"
  And o card mostra a descrição da corrida moderada de terça
```

```gherkin
Scenario: Quinta-feira interpola musculação e corrida de qualidade com "+"
  Given que hoje é quinta-feira no aparelho
  When abro a Dashboard
  Then o card mostra "Costas e bíceps + corrida de qualidade"
  And o card mostra a descrição da corrida de qualidade de quinta
```

```gherkin
Scenario: Sábado mostra só o longão, sem "+"
  Given que hoje é sábado no aparelho
  When abro a Dashboard
  Then o card mostra "Longão"
  And o card não mostra "+"
  And o card mostra a descrição do longão
```

```gherkin
Scenario: Domingo mostra descanso
  Given que hoje é domingo no aparelho
  When abro a Dashboard
  Then o card mostra "Descanso"
  And o card mostra a descrição de descanso
  And o botão "Ver plano da semana" continua visível e habilitado
```

```gherkin
Scenario: Botão do card leva à aba Planejamento em qualquer dia
  Given que estou na Dashboard, em qualquer dia da semana
  When toco em "Ver plano da semana"
  Then vejo a aba Planejamento
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Quarta-feira mostra o dia de ombro, sem corrida
  Given que hoje é quarta-feira no aparelho
  When abro a Dashboard
  Then o card mostra "Ombro"
  And o card não mostra "+"
```

```gherkin
Scenario: Sexta-feira mostra perna leve, sem corrida
  Given que hoje é sexta-feira no aparelho
  When abro a Dashboard
  Then o card mostra "Perna (leve)"
  And o card não mostra "+"
```

---

### Cenários — Error Cases

Não há casos de erro nesta story: o lookup é local e determinístico — os 7
dias de `weekPlan` sempre existem, `Date.getDay()` sempre devolve 0–6, não
há branch sem cobertura no domínio de entrada.

---

## Mapping: Cenário → Teste

> Test runner: Jest (`.sdd/STACK.md`).

Diferente do `STORY-006` (que não tinha lógica computável), esta story
introduz uma função pura nova — dia da semana → texto do card — candidata
natural a teste unitário (FF-001 se aplica aqui, ao contrário da nota do
`STORY-006`).

| Cenário | Testes | Status |
|---------|--------|--------|
| Segunda / Quarta / Sexta (sem corrida) | `planning/__tests__/todaysTraining.test.ts` | 🟢 Green |
| Terça / Quinta (interpolação "+") | `planning/__tests__/todaysTraining.test.ts` | 🟢 Green |
| Sábado (corrida sem "+") | `planning/__tests__/todaysTraining.test.ts` | 🟢 Green |
| Domingo (descanso) | `planning/__tests__/todaysTraining.test.ts` | 🟢 Green |
| Botão leva à aba Planejamento | — | 🔵 Manual — navegação de UI, mesma limitação de `@testing-library/react-native` já registrada no `STORY-006` |

---

## Notas de Especificação

- **Função pura sugerida**: algo como `todaysTraining(weekday: number,
  weekPlan: WeekPlanDay[])`, injetando o dia da semana em vez de chamar
  `Date` internamente — testável sem mockar relógio. Nome e assinatura
  final ficam a critério do `/implement`.
- **Fonte de texto reaproveitada, não nova**: a regra 3 (`runNote` nos dias
  combinados) e a regra 2/4/5 (`intro` nos demais) usam texto que já existe
  em `trainingPlanDocument.ts` — nenhum copy novo é escrito para esta story.
- **Fora do escopo**: qualquer cálculo de fase/semana/progressão (segue
  fora de escopo do DISC-002); tratar feriados, lesão registrada ou treino
  já concluído hoje (nenhuma dessas informações é lida — não há cruzamento
  com `RunningSession`/`StrengthSession` registrados, ponto já registrado
  como fora de escopo no `STORY-006`).
