---
source: src/steady-app/app/personal/runner.tsx
commit: ea9fcfa33fea1267443adf990b6b2950a8692c85
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-013, STORY-015, STORY-017, STORY-019, STORY-020
---

# PersonalCoach - Personal - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: validação do formulário e linha do tempo bem extraídas e testadas; separação clara entre estrutura (cliente) e limites (servidor).
- **Principais Problemas**: falha de leitura exibida como "vazio" (o anti-padrão que o ADR-004 nomeia) e enumeração de e-mail sem limite.
- **Impacto no Negócio**: o personal pode concluir que um corredor não tem treinos quando a leitura apenas falhou.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum comprovado nesta unidade.

### 🟡 Importantes

- **Falha de leitura vira "nenhum registro"** em duas telas: no histórico do corredor, `history = null` quando o status não é `ok` e a tela mostra "Nenhuma execução registrada."; na lista de vinculados, falha vira `[]` e mostra "Nenhum corredor vinculado." Dizer vazio quando é falha é o que o ADR-004 proíbe e já foi corrigido no lado do corredor.
  - **Evidência**: `src/steady-app/app/personal/runner.tsx:58` e `:158`; `src/steady-app/app/(tabs)/personal.tsx:23` e `:82`.
  - **Ação Recomendada**: estado `unavailable` distinto, com aviso e "tentar de novo".
- **Busca de corredor por e-mail sem limite de tentativas**: a API responde explicitamente se o e-mail existe (aceito para o MVP no ADR-008); já listado como pendência nº 6 do `PROJECT.md`. No app não há bloqueio nem atraso na busca.
  - **Categoria**: OWASP A07 (falha de identificação/enumeração de contas).
  - **Evidência**: `src/steady-app/app/(tabs)/personal.tsx:27-43`.
  - **Ação Recomendada**: limitar no servidor antes de produção pública.

### 🟢 Menores

- **Tela com 384 linhas** (`app/personal/runner.tsx`), acima do limite de 300 do FF-003, misturando formulário, histórico e revisão.
- **Rascunho da ficha não é guardado**: sair da tela perde até 15 campos preenchidos; "Criar Ficha" sempre abre vazio.
- **Publicar não pede confirmação** apesar de substituir a ficha ativa (o aviso é apenas texto fixo no topo).
- **`name` e `email` do corredor viajam como parâmetros de rota**: aparecem em deep links e logs de navegação (dado pessoal em URL interna).
  - **Evidência**: `src/steady-app/app/(tabs)/personal.tsx:91-97`.

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum.
2. **Fase 2 - Importantes**: estado de indisponível nas duas telas e limite de busca no servidor.
3. **Fase 3 - Menores**: dividir a tela, rascunho local e confirmação de substituição.

## 4. User Stories para Implementação

### Story 1: Histórico e lista do personal sem "vazio" por falha

**Contexto Atual**: falha de leitura é apresentada como ausência de dados.

**Objetivo**: o personal distingue "não há" de "não consegui ler".

**Regras de Negócio**:

- Falha nunca vira vazio (ADR-004).

**Especificação Técnica**:

- Estado `unavailable` em `PersonalScreen` e `PersonalRunnerScreen`, com mensagem e ação de repetir.

**Critérios de Aceite**:

- [ ] Falha ao carregar o histórico mostra aviso, não "Nenhuma execução registrada."
- [ ] Falha ao carregar a lista mostra aviso, não "Nenhum corredor vinculado."

**Roteiro de Teste**:

1. **Teste 1**: derrubar a API e abrir o corredor.
   - **Entrada**: `history` retorna `failure`.
   - **Resultado Esperado**: aviso de indisponibilidade e botão para tentar de novo.
