# Spec BDD: STORY-011 — Cabeçalho da Dashboard: saudação, contagem e fase

> **Story**: [story.md](./story.md)
> **Protótipo**: `Marathon training app design/steady.html` (turno 3, artboard 3a)
> **Status**: Implementado (2026-08-22) — todos os cenários automatizáveis 🟢
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)

---

## Feature: Onde estou no plano, no topo da Dashboard

O cabeçalho da Dashboard troca a data por extenso por três informações que o corredor não consegue
deduzir sozinho: como o app o chama, **quanto falta** para a prova e **em que ponto do plano** ele
está.

```
Bom dia, João                       [15 semanas]
Semana 10 de 24 · fase Construção
```

### Regras de Negócio

1. A saudação usa o **primeiro nome** da conta Google autenticada e o período do dia no aparelho:
   `05:00–11:59` → "Bom dia", `12:00–17:59` → "Boa tarde", `18:00–04:59` → "Boa noite". A madrugada
   é noite, não manhã.
2. Se a conta não informa nome, a saudação vai **sem nome** ("Bom dia"). O app nunca saúda pelo
   e-mail — o e-mail identifica a conta no menu (STORY-004, regra 2), não é como se chama alguém.
3. A contagem e a fase saem da **data da prova do planejamento mais recente** — o mesmo planejamento
   que "Ver plano da semana" abre (STORY-008/010). Planejamento ainda na fila conta: ele é do
   corredor mesmo antes de o servidor confirmar.
4. O plano tem **24 semanas** e é contado **de trás para frente**: a semana da prova é a 24ª.
   Faltando `S` semanas, a semana atual é `24 − S + 1`. Nenhuma progressão é calculada — é
   aritmética de calendário sobre a data da prova (o app exibe, nunca calcula treino: FF-004).
5. As semanas restantes são contadas **para cima** (`ceil`) a partir dos dias que faltam: qualquer
   coisa entre 1 e 7 dias é "1 semana". Arredondar para baixo mostraria "0 semanas" na véspera.
6. A fase vem das quatro fases do plano (`trainingPlanDocument.ts`): semanas 1–8 **Base**, 9–16
   **Construção**, 17–20 **Pico**, 21–24 **Polimento**. Esses limites são os mesmos escritos no
   documento do plano — divergir deles faria a Dashboard e o plano aberto discordarem na mesma tela.
7. **Sem nenhum planejamento**, o cabeçalho mostra a saudação e um convite a criar um. Nunca uma
   semana, uma fase ou uma contagem: sem data de prova não há o que contar, e inventar um "Semana 1"
   seria afirmar um plano que não existe (mesma disciplina do ADR-004 — "não sei" ≠ "não há").
8. Com a prova a **mais de 24 semanas**, o plano ainda não começou: o cabeçalho mostra as semanas
   até a prova e diz em quantas semanas o plano começa. Sem semana e sem fase — afirmar "fase Base"
   antes do início seria antecipar um plano que ainda não vale.
9. **No dia da prova**, a contagem é substituída por "É hoje", e a linha mostra a última semana
   ("Semana 24 de 24 · fase Polimento").
10. **Passada a prova**, resta só a saudação: o plano terminou, e continuar exibindo "Semana 24"
    apresentaria como corrente um plano encerrado.
11. Nenhuma leitura nova de rede. Tudo sai do que a Dashboard já lê a cada foco (a lista de
    planejamentos) e do que o menu de conta já resolveu (a identidade).

---

### Cenários — Happy Path

```gherkin
Scenario: Corredor é saudado pelo primeiro nome pela manhã
  Given que estou autenticado com uma conta Google de nome "João Pedro Silva"
  And são 8 horas da manhã no aparelho
  When abro a Dashboard
  Then vejo "Bom dia, João"
```

```gherkin
Scenario: A saudação acompanha o período do dia
  Given que estou autenticado com uma conta Google de nome "João Pedro Silva"
  When abro a Dashboard às 14 horas
  Then vejo "Boa tarde, João"
  And quando abro às 21 horas vejo "Boa noite, João"
```

```gherkin
Scenario: Corredor vê quanto falta e em que ponto do plano está
  Given que tenho um planejamento com a prova daqui a 15 semanas
  When abro a Dashboard
  Then vejo que faltam "15 semanas"
  And vejo "Semana 10 de 24 · fase Construção"
```

```gherkin
Scenario: A fase acompanha o avanço do plano
  Given que tenho um planejamento
  When a prova está a 24 semanas, vejo "Semana 1 de 24 · fase Base"
  And quando está a 16 semanas, vejo "Semana 9 de 24 · fase Construção"
  And quando está a 8 semanas, vejo "Semana 17 de 24 · fase Pico"
  And quando está a 4 semanas, vejo "Semana 21 de 24 · fase Polimento"
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Corredor ainda não criou nenhum planejamento
  Given que estou autenticado e não tenho nenhum planejamento
  When abro a Dashboard
  Then vejo a saudação
  And sou convidado a criar um planejamento para ver minha semana
  And não vejo semana, fase nem contagem de semanas
```

```gherkin
Scenario: Prova ainda distante — o plano não começou
  Given que tenho um planejamento com a prova daqui a 30 semanas
  When abro a Dashboard
  Then vejo que faltam "30 semanas"
  And vejo que o plano começa em 6 semanas
  And não vejo semana nem fase
```

