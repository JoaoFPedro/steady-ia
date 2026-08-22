# Story: STORY-006 — Aba Planejamento com formulário e plano gerado

Discovery: .discovery/DISC-002-plano-de-treino-semanal/

> **Escopo corrigido em 2026-08-17**, durante o `/implement` — a primeira
> versão desta story (baseada numa leitura errada do discovery: "semana atual
> calculada" em vez de "documento inteiro atrás de um formulário") foi
> descartada antes de chegar ao usuário. Ver a correção registrada em
> `.discovery/DISC-002-plano-de-treino-semanal/hypothesis.md` e o
> `ADR-006` (Superseded).

## Descrição

Como **corredor amador seguindo um plano estruturado de 24 semanas rumo à minha
primeira maratona**,
Quero **preencher um formulário com meus dados e gerar, dentro do app, o plano
de treino completo**,
Para que **eu não precise consultar um documento fora do app para saber o que
fazer em qualquer semana da minha preparação**.

## Contexto

O app hoje só olha para trás: registra sessões já realizadas e avalia
sobrecarga a partir do histórico. A metade "o que treinar" vive inteiramente
fora do produto, num documento de referência estático
(`.discovery/referencias/plano-treino-24-semanas.md`). Esta story traz esse
documento para dentro do app, atrás de um formulário que espelha
`.discovery/referencias/plano-treino-input-schema.md` (o `TrainingPlanRequest`)
— sem geração dinâmica de verdade: o botão "Gerar plano" sempre revela o
mesmo documento completo, porque essa é a única fonte que existe hoje.

## Critérios de Aceite

- [ ] Existe uma aba **Planejamento**, separada da Dashboard atual — o app
      passa a ter navegação por abas
- [ ] A aba mostra um **formulário** com os campos do `TrainingPlanRequest`:
      prova-alvo (distância, primeira vez, data), base atual (maior corrida
      recente, corridas por semana, tempo de referência), disponibilidade
      (dias de treino, dias preferidos, duração da força), equipamento e
      histórico de saúde (dores recorrentes, lesões anteriores)
- [ ] O botão **"Gerar plano"** só habilita com os campos obrigatórios do
      schema preenchidos (os opcionais — `currentWeeklyRunningDays`,
      `preferredWeekdays`, histórico de saúde — não bloqueiam)
- [ ] Ao gerar, a aba mostra o **documento completo** do plano de referência —
      princípio central, as 4 fases, estrutura semanal, detalhamento dos 4
      dias (A/B/C/D) em todas as fases, progressão do longão, mobilidade,
      regras de ouro e a nota sobre ritmos. Nenhuma seção do
      `plano-treino-24-semanas.md` fica de fora
- [ ] O corredor consegue **voltar ao formulário** a partir do plano gerado
      (os dados preenchidos continuam lá)
- [ ] Nenhum dado do formulário nem do plano é persistido nem enviado à API —
      tudo vive só no estado da tela (FF-004 não se aplica: não há leitura de
      banco nem escrita)
- [ ] **Nenhuma regra de progressão é calculada** — o plano gerado é sempre o
      mesmo documento, independente dos valores do formulário. Sem cálculo,
      a Lei do Domínio #4 não exige ADR nesta versão
- [ ] **(Adendo 2026-08-21)** A Dashboard mostra um card "Plano da semana",
      no modelo do `tela.html` (artboard 3a), que leva o corredor até a aba
      Planejamento ao tocar em "Ver plano da semana"

## Estimativa

- **Tamanho**: M
- **Complexidade**: Média — a complexidade não está em nenhuma regra (não há
  cálculo), está em reproduzir fielmente um formulário de ~12 campos e um
  documento de 8 seções sem cortar conteúdo.

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | — | — |
| Serviço | — | — |

## Notas

Escopo mínimo definido em
`.discovery/DISC-002-plano-de-treino-semanal/hypothesis.md`. Layout do
formulário segue o template em `tela.html` (turno 2, artboard 2a). Fora do
escopo nesta versão: geração dinâmica de verdade (usar os valores do
formulário para calcular um plano diferente), Objetivo de Corrida como
entidade de domínio (Lei do Domínio #3), adaptação da estrutura A/B/C/D para
outro número de dias de treino, e qualquer cruzamento com o registro real de
sessões.
