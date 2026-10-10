---
source: src/steady-app/app/log/run.tsx
commit: ea9fcfa33fea1267443adf990b6b2950a8692c85
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-001, STORY-003, STORY-011, STORY-012, STORY-014
---

# TrainingLog - Registro - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: telas simples, com regra pesada delegada ao servidor e à fila.
- **Principais Problemas**: duplicação entre as três telas e valores inválidos virando `null` silencioso.
- **Impacto no Negócio**: baixo; a validação final do servidor evita dado ruim.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum comprovado nesta unidade.

### 🟡 Importantes

- **`NaN` serializado como `null`**: campo numérico com texto inválido (ex.: "8,2,1") vira `Number(...) = NaN`; `JSON.stringify` o grava como `null`. O servidor recusa com 400 e o corredor vê uma mensagem do domínio, mas a mensagem fala do campo `null` e não do que foi digitado, e o item recusado entra na fila antes (ver [RecordQueue](RecordQueue-FilaOffline-Debts.md)).
  - **Evidência**: `src/steady-app/app/log/run.tsx:40-47`.
  - **Ação Recomendada**: validar estrutura (número finito) no cliente com `zod`, como já é feito no formulário da ficha, deixando os limites ao servidor.
- **Rascunho combinado e desmontagem**: o efeito de limpeza dispara `finishStrengthOnly()` + `sync()` em qualquer desmontagem não concluída, inclusive quando o corredor volta de propósito para corrigir algo; não há como cancelar o dia combinado sem registrar a musculação.
  - **Evidência**: `src/steady-app/app/log/run.tsx:32-35`.
  - **Ação Recomendada**: confirmar com o corredor antes de gravar a musculação isolada, ou oferecer descarte explícito.

### 🟢 Menores

- **Telas quase idênticas** (cabeçalho do plano, aviso "Não foi salvo", estilos): terceira ocorrência da regra de três; extrair componentes.
- **Data fixa em hoje**: sem registro retroativo; é regra atual do produto, mas não está em spec visível nesta unidade.
- **Regiões de dor** (`Coxa`, `Quadril`, `Pé`) divergem do enum `PainArea` do pedido de plano; são campos diferentes (texto livre), mas o vocabulário não é compartilhado.

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum.
2. **Fase 2 - Importantes**: validação estrutural e confirmação do dia combinado.
3. **Fase 3 - Menores**: componentes compartilhados.

## 4. User Stories para Implementação

### Story 1: Validação estrutural dos números no registro

**Contexto Atual**: texto inválido vira `NaN`/`null` e só o servidor reclama.

**Objetivo**: o corredor corrige o campo certo antes de enviar.

**Regras de Negócio**:

- Estrutura no cliente; limites de domínio só no servidor.

**Especificação Técnica**:

- Schema `zod` por tela, com erro no campo.

**Critérios de Aceite**:

- [ ] "abc" em distância realça o campo e não envia.
- [ ] Valores fora do limite continuam sendo recusados pelo servidor.

**Roteiro de Teste**:

1. **Teste 1**: preencher distância com "8,2,1".
   - **Entrada**: toque em Registrar.
   - **Resultado Esperado**: erro no campo, nada na fila.
