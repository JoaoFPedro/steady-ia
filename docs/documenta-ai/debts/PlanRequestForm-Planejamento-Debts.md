---
source: src/steady-app/src/planning/PlanningForm.tsx
commit: 081885781dc356bad402665f15786df395bed0bb
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-008, STORY-010, STORY-013
---

# PlanRequestForm - Planejamento - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: fluxo offline-first bem resolvido (chave de idempotência antes da rede) e tratamento cuidadoso de data.
- **Principais Problemas**: formulário com blocos desativados por comentário, validação numérica frouxa e tela de aba que mistura planejamento com vínculo.
- **Impacto no Negócio**: dado de entrada pode ser descartado sem aviso.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum comprovado nesta unidade.

### 🟡 Importantes

- **Texto inválido em campo opcional vira ausência sem aviso**: `numeroOuNulo` devolve `null` quando o resultado é `NaN`, então "3x" em "Corridas por semana hoje" é enviado como se estivesse em branco.
  - **Evidência**: `src/steady-app/src/planning/PlanningForm.tsx:369-375`.
  - **Ação Recomendada**: validar estrutura no cliente (como na ficha) e realçar o campo.
- **Campo obrigatório numérico sem validação**: `longestRecentRunKm` usa `numero()`; texto inválido vira `NaN` e é serializado como `null`, com recusa do servidor só depois de o pedido entrar na fila.
  - **Evidência**: `src/steady-app/src/planning/PlanningForm.tsx:62-66, 366`.
  - **Ação Recomendada**: mesma validação estrutural.

### 🟢 Menores

- **Blocos de formulário comentados**: referência de ritmo, dias preferidos, sessão de força e equipamento ficam como JSX comentado, com estados e imports mortos (`WEEKDAYS`, `EQUIPMENT_ACCESS`, `Pressable`).
  - **Evidência**: `src/steady-app/src/planning/PlanningForm.tsx:150-223`.
  - **Ação Recomendada**: remover ou reativar por feature flag; o histórico git guarda o código.
- **Aba mistura responsabilidades**: planejamentos e vínculo com personal na mesma tela e no mesmo estado (`app/(tabs)/planning.tsx`).
- **`unavailable` + fila vazia** mostra "Nada guardado neste aparelho", mensagem correta mas pouco acionável (sem botão de tentar de novo).

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum.
2. **Fase 2 - Importantes**: validação estrutural dos campos numéricos.
3. **Fase 3 - Menores**: limpar JSX comentado e separar vínculo da lista.

## 4. User Stories para Implementação

### Story 1: Campos numéricos do planejamento validados na tela

**Contexto Atual**: números inválidos são descartados ou viram `null` sem aviso.

**Objetivo**: o corredor corrige o campo antes de gerar.

**Regras de Negócio**:

- Estrutura no cliente; limites de domínio no servidor.

**Especificação Técnica**:

- Schema `zod` no `enviar()` com erro por campo, no mesmo padrão de `trainingSheetSchema`.

**Critérios de Aceite**:

- [ ] "abc" em maior corrida recente realça o campo e não enfileira.
- [ ] "3x" em corridas por semana realça o campo.

**Roteiro de Teste**:

1. **Teste 1**: preencher "3x" em corridas por semana e gerar.
   - **Entrada**: toque em gerar.
   - **Resultado Esperado**: erro no campo; nada na fila.
