# Story: STORY-016 — Plano do Steady como prescrição no servidor

Discovery: `.discovery/DISC-007-plano-que-o-app-nao-guarda/` (recorte do DISC-005)
Habilitadora de: `specs/STORY-014/`
ADR: ADR-013

## Descrição

Como **corredor que segue o plano do Steady**,
Quero **que o plano que eu leio seja o plano que o Steady guarda para mim**,
Para que **ele possa ser comparado com o que eu executo, mesmo sem personal**.

## Contexto

O plano do Steady hoje não é dado. É conteúdo estático em
`src/steady-app/src/planning/trainingPlanDocument.ts`, igual para todos e
existente apenas dentro do aplicativo. `PlanRequest` (ADR-007) guarda o
**pedido**, nunca um plano; `DOMAIN.md` registra "Plano de Treino (gerado) —
não implementado".

A comparação da STORY-014 roda no servidor, depois da sincronização, e não
alcança um arquivo do bundle. Sem o plano no servidor, o corredor sem personal
— a maioria no piloto — nunca receberia revisão, e o conflito entre plano e
ficha seria indetectável.

Esta story **persiste** um documento que já existe. Não o gera. A decisão de
produto de 2026-08-22, que adiou a geração do plano, permanece de pé.

O conteúdo inicial é transcrição literal do documento atual. Onde o texto-fonte
sustenta um número, ele vira campo estruturado; onde só há prosa, o campo nasce
ausente. Nada é interpolado — a ADR-006 foi superada exatamente por isso.

## Critérios de Aceite

- [x] O plano é persistido no servidor como documento versionado e imutável.
- [x] Cada corredor tem uma versão de plano vigente associada a ele.
- [x] O conteúdo inicial é idêntico, campo a campo, ao documento estático que o corredor lê hoje.
- [x] Os dias de corrida do plano aceitam a mesma prescrição estruturada opcional da ficha.
- [x] Campo numérico só é preenchido no seed onde o texto-fonte o sustenta; o restante nasce ausente.
- [x] Nenhum valor semanal é interpolado, extrapolado ou derivado por cálculo de progressão.
- [x] O aplicativo lê o plano da API em vez da constante local.
- [x] O plano lido fica em cache e continua visível sem conexão.
- [x] Falha de leitura do plano é sinalizada e nunca aparece como plano vazio.
- [x] Publicar uma versão nova de plano não altera a versão já associada a um corredor.
- [x] Um corredor nunca lê o plano de outro.

## Estimativa

- **Tamanho**: M
- **Complexidade**: Média

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-010 — persistência do pedido de plano | Concluída |
| Story | STORY-015 — prescrição de corrida estruturada | Concluída |
| Decisão | ADR-013 — plano do Steady como fonte de prescrição | Accepted |

## Habilita

| Story | O que fica bloqueado sem esta |
|-------|------------------------------|
| STORY-014 | Revisão para corredor sem personal e `ConflitoDePrescricao` |

> Segunda da sequência **STORY-015 → STORY-016 → STORY-014**.

## Fora de Escopo

- Gerar plano a partir do `PlanRequest` — segue adiado desde 2026-08-22.
- Personalizar o conteúdo do plano por corredor.
- Calcular progressão, volume semanal ou distância de longão por semana.
- Editar o plano pelo aplicativo.
- Comparar execução com o plano — é a STORY-014.

## Notas

- A constante `TRAINING_PLAN_DOCUMENT` deixa de ser fonte de leitura do app e
  passa a existir apenas como conteúdo do seed no servidor.
- A geração futura do plano herda este contrato: ela produzirá versões novas do
  mesmo documento, sem mudar como o app o lê.
