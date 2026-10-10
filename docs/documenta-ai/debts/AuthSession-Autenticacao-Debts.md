---
source: src/steady-app/src/auth/googleSignInSession.ts
commit: 2bc6f2e3bdbc21bb2cd828f4a2e295fac88cfff7
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-002, STORY-004, STORY-005
---

# AuthSession - Autenticação - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: a sessão é bem isolada atrás de portas e tem tratamento cuidadoso de concorrência no módulo nativo. O ponto fraco é o que sobra no aparelho quando a conta muda.
- **Principais Problemas**: a limpeza de dados locais na troca de conta é parcial e depende do caminho usado (saída explícita ou perda de sessão).
- **Impacto no Negócio**: dado de saúde em cache de um corredor pode ser mostrado a outro no mesmo aparelho, contra o mandato inviolável da Constituição.

## 2. Problemas por Criticidade

### 🔴 Críticos

- **Cache da revisão de treino sobrevive à troca de conta pelo caminho de sessão perdida**: `app/login.tsx:24` limpa só `trainingSheetCache` antes de `signIn()`. A revisão em cache (`workoutReviewCache`, chave `steady.latest-workout-review.v1`, que contém a comparação prescrito x executado e a observação de dor) só é limpa em `useAccountMenu.concluir`, e apenas quando a saída termina em `signedOut`. Quando a sessão cai por 401 (`useRecordLogger` -> `goToLogin`) nada é limpo; se outra conta entrar e a primeira leitura da revisão falhar ou ficar offline, `WorkoutReviewCache.load()` devolve o dado da conta anterior com `stale: true`.
  - **Categoria**: OWASP A01 (Broken Access Control) e mandato inviolável da Constituição.
  - **Evidência**: `src/steady-app/app/login.tsx:24`; `src/steady-app/src/account/useAccountMenu.ts:54-59`; `src/steady-app/src/coaching/workoutReviewCache.ts:29-35`; `src/steady-app/src/services.ts`.
  - **Condição para ocorrer**: aparelho compartilhado, sessão perdida (não saída explícita), outra conta entra e a API não responde na primeira leitura. Inferido da leitura do código, sem reprodução em aparelho.
  - **Ação Recomendada**: centralizar a limpeza de todos os caches e rascunhos por conta em uma única função e chamá-la no login e na saída; considerar guardar o identificador da conta junto de cada cache e descartar quando divergir.

### 🟡 Importantes

- **`steadyTrainingPlanCache` e `combinedWorkoutDrafts` ficam fora de qualquer limpeza por troca de conta**: o plano não é dado pessoal, mas pode divergir entre versões por corredor (ADR-013); o rascunho combinado é limpo só no descarte da saída.
  - **Ação Recomendada**: incluir ambos na mesma função central de limpeza.
- **Token só é checado por existência na abertura**: `_layout.tsx` não distingue token vencido de válido; o primeiro request autenticado renova. É coerente com o desenho, mas a primeira tela pode nascer em falha de leitura antes da renovação.
  - **Ação Recomendada**: nenhuma imediata; registrar como comportamento conhecido.

### 🟢 Menores

- **`nativeGoogleSignInClient` não tem teste** por depender do módulo nativo (documentado no próprio arquivo). Cobertura só em aparelho.
  - **Ação Recomendada**: manter o roteiro manual do `CLAUDE.md`.

## 3. Plano de Ação

1. **Fase 1 - Críticos**: unificar a limpeza de cache por conta e acioná-la no login e na saída.
2. **Fase 2 - Importantes**: cobrir plano e rascunho combinado na mesma função.
3. **Fase 3 - Menores**: nenhuma ação de código.

## 4. User Stories para Implementação

### Story 1: Limpeza completa de dados locais na troca de conta

**Contexto Atual**: a limpeza é feita por cache e em pontos diferentes; o login limpa só a ficha.

**Objetivo**: nenhum dado de uma conta fica legível para outra no mesmo aparelho.

**Regras de Negócio**:

- Dados de saúde nunca são expostos a outro usuário (Constituição do projeto).
- A fila de registros continua sendo tratada pelo ADR-005.

**Especificação Técnica**:

- Uma função única de limpeza que cobre `trainingSheetCache`, `workoutReviewCache`, `steadyTrainingPlanCache` e `combinedWorkoutDrafts`.
- Chamada no início de `entrar()` e em `concluir()` de `useAccountMenu`.

**Critérios de Aceite**:

- [ ] Sessão perdida seguida de login com outra conta não exibe revisão da conta anterior com a API indisponível.
- [ ] A saída explícita continua limpando tudo.
- [ ] A fila de registros segue o ADR-005.

**Roteiro de Teste**:

1. **Teste 1**: conta A com revisão em cache; força 401; entra com conta B com a API desligada.
   - **Entrada**: segunda leitura da revisão falha.
   - **Resultado Esperado**: nenhuma revisão da conta A aparece.
