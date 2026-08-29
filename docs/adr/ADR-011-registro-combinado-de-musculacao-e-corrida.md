# ADR-011: Registro combinado de musculação e corrida

> **Data**: 2026-08-25
> **Status**: Accepted
> **Story**: STORY-013
> **Decisores**: Produto e Engenharia Steady

## Contexto

O detalhamento diário deve ter uma única ação, `Registrar treino`. O corredor
escolhe o treino realmente executado dentro do fluxo. Em dias que também
prescrevem corrida, depois de concluir uma musculação o app pergunta se haverá
registro de corrida. Se houver, os dois registros precisam entrar juntos na
fila offline e ser persistidos sem estado parcial. Se a corrida não for
concluída, a musculação continua válida e deve ser enviada sozinha.

Hoje `strengthWorkout` e `running` são itens distintos da fila e usam endpoints
que salvam separadamente. Enfileirar dois itens consecutivos não garante que os
dois cheguem ao servidor na mesma tentativa nem na mesma transação.

## Opções Consideradas

### Opção A: Dois itens independentes na fila

- **Prós**: reutiliza integralmente os endpoints existentes.
- **Contras**: permite sincronização parcial e não satisfaz “enviar os dois
  juntos”.

### Opção B: Um comando combinado com transação no servidor

- **Prós**: uma chave de idempotência, uma unidade offline e uma transação para
  as duas execuções; mantém o fallback de musculação isolada.
- **Contras**: adiciona um tipo de fila, um DTO e um endpoint de composição.

### Opção C: Compensação após duas gravações

- **Prós**: preserva endpoints atuais.
- **Contras**: exigiria apagar ou invalidar sessão imutável, contrariando a Lei
  do Domínio #2 e aumentando a complexidade.

## Decisão

Escolhemos **Opção B** porque o registro combinado precisa ser atômico sem
violar a imutabilidade.

- Enquanto o corredor decide/preenche a corrida, a execução de musculação fica
  em um rascunho local separado da fila sincronizável.
- Se a corrida for recusada, cancelada ou abandonada, o rascunho é finalizado
  como o item `strengthWorkout` já existente.
- Se a corrida for concluída, o app cria um único item `combinedWorkout` com
  musculação e corrida e uma única chave de idempotência.
- Um endpoint de coaching reconstrói e valida os dois agregados e os persiste
  na mesma transação do `SteadyDbContext`.
- Reenvio da mesma chave retorna o par já persistido sem duplicar nenhuma parte.
- Um rascunho encontrado após reinício do app é recuperado como musculação
  isolada, pois a corrida não foi concluída.

## Consequências

### Positivas

- A fila nunca representa metade de um treino combinado concluído.
- Falha na corrida não descarta a musculação válida.
- A atomicidade e a idempotência são verificáveis na API.

### Negativas

- O app precisa de armazenamento temporário e tratamento explícito de retorno,
  cancelamento e reinício.
- O backend ganha um endpoint de orquestração além dos endpoints individuais.

### Riscos

- Rascunho ficar preso após encerramento de sessão → incluir o rascunho no
  descarte confirmado da conta.
- Duplo toque criar dois fluxos → uma chave de rascunho ativa e ação bloqueada
  durante a transição.
- Uma parte persistir antes da falha da outra → transação única e testes de
  rollback.
- Payload adulterado → reconstruir ambos os agregados e validar ownership da
  ficha antes de persistir.

## Referências

- `specs/STORY-013/story.md`
- `specs/STORY-013/blueprint.mermaid`
- ADR-003 — chave de idempotência para sincronização offline
- ADR-009 — ficha ativa substituível e execução imutável
