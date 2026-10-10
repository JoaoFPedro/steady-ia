---
source: src/steady-app/src/training/trainingHistory.ts
commit: 9e5d70befed638f93e6add184fd0991e2c6a5199
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-002, STORY-003, STORY-014, STORY-018
---

# TrainingHistory - Histórico - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: boa separação entre lógica testável (`trainingHistory.ts`) e tela; estados de erro bem distintos.
- **Principais Problemas**: consulta N+1 de revisões e navegação ao login inconsistente.
- **Impacto no Negócio**: custo de rede e bateria crescentes com o tamanho do histórico.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum comprovado nesta unidade.

### 🟡 Importantes

- **N+1 de revisões**: para cada item carregado, `HistoryScreen` chama `workoutReviewByExecution`, a cada foco da tela. Com histórico longo são dezenas de requisições simultâneas, sem paginação nem limite.
  - **Evidência**: `src/steady-app/app/history.tsx:30-40`.
  - **Ação Recomendada**: devolver a revisão (ou um indicador) na própria lista da API, ou buscar sob demanda ao expandir o item; paginar o histórico.
- **`sessionLost` sem esvaziar a pilha**: `router.replace('/login')` direto, em vez de `goToLogin`; o gesto de voltar pode reexibir telas autenticadas (a mesma classe de falha que `goToLogin` corrige).
  - **Evidência**: `src/steady-app/app/history.tsx:27`.
  - **Ação Recomendada**: usar `goToLogin(router)`.

### 🟢 Menores

- **Revisões que falham somem em silêncio**: a falha de uma busca individual é descartada; o cartão simplesmente não mostra a revisão.
- **`WORKOUT_LABELS` fixo** (`push`, `pull`, `lower`): um novo tipo de treino aparece sem o nome do treino.
- **`describe` pode devolver texto vazio** para corrida sem distância e sem duração.

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum.
2. **Fase 2 - Importantes**: eliminar o N+1 e unificar a ida ao login.
3. **Fase 3 - Menores**: rótulos e estados vazios.

## 4. User Stories para Implementação

### Story 1: Histórico com revisão na própria listagem

**Contexto Atual**: uma requisição extra por treino.

**Objetivo**: carregar histórico e revisões em uma ida ao servidor.

**Regras de Negócio**:

- A revisão pertence à execução (ADR-014); o corredor só vê as próprias.

**Especificação Técnica**:

- Estender o contrato de `GET /api/training-sessions` com a revisão resumida, ou criar endpoint de revisões por lote.

**Critérios de Aceite**:

- [ ] Abrir o histórico faz no máximo 2 requisições.
- [ ] A revisão continua isolada por corredor.

**Roteiro de Teste**:

1. **Teste 1**: corredor com 30 treinos.
   - **Entrada**: abrir Histórico.
   - **Resultado Esperado**: número de requisições constante, independente do tamanho.
