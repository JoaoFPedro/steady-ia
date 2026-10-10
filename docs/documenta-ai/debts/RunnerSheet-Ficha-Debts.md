---
source: src/steady-app/src/coaching/workoutExecution.ts
commit: ea9fcfa33fea1267443adf990b6b2950a8692c85
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-013, STORY-014, STORY-015, STORY-017
---

# RunnerSheet - Ficha - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: regras de carga e de dia combinado extraídas e testadas; o fluxo atômico combinado é decisão registrada (ADR-011).
- **Principais Problemas**: dado de execução que pode sair inflado pelo pré-preenchimento, janela de duplicação no rascunho combinado e grade do dia fixa no cliente.
- **Impacto no Negócio**: a revisão compara prescrito e executado; execução pré-preenchida distorce a base dessa comparação.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum comprovado nesta unidade.

### 🟡 Importantes

- **Carga sugerida vira carga "real" sem o corredor tocar**: o campo nasce preenchido com `suggestedLoadKg`; quem não altera nada e salva registra o exercício como feito com a carga prescrita, mesmo que não o tenha feito ou tenha usado outra carga. A revisão de aderência compara justamente isso.
  - **Evidência**: `src/steady-app/app/coaching/strength.tsx:44`.
  - **Ação Recomendada**: campo vazio por padrão, com a sugestão apenas como `placeholder` ou texto de apoio.
- **Janela de duplicação no rascunho combinado**: `completeWithRun` faz `enqueue` e depois `clear` em duas operações; se o app morrer entre as duas, o rascunho continua e `recover()` na abertura enfileira a mesma musculação de novo como `strengthWorkout`, com outra chave de idempotência, gerando execução duplicada (execuções são imutáveis).
  - **Evidência**: `src/steady-app/src/coaching/combinedWorkoutDraft.ts:35-39` e `:46-47`.
  - **Ação Recomendada**: gerar a chave do item combinado a partir do rascunho (ou marcar o rascunho como consumido antes de enfileirar) para o reenvio ser idempotente.
- **Carga 0 é "pulado"**: exercício de peso corporal (acesso a equipamento `peso_corporal`) não tem carga em quilogramas; sem informar um valor maior que zero, o exercício é registrado como não realizado.
  - **Evidência**: `src/steady-app/src/coaching/workoutExecution.ts:71`.
  - **Ação Recomendada**: decisão de produto: campo "feito" explícito, separado da carga.

### 🟢 Menores

- **Grade do dia fixa no cliente** (`['lower','push','push','pull','lower',null,null]` e corridas terça, quinta e sábado), independente do plano publicado pelo servidor.
  - **Evidência**: `src/steady-app/src/coaching/dailyPrescription.ts:8-9`.
- **`workoutReviewView` aceita várias formas do JSON** (`fields`/`comparisons`, `field`/`name`, `prescribed`/`expected`) e corta em 6 linhas sem avisar; sinal de contrato frouxo com o servidor.
  - **Evidência**: `src/steady-app/src/coaching/workoutReviewView.ts:46-49`.
- **Sem aviso quando a ficha não carrega** em `/coaching/strength`: a tela fica com título e sem exercícios, ao contrário de `/coaching/select`, que mostra o motivo.
  - **Evidência**: `src/steady-app/app/coaching/strength.tsx:37-49`.
- **Título da revisão** é "Seu treino ficou diferente do planejado" para qualquer status que não seja conflito.

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum.
2. **Fase 2 - Importantes**: campo de carga sem pré-preenchimento, idempotência do rascunho combinado, "feito" explícito.
3. **Fase 3 - Menores**: contrato da revisão e feedback de ficha ausente.

## 4. User Stories para Implementação

### Story 1: Execução da ficha só com o que o corredor informou

**Contexto Atual**: a carga sugerida preenche o campo e é gravada como executada.

**Objetivo**: o dado de execução reflete só o que o corredor confirmou.

**Regras de Negócio**:

- Execução é imutável e base da revisão de aderência (ADR-009, ADR-014).

**Especificação Técnica**:

- Carga inicial vazia; sugestão exibida como texto de apoio; "usar sugestão" opcional por toque.

**Critérios de Aceite**:

- [ ] Salvar sem tocar nas cargas registra todos os exercícios como pulados e exige confirmação.
- [ ] Tocar em "usar sugestão" preenche a carga prescrita.

**Roteiro de Teste**:

1. **Teste 1**: abrir a ficha e salvar sem alterar nada.
   - **Entrada**: toque em Salvar treino.
   - **Resultado Esperado**: diálogo de pulados listando todos os exercícios.
