---
source: src/steady-app/src/ui/Nocturne.tsx
commit: da7af20c48ebc43860c7d27384064802f9c29cd0
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-004, STORY-017
---

# NocturneUI - Design System - Especificação Técnica

## Índice

- [1. Visão Geral Técnica](#1-visão-geral-técnica)
- [2. Configuração e Dependências](#2-configuração-e-dependências)
- [3. Detalhamento por Componente](#3-detalhamento-por-componente)
  - [3.1. Tokens](#31-tokens)
  - [3.2. Componentes de `ui/`](#32-componentes-de-ui)
  - [3.3. Estado de erro em campo](#33-estado-de-erro-em-campo)
- [4. Observações Técnicas](#4-observações-técnicas)

## 1. Visão Geral Técnica

**Propósito**: sistema visual do app (Nocturne): tokens de cor, espaço, raio, tipografia e as peças reutilizáveis de tela.
**Responsabilidades**:

- `src/theme/nocturne.ts`: tokens espelhados do `styles.css` do design system (`Marathon training app design/_ds/nocturne-*`). Nenhum hex, tamanho ou raio solto na UI.
- `src/ui/Nocturne.tsx`: `Kicker`, `Tag`, `Card`, `HeroCard`, `NoticeStrip`, `PrimaryButton`, `SecondaryButton`, `Rule`, `Muted`.
- `src/ui/Field.tsx`, `Choice.tsx`, `Avatar.tsx`: entrada de texto, escolha única e avatar.
- `src/planning/MultiChoice.tsx`, `ExerciseList.tsx`, `planningStyles.ts`: peças usadas pelo planejamento.
**Integrações**: nenhuma (só React Native).

## 2. Configuração e Dependências

**Regras do sistema** (carregadas pelas peças):

- Fundo `#161826`, superfície `#232532`, texto `#e9e9ed`, accent `#9184d9`.
- O accent é **linha e brilho**, nunca preenchimento amplo; o botão primário é **contorno**.
- Espaçamento denso (escala com 0.7x embutido) e raio de 8 px nos controles.
- Elevação em fundo escuro é aresta fina (`elevation.sm`, `elevation.accentOutline`), nunca sombra empilhada.
- A rampa `danger` (300, 500, 900) é **exclusiva de estado de erro em campo de formulário** (ADR-017).

## 3. Detalhamento por Componente

### 3.1. Tokens

| Token | Conteúdo |
| --- | --- |
| `color` | `bg`, `surface`, `text`, `accent`, rampa `neutral` (100 a 900), `danger` (300, 500, 900), `accentRamp` (100 a 900) |
| `textAlpha` | `muted .55`, `label .70`, `soft .60`, `faint .45`, `ghost .32`, `divider .16`, `rule .08` |
| `space` | `1: 2.8`, `2: 5.6`, `3: 8.4`, `4: 11.2`, `6: 16.8`, `8: 22.4` |
| `radius` | `sm 4`, `md 8`, `lg 14`, `xl 16` |
| `type` | `display 32`, `title 27`, `section 22`, `cardTitle 19`, `body 15`, `bodySm 13.5`, `meta 12.5`, `label 11.5`, `kicker 10.5` |
| `font` | família `Inter`, peso de títulos 500, corpo 400 |

### 3.2. Componentes de `ui/`

| Componente | Função |
| --- | --- |
| `Kicker` | rótulo curto em caixa alta; `accent` opcional |
| `Tag` | etiqueta tingida que qualifica um bloco (nunca uma ação) |
| `Card`, `HeroCard` | superfície padrão e card de destaque (accent-900 chapado, sem biblioteca de gradiente) |
| `NoticeStrip` | faixa de aviso: superfície com contorno de 1 px em accent-700 |
| `PrimaryButton`, `SecondaryButton` | botões com `accessibilityRole="button"`, estados pressionado e desabilitado |
| `Field` | rótulo pequeno + `TextInput`; props `keyboardType`, `multiline`, `error` |
| `Choice<T>` | controle segmentado; opção ativa por contorno accent; `accessibilityRole="radio"` |
| `MultiChoice<T>` | seleção múltipla; `accessibilityRole="checkbox"` |
| `Avatar` | inicial desenhada primeiro, foto por cima; se a imagem falha, a inicial permanece |

### 3.3. Estado de erro em campo

- `Field` com `error` realça o rótulo (`danger-300`), o contorno (`danger-500`), o fundo (`danger-900`) e mostra a mensagem logo abaixo do campo.
- Usado pelo formulário da ficha do personal (STORY-017); o aviso do topo fica para erros que não pertencem a campo algum.

## 4. Observações Técnicas

- **Performance**: componentes puros, sem estado, exceto `Avatar` (flag de falha da imagem).
- **Tratamento de Erros**: foto de avatar que falha cai silenciosamente para a inicial.
- **Integrações Críticas**: os tokens precisam acompanhar o design system de origem em `Marathon training app design/`.
- **Segurança**: não aplicável.
