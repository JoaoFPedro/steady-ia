---
source: src/steady-app/app/(tabs)/index.tsx
commit: ea9fcfa33fea1267443adf990b6b2950a8692c85
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-003, STORY-006, STORY-008, STORY-011, STORY-012, STORY-014
---

# HomeDashboard - Dashboard - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: lógica de apresentação extraída e testável (`src/home`); estados de falha bem distintos.
- **Principais Problemas**: tela grande com várias responsabilidades e carga repetida a cada foco.
- **Impacto no Negócio**: custo de rede/bateria e risco de navegação duplicada para o login.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum específico desta unidade. A revisão em cache exibida aqui depende do débito crítico de [AuthSession](AuthSession-Autenticacao-Debts.md).

### 🟡 Importantes

- **Cinco requisições a cada foco, sem controle de frequência**: avaliação, planejamentos, histórico (para o avanço), plano e revisão; `trainingHistory` ainda é buscado de novo na tela Histórico e `planRequests` na aba Planejamento.
  - **Evidência**: `src/steady-app/app/(tabs)/index.tsx:71-124`.
  - **Ação Recomendada**: cache em memória com validade curta compartilhado entre telas, ou carga única na raiz das abas.
- **`goToLogin` pode ser chamado mais de uma vez**: cada leitura trata o próprio `sessionLost`; uma sessão caída dispara até quatro navegações em paralelo.
  - **Evidência**: `src/steady-app/app/(tabs)/index.tsx:77, 93, 99, 110`.
  - **Ação Recomendada**: tratar a sessão perdida uma vez (flag compartilhado).
- **Falha em comando da revisão é silenciosa**: em `WorkoutReviewCard.command`, resultado diferente de `ok` (rede, conflito) apenas libera o botão, sem aviso ao corredor.
  - **Evidência**: `src/steady-app/app/(tabs)/index.tsx:256-268` (função `command`).
  - **Ação Recomendada**: mostrar mensagem de falha no cartão.

### 🟢 Menores

- **Tela com mais de 400 linhas** e componente `WorkoutReviewCard` embutido (FF-003 pede módulos de até 300 linhas).
- **Chave de "conflito visto" direto no AsyncStorage da tela**, fora dos caches injetados; não é apagada na saída da conta (inofensivo, contém só um id).
- **`weekPlan === null` mistura "carregando" e "falhou"**, resolvido por um segundo estado (`weekPlanFailed`).

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum nesta unidade.
2. **Fase 2 - Importantes**: reduzir requisições, navegação única ao login, feedback de falha.
3. **Fase 3 - Menores**: extrair `WorkoutReviewCard` para módulo próprio.

## 4. User Stories para Implementação

### Story 1: Carga da Dashboard sem requisições redundantes

**Contexto Atual**: cada foco dispara cinco leituras, repetidas em outras telas.

**Objetivo**: reduzir tráfego sem exibir dado vencido.

**Regras de Negócio**:

- Avaliação de sobrecarga nunca é guardada como se fosse atual (STORY-003).

**Especificação Técnica**:

- Compartilhar histórico e planejamentos entre telas por um cache de validade curta; manter a avaliação sempre fresca.

**Critérios de Aceite**:

- [ ] Voltar de um registro mostra o treino novo.
- [ ] Abrir Dashboard e Histórico em sequência não repete a leitura do histórico dentro da validade.

**Roteiro de Teste**:

1. **Teste 1**: abrir Dashboard, depois Histórico.
   - **Entrada**: dois focos em menos de 30 s.
   - **Resultado Esperado**: uma única chamada a `/api/training-sessions`.
