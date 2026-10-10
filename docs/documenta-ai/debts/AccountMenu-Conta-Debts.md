---
source: src/steady-app/src/account/useAccountMenu.ts
commit: ea9fcfa33fea1267443adf990b6b2950a8692c85
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-004, STORY-005, STORY-021
---

# AccountMenu - Conta - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: regra da saída isolada, testada e alinhada ao ADR-005; casca fina.
- **Principais Problemas**: limpeza de caches na saída incompleta e não aguardada.
- **Impacto no Negócio**: baixo no uso normal; relevante em aparelho compartilhado.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum específico desta unidade. O débito crítico relacionado (cache de revisão na troca de conta) está em [AuthSession-Autenticacao-Debts](AuthSession-Autenticacao-Debts.md).

### 🟡 Importantes

- **Limpeza de caches não é aguardada nem completa**: `concluir` dispara `void trainingSheetCache.clear()` e `void workoutReviewCache.clear()` e já navega ao login; plano (`steadyTrainingPlanCache`) e rascunho combinado ficam fora.
  - **Evidência**: `src/steady-app/src/account/useAccountMenu.ts:54-59`.
  - **Ação Recomendada**: aguardar a limpeza e usar a função única proposta no débito da autenticação.

### 🟢 Menores

- **Identidade lida uma vez na montagem**: se a conta mudar sem remontar o hook, o menu mostra a anterior. Hoje a troca passa por login com pilha esvaziada, então não ocorre.
  - **Ação Recomendada**: nenhuma.
- **Casca e hook sem teste de renderização**: o harness do Expo SDK 57 não suporta (registrado no `PROJECT.md`).

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum nesta unidade.
2. **Fase 2 - Importantes**: tornar a limpeza completa e aguardada.
3. **Fase 3 - Menores**: nenhuma ação.

## 4. User Stories para Implementação

### Story 1: Saída aguarda a limpeza completa

**Contexto Atual**: a navegação ao login não espera os caches serem limpos.

**Objetivo**: concluir a limpeza antes de mostrar o login.

**Regras de Negócio**:

- Nenhum dado da conta anterior permanece legível após a saída.

**Especificação Técnica**:

- `concluir` passa a `await` a função única de limpeza antes de `applySignOutOutcome`.

**Critérios de Aceite**:

- [ ] Ficha, revisão, plano e rascunho são limpos antes da navegação.
- [ ] Falha na limpeza não impede a saída nem a esconde.

**Roteiro de Teste**:

1. **Teste 1**: sair com os quatro caches preenchidos.
   - **Entrada**: `signedOut`.
   - **Resultado Esperado**: todos vazios quando o login aparece.