```gherkin
Scenario: Véspera da prova conta uma semana, não zero
  Given que tenho um planejamento com a prova amanhã
  When abro a Dashboard
  Then vejo que falta "1 semana"
  And vejo "Semana 24 de 24 · fase Polimento"
```

```gherkin
Scenario: Dia da prova
  Given que tenho um planejamento com a prova hoje
  When abro a Dashboard
  Then vejo "É hoje" no lugar da contagem de semanas
  And vejo "Semana 24 de 24 · fase Polimento"
```

```gherkin
Scenario: Prova já realizada
  Given que tenho um planejamento com a prova na semana passada
  When abro a Dashboard
  Then vejo apenas a saudação
  And não vejo semana, fase nem contagem de semanas
```

```gherkin
Scenario: Conta sem nome é saudada sem nome
  Given que estou autenticado com uma conta Google que não informa nome
  When abro a Dashboard
  Then vejo "Bom dia" sem nome nenhum
  And não vejo meu e-mail na saudação
```

```gherkin
Scenario: Corredor com mais de um planejamento
  Given que criei dois planejamentos, o mais recente com a prova daqui a 15 semanas
  When abro a Dashboard
  Then a contagem e a fase são as do planejamento mais recente
```

```gherkin
Scenario: Planejamento ainda não sincronizado já orienta o cabeçalho
  Given que criei um planejamento sem conexão e ele ainda está na fila
  When abro a Dashboard
  Then vejo a semana e a fase calculadas a partir dele
```

---

### Cenários — Error Cases

```gherkin
Scenario: Lista de planejamentos indisponível e nenhum planejamento local
  Given que a leitura dos planejamentos falhou
  And não há nenhum planejamento na fila do aparelho
  When abro a Dashboard
  Then vejo a saudação e o convite a criar um planejamento
  And nenhuma semana ou fase é afirmada
```

```gherkin
Scenario: Planejamento com data de prova ilegível
  Given que tenho um planejamento cuja data da prova não é uma data válida
  When abro a Dashboard
  Then vejo a saudação e o convite a criar um planejamento
  And a Dashboard não quebra
```

---

## Mapping: Cenário → Teste

> Test runner: Jest (`.sdd/STACK.md`).

| Cenário | Arquivo de Teste |
|---------|-----------------|
| Saudado pelo primeiro nome pela manhã | `home/__tests__/greeting.test.ts` |
| Saudação acompanha o período do dia | `home/__tests__/greeting.test.ts` |
| Conta sem nome é saudada sem nome | `home/__tests__/greeting.test.ts` |
| Quanto falta e em que ponto do plano está | `planning/__tests__/trainingProgress.test.ts` · `home/__tests__/homeHeader.test.ts` |
| Fase acompanha o avanço do plano | `planning/__tests__/trainingProgress.test.ts` |
| Ainda não criou nenhum planejamento | `home/__tests__/homeHeader.test.ts` |
| Prova distante — o plano não começou | `planning/__tests__/trainingProgress.test.ts` · `home/__tests__/homeHeader.test.ts` |
| Véspera conta uma semana, não zero | `planning/__tests__/trainingProgress.test.ts` · `home/__tests__/homeHeader.test.ts` |
| Dia da prova | `planning/__tests__/trainingProgress.test.ts` · `home/__tests__/homeHeader.test.ts` |
| Prova já realizada | `planning/__tests__/trainingProgress.test.ts` · `home/__tests__/homeHeader.test.ts` |
| Mais de um planejamento | `home/__tests__/homeHeader.test.ts` |
| Planejamento ainda não sincronizado orienta o cabeçalho | `home/__tests__/homeHeader.test.ts` |
| Lista indisponível e nenhum planejamento local | `home/__tests__/homeHeader.test.ts` |
| Data de prova ilegível | `planning/__tests__/trainingProgress.test.ts` · `home/__tests__/homeHeader.test.ts` |

Cobertura além dos cenários, fixando o que a regra 6 depende:

| Comportamento | Arquivo de Teste |
|---------------|-----------------|
| Os limites de fase do cabeçalho batem com os do documento do plano | `planning/__tests__/trainingProgress.test.ts` |

**Sem cobertura automatizada — verificação manual no aparelho:**

| Cenário | Por quê |
|---------|---------|
| Renderização do cabeçalho (saudação, linha e etiqueta na tela) | Mesma limitação herdada da STORY-003: `@testing-library/react-native` não instala no Expo SDK 57. A lógica mora fora do React — em `greeting.ts`, `trainingProgress.ts` e `homeHeader.ts` — para que só a renderização fique descoberta |

---

## Notas de Especificação

- **A data por extenso sai do cabeçalho.** Ela respondia "que dia é hoje", que o corredor já sabe;
  o mesmo espaço passa a responder "onde estou no plano", como no protótipo. O dia continua
  determinando o card do treino de hoje (STORY-007), que não muda.
- **Sem ADR.** A contagem regressiva não é decisão nova: é o modelo que `raceDate.ts` já assume
  ("o plano é contado de trás para frente") e que o `parseRaceDate` já protege ao exigir data futura.
  Nenhum dado novo, nenhuma fronteira nova, nenhum apagamento de dado.
- **Duração fixa de 24 semanas**: hoje é propriedade do documento do plano embutido no app
  (STORY-006). Se a API passar a gerar planos de duração variável, muda a *fonte* da duração —
  as regras 4, 5 e 6 continuam valendo como estão.
