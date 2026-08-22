# Story: STORY-007 — Card da Dashboard mostra o treino do dia

Discovery: .discovery/DISC-002-plano-de-treino-semanal/

> Amplia o card "Plano da semana" da Dashboard, criado como adendo ao
> `STORY-006` em 2026-08-21 (card estático, sem conteúdo do dia). Esta story
> é o card mostrando de fato o treino de hoje, a partir do split fixo já
> transcrito em `trainingPlanDocument.ts` (STORY-006, `weekPlan`).

## Descrição

Como **corredor amador que segue o plano concorrente de corrida e
musculação**,
Quero **ver, direto na Dashboard, qual é o treino de hoje — e se tiver
corrida, saber isso junto com uma descrição curta da atividade**,
Para que **eu não precise abrir a aba Planejamento só para lembrar o que
treinar hoje**.

## Contexto

O split semanal já existe, fixo e completo, em `weekPlan`
(`src/planning/trainingPlanDocument.ts`, STORY-006): 7 dias, cada um com foco
de musculação e, em 3 deles (terça, quinta, sábado), corrida. Hoje o card da
Dashboard só anuncia a existência do plano; esta story faz o card resolver o
dia da semana atual do aparelho contra esse split e mostrar o treino do dia.

Não há cálculo de progressão, fase ou semana aqui — é um **lookup** do dia da
semana de hoje (`Date.getDay()`) contra os 7 dias fixos do split, o mesmo
split que a aba Planejamento já exibe. Não fere o DISC-002 (regra 6: nenhuma
geração dinâmica) — o conteúdo de cada dia continua sendo o mesmo texto
estático de sempre, só a **seleção de qual dia mostrar** responde à data real.

## Critérios de Aceite

- [x] O card da Dashboard mostra o **foco de musculação do dia da semana
      atual** (ex.: segunda-feira → "Perna (pesada)")
- [x] Nos dias com corrida (terça, quinta, sábado), o card **interpola** o
      foco de musculação com a corrida usando "+" (ex.: "Peito e tríceps +
      corrida moderada"); no sábado, dia só de corrida, mostra apenas
      "Longão", sem "+"
- [x] Nos dias com corrida, o card mostra também uma **descrição curta da
      atividade** — reaproveitada do texto que a aba Planejamento já usa
      (`runNote` do dia), não um texto novo
- [x] Nos dias sem corrida (segunda, quarta, sexta), o card mostra uma
      descrição curta reaproveitada do `intro` do dia
- [x] No domingo, o card mostra "Descanso" com a descrição de descanso do
      plano (`intro` do dia) — mesmo tratamento visual dos outros dias,
      sem esconder nem desabilitar nada
- [x] O botão "Ver plano da semana" continua levando à aba Planejamento,
      em qualquer dia
- [x] O dia do card é determinado pela data do aparelho no momento em que a
      Dashboard renderiza — sem input do corredor, sem persistência

## Estimativa

- **Tamanho**: S
- **Complexidade**: Baixa — um lookup puro (dia da semana → entrada de
  `weekPlan`) e composição de texto; sem estado novo, sem rede, sem
  persistência.

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-006 — `weekPlan` em `trainingPlanDocument.ts` | ✅ Implementada |

## Notas

O card "Plano da semana" estático (adendo do `STORY-006`, 2026-08-21) é
substituído pelo conteúdo desta story — mesma Kicker e botão, texto do meio
passa a ser dinâmico por dia da semana.
