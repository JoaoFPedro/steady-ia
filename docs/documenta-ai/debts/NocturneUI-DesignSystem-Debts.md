---
source: src/steady-app/src/ui/Nocturne.tsx
commit: da7af20c48ebc43860c7d27384064802f9c29cd0
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-004, STORY-017
---

# NocturneUI - Design System - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: tokens centralizados e nenhum hex solto nas telas (verificado por busca nos arquivos `.tsx`).
- **Principais Problemas**: a regra "peso até 500" e a fonte Inter declaradas no sistema não são cumpridas, e há acessibilidade básica ausente nos campos.
- **Impacto no Negócio**: inconsistência visual e menor acessibilidade; sem risco de dados.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum comprovado nesta unidade.

### 🟡 Importantes

- **Campos sem rótulo de acessibilidade**: `Field` e `Choice` mostram o rótulo como `Text` solto, sem `accessibilityLabel` no `TextInput`; um leitor de tela anuncia o campo sem o nome (e `Choice` usa `role="radio"` sem agrupar o grupo).
  - **Evidência**: `src/steady-app/src/ui/Field.tsx:32-47`.
  - **Ação Recomendada**: `accessibilityLabel={label}` no `TextInput` e `accessibilityLabelledBy`/grupo em `Choice`.

### 🟢 Menores

- **Fonte Inter declarada e não carregada**: `font.family = 'Inter'` existe em `theme/nocturne.ts`, mas nenhuma tela usa `font.family` e não há carregamento de fonte (`expo-font`); o app renderiza com a fonte do sistema. Só `monospace` é usado explicitamente.
  - **Evidência**: `src/steady-app/src/theme/nocturne.ts:109-113`.
- **Peso de fonte acima de 500**: o sistema diz que títulos não passam de 500, mas há 6 usos de `fontWeight` 600 ou 700.
  - **Evidência**: `app/(tabs)/index.tsx:401`, `app/(tabs)/planning.tsx:182,188`, `app/planning/plan.tsx:162`, `src/planning/PlanningForm.tsx:323`, `src/planning/PlanningDocument.tsx:318`.
- **`MultiChoice` mora em `planning/`** e repete o estilo de `Choice` (duas cópias do mesmo bloco de estilos).
  - **Evidência**: `src/steady-app/src/planning/MultiChoice.tsx`.
- **`ExerciseList` usa o nome do exercício como `key`**: nomes repetidos na mesma lista geram chave duplicada.
  - **Evidência**: `src/steady-app/src/planning/ExerciseList.tsx:10`.
- **Contraste não medido**: `placeholder` em `ghost` (32%) e legendas em `faint` (45%) sobre `#161826`/`#232532` podem ficar abaixo de 4,5:1; não há verificação no repositório.

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum.
2. **Fase 2 - Importantes**: acessibilidade dos campos.
3. **Fase 3 - Menores**: pesos de fonte, fonte Inter, mover `MultiChoice`, contraste.

## 4. User Stories para Implementação

### Story 1: Campos acessíveis por leitor de tela

**Contexto Atual**: o rótulo do campo não é lido junto do `TextInput`.

**Objetivo**: todo campo e grupo de escolha tem nome acessível.

**Regras de Negócio**:

- Sem regra de domínio; requisito de acessibilidade.

**Especificação Técnica**:

- `accessibilityLabel` em `Field`; agrupamento semântico em `Choice`/`MultiChoice`.

**Critérios de Aceite**:

- [ ] TalkBack anuncia "Distância (km), campo de edição".
- [ ] Cada opção de `Choice` anuncia o grupo e o estado.

**Roteiro de Teste**:

1. **Teste 1**: abrir "Registrar corrida" com TalkBack.
   - **Entrada**: foco em cada campo.
   - **Resultado Esperado**: nome do campo anunciado.
