# ADR-018: Outbox transacional para criação durável da revisão

> **Data**: 2026-08-30
> **Status**: Accepted
> **Story**: STORY-014
> **Decisores**: Produto e Engenharia Steady

## Contexto

A revisão nasce depois que uma execução offline é sincronizada. Criá-la por uma
chamada em memória após o commit abre uma janela de perda: o treino pode estar
confirmado e o processo cair antes de registrar que há uma revisão a produzir.
A chamada ao provedor externo também não pode participar da transação do treino.

## Opções Consideradas

### Opção A: Processar tudo dentro da transação

- **Prós**: aparente atomicidade.
- **Contras**: mantém transação aberta durante cálculo e rede; falha da IA
  invalida o treino, contrariando a spec.

### Opção B: Chamada pós-commit somente em memória

- **Prós**: implementação pequena.
- **Contras**: queda após o commit perde silenciosamente a revisão.

### Opção C: Outbox no mesmo PostgreSQL

- **Prós**: execução e intenção de processamento são atômicas; retomável;
  aproveita a infraestrutura existente.
- **Contras**: exige tabela, worker, estados e política de retentativa.

## Decisão

Escolhemos **Opção C**. A transação da execução insere um evento
`WorkoutRecorded` na outbox com chave única derivada da execução. Um worker
adquire eventos pendentes com concorrência segura, produz a comparação e a
revisão idempotentemente e marca o evento como concluído. Falha transitória
mantém o evento pendente com contagem e próximo horário; falha da explicação não
falha o evento, pois a revisão pode existir com explicação indisponível.

O processamento usa uma chave única por tipo e id da execução. A revisão também
possui unicidade por execução. Esses dois limites tornam retomada e workers
concorrentes seguros. Nenhuma resposta bruta do provedor entra na outbox.

## Consequências

### Positivas

- Uma execução confirmada nunca perde sua solicitação de revisão.
- Reinício e concorrência não duplicam treino nem revisão.
- A dependência externa permanece fora da transação de negócio.

### Negativas

- A revisão é eventual e ganha o estado observável `PendenteDeProcessamento`.
- Operação precisa monitorar eventos pendentes e falhas repetidas.

### Riscos

- Evento preso por crash durante aquisição → lease expira e outro ciclo retoma.
- Poison message em loop → backoff e limite auditável, sem apagar o evento.
- Vazamento de dados → payload guarda somente ids internos necessários; fatos
  autorizados são montados no processamento.

## Referências

- `specs/STORY-014/spec.bdd.md`
- ADR-003 — idempotência da fila offline
- ADR-014 — revisão como fato próprio
- ADR-016 — provedor fora da transação
