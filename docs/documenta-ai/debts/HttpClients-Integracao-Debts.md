---
source: src/steady-app/src/api/httpRecordApi.ts
commit: 2bc6f2e3bdbc21bb2cd828f4a2e295fac88cfff7
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-002, STORY-003, STORY-013
---

# HttpClients - Integração - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: separação clara entre rejeição permanente e falha transitória, retry de token e testes dos clientes.
- **Principais Problemas**: política de token copiada três vezes e ausência de timeout.
- **Impacto no Negócio**: uma rede pendurada pode deixar a fila "sincronizando" sem fim.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum comprovado nesta unidade.

### 🟡 Importantes

- **Sem timeout nas chamadas**: nenhum cliente passa `AbortController` ou prazo ao `fetch`; uma conexão que não responde bloqueia `SyncEngine.sync()` (que é sequencial) e, com ele, o registro que aguarda o desfecho.
  - **Evidência**: `src/steady-app/src/api/httpRecordApi.ts:56`, `httpQueryApi.ts:87`, `httpCoachingApi.ts:129`.
  - **Ação Recomendada**: prazo por requisição, tratado como `transportFailure`.
- **`get` do `HttpCoachingApi` não protege o `json()`**: `await response.json() as T` fica fora do `try/catch`; um 200 com corpo inválido propaga exceção ao chamador em vez de virar `failure`.
  - **Evidência**: `src/steady-app/src/api/httpCoachingApi.ts:80-83`.
  - **Ação Recomendada**: tratar a exceção e devolver `failure`.
- **Contratos sem validação em runtime em `HttpCoachingApi`**: o JSON é aceito como `T` (decisão registrada no comentário, "é a própria API do Steady"); mudança de contrato no servidor quebra telas sem aviso.
  - **Ação Recomendada**: validar com `zod` os documentos centrais (ficha, plano, revisão).

### 🟢 Menores

- **Lógica de token triplicada** (`currentToken ?? refresh`, retry em 401) nos três clientes: terceira ocorrência, ponto da regra de três da Constituição para extrair.
  - **Ação Recomendada**: função compartilhada de requisição autenticada.
- **Cabeçalhos `Accept`/`Content-Type` divergem** entre clientes (`HttpRecordApi` não envia `Accept`).

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum.
2. **Fase 2 - Importantes**: timeout e proteção do `json()`.
3. **Fase 3 - Menores**: extrair a política de token.

## 4. User Stories para Implementação

### Story 1: Requisições com prazo e leitura segura

**Contexto Atual**: nenhuma chamada tem prazo; `get` pode lançar em corpo inválido.

**Objetivo**: toda falha de rede ou de corpo vira resultado tratável.

**Regras de Negócio**:

- Falha passageira mantém o registro na fila (ADR-003).

**Especificação Técnica**:

- Prazo por requisição nos três clientes; `json()` dentro de `try/catch`.

**Critérios de Aceite**:

- [ ] Requisição sem resposta no prazo vira `transportFailure` ou `failure`.
- [ ] 200 com corpo inválido em `get` devolve `failure`.

**Roteiro de Teste**:

1. **Teste 1**: `fetch` que nunca resolve.
   - **Entrada**: envio de um registro.
   - **Resultado Esperado**: `transportFailure` após o prazo; item permanece na fila.
