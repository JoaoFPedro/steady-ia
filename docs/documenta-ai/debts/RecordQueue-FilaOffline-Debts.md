---
source: src/steady-app/src/sync/syncEngine.ts
commit: 36025829198246e0e495611fa995540d85de25ea
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-003, STORY-005, STORY-010
---

# RecordQueue - Fila Offline - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: desenho correto (chave gerada no `enqueue`, rejeição versus transitório, auto-sync) e bem testado em unidade. É a unidade de maior risco do app, porque o teste ponta a ponta só existe manual no aparelho.
- **Principais Problemas**: escrita na fila sem exclusão mútua e rejeições que podem sumir sem aviso.
- **Impacto no Negócio**: perda silenciosa de um registro de treino é o pior defeito possível para a promessa "registrar nunca falha".

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum comprovado por execução. O item de corrida de escrita abaixo é o candidato mais forte e fica como Importante até ser reproduzido.

### 🟡 Importantes

- **Corrida de escrita na fila (ler-modificar-gravar)**: `RecordQueue.enqueue` e `remove` leem a lista inteira, alteram e regravam; não há mutex. Se `SyncEngine` remove um item (ou o auto-sync dispara) enquanto outro registro está sendo enfileirado, as duas operações podem ler o mesmo estado e a segunda gravação apagar a alteração da primeira, perdendo um registro novo ou ressuscitando um já enviado (este caso é inofensivo pela idempotência; o outro não).
  - **Categoria**: integridade de dados. Candidato a crítico se reproduzido.
  - **Evidência**: `src/steady-app/src/sync/recordQueue.ts:32-33` e `:44-45`; chamadas concorrentes possíveis a partir de `_layout.tsx`, `autoSync.ts` e `logRecord.ts`.
  - **Ação Recomendada**: serializar todas as operações da fila (promessa encadeada) e, em seguida, testar com `enqueue` concorrente a `sync`.
- **Rejeições de outros tipos ou do auto-sync não chegam ao corredor**: `outcomeOf` só olha `rejected` do mesmo `kind` do registro atual, e `startAutoSync`/`_layout` descartam o `SyncSummary`. Um item recusado (400) é removido da fila em `SyncEngine` sem que ninguém exiba a mensagem, apesar do comentário "o corredor precisa saber".
  - **Evidência**: `src/steady-app/src/features/logRecord.ts:50`; `src/steady-app/src/sync/autoSync.ts:28`; `src/steady-app/app/_layout.tsx:37`.
  - **Ação Recomendada**: guardar rejeições em um registro local visível e exibi-las na tela inicial.
- **`sync()` pode rodar concorrente**: abertura do app, auto-sync e cada registro chamam `sync()` sem trava; o mesmo item pode ser enviado duas vezes em paralelo (a idempotência evita duplicata, mas há tráfego e estado de `deferred` inconsistente).
  - **Ação Recomendada**: uma única sincronização em andamento por vez (compartilhar a promessa, como `GoogleSignInSession` já faz).

### 🟢 Menores

- **Fila corrompida vira vazia sem aviso** (`asyncStorageQueue.ts:21-23`): registros ilegíveis somem. Decisão deliberada, mas silenciosa.
- **Sem limite de tamanho nem de idade** na fila.
- **O ciclo é sequencial**: um item que trava atrasa os demais (relacionado à ausência de timeout em [HttpClients](HttpClients-Integracao-Debts.md)).

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum comprovado; tratar a corrida de escrita como prioridade.
2. **Fase 2 - Importantes**: serializar a fila, exibir rejeições, uma sync por vez.
3. **Fase 3 - Menores**: aviso de fila corrompida.

## 4. User Stories para Implementação

### Story 1: Fila de registros sem perda por concorrência

**Contexto Atual**: operações da fila são ler-modificar-gravar sem exclusão mútua.

**Objetivo**: nenhum registro enfileirado é perdido por intercalação de operações.

**Regras de Negócio**:

- Guardado é guardado: registro confirmado ao corredor não pode sumir (STORY-003).

**Especificação Técnica**:

- Serializar `enqueue`, `remove`, `clear` e `count` por uma cadeia de promessas; compartilhar a sincronização em andamento.

**Critérios de Aceite**:

- [ ] `enqueue` concorrente a `remove` mantém ambos os efeitos.
- [ ] Duas chamadas a `sync()` simultâneas fazem um único ciclo de envio.

**Roteiro de Teste**:

1. **Teste 1**: armazenamento falso com atraso, `enqueue(B)` durante `remove(A)`.
   - **Entrada**: fila `[A]`.
   - **Resultado Esperado**: fila final `[B]`.

### Story 2: Rejeições visíveis ao corredor

**Contexto Atual**: item recusado é removido e a mensagem só aparece para o mesmo `kind` do registro corrente.

**Objetivo**: toda recusa definitiva é mostrada.

**Critérios de Aceite**:

- [ ] Recusa durante o auto-sync aparece na tela inicial.
- [ ] Recusa de outro tipo também aparece.

**Roteiro de Teste**:

1. **Teste 1**: item antigo de dor recusado durante o registro de uma corrida.
   - **Resultado Esperado**: o corredor vê a mensagem da recusa da dor.
