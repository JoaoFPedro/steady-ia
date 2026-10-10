# ReviewOutboxProcessor - Persistencia-Revisao - Débitos Técnicos

## Índice

- [Resumo executivo](#resumo)
- [Criticidade e evidência](#problemas)
- [Plano de ação](#plano)
- [Story e roteiro de teste](#story)

<a id="resumo"></a>
## 1. Resumo executivo

O comportamento atual está descrito na [documentação técnica](../DevDocs/ReviewOutboxProcessor-Persistencia-Revisao-DevDocs.md). Esta análise registra uma limitação observada, não uma falha confirmada em produção. RecalculateCoherenceAsync faz consultas dentro do loop de revisões e ExecutionLoadAsync pode fazer várias por revisão. Também há SaveChanges da revisão antes da confirmação final da outbox; isso é coberto pela deduplicação e não é atomicidade única do processamento.

<a id="problemas"></a>
## 2. Problemas por criticidade

**Críticos**: nenhum adicional comprovado nesta leitura.

**Importante - Robustez do contrato persistido**: RecalculateCoherenceAsync faz consultas dentro do loop de revisões e ExecutionLoadAsync pode fazer várias por revisão. Também há SaveChanges da revisão antes da confirmação final da outbox; isso é coberto pela deduplicação e não é atomicidade única do processamento.

Evidência: [src/Steady.Infrastructure/Repositories/ReviewOutboxProcessor.cs](../../../src/Steady.Infrastructure/Repositories/ReviewOutboxProcessor.cs). Os métodos descritos em DevDocs permitem localizar a expressão/ramo; o problema é inferido da implementação, sem medição de produção.

**Ação recomendada**: Reduzir consultas repetidas carregando mapas de execução/revisão por corredor; medir quantidade de comandos e conservar recomputação após retomada.

**Menores**: nenhum item independente levantado; decisões deliberadas de versão, texto de data e imutabilidade não são automaticamente débitos.

<a id="plano"></a>
## 3. Plano de ação

1. Reproduzir a limitação em teste com PostgreSQL e contratos atuais.
2. Confirmar comportamento desejado com a spec correspondente antes de alterar contrato.
3. Implementar a correção focal e executar regressão de isolamento, idempotência e resultado.

```mermaid
graph LR
    A[Evidência no método] --> B[Teste de reprodução]
    B --> C[Correção focal]
    C --> D[Regressão e medição]
```

<a id="story"></a>
## 4. Story: tornar a operação previsível sob a condição observada

**Contexto atual**: RecalculateCoherenceAsync faz consultas dentro do loop de revisões e ExecutionLoadAsync pode fazer várias por revisão. Também há SaveChanges da revisão antes da confirmação final da outbox; isso é coberto pela deduplicação e não é atomicidade única do processamento.

**Objetivo e especificação técnica**: Reduzir consultas repetidas carregando mapas de execução/revisão por corredor; medir quantidade de comandos e conservar recomputação após retomada.

**Regras preservadas**: identidade do corredor, autorização por vínculo quando aplicável, fatos e prescrições imutáveis, retorno compatível ou mudança explícita de contrato.

**Critérios de aceite**:

- [ ] A reprodução deixa de produzir a limitação descrita.
- [ ] Resultado e efeitos de registros existentes permanecem compatíveis.
- [ ] O cenário de conta B nunca lê ou altera o recurso da conta A.

**Roteiro de teste concreto**:

1. Inserir 100 revisões acionáveis e 101 execuções da conta A; registrar comandos SQL durante processamento. Esperado após correção: reduzir consultas repetidas mantendo mesmos status de coerência.
2. Interromper após salvar revisão e deixar lease expirar; reiniciar. Esperado: uma revisão por execução e outbox Completed, sem alterar registros de B.

Fontes de decisão e testes existentes:

- [docs/adr/ADR-013-plano-do-steady-como-fonte-de-prescricao.md](../../../docs/adr/ADR-013-plano-do-steady-como-fonte-de-prescricao.md)
- [docs/adr/ADR-014-fronteira-deterministica-da-revisao.md](../../../docs/adr/ADR-014-fronteira-deterministica-da-revisao.md)
- [docs/adr/ADR-015-tolerancias-e-politicas-versionadas.md](../../../docs/adr/ADR-015-tolerancias-e-politicas-versionadas.md)
- [docs/adr/ADR-016-provedor-da-explicacao-da-revisao.md](../../../docs/adr/ADR-016-provedor-da-explicacao-da-revisao.md)
- [docs/adr/ADR-018-outbox-transacional-da-revisao.md](../../../docs/adr/ADR-018-outbox-transacional-da-revisao.md)
- [docs/adr/ADR-019-identidade-historica-do-exercicio.md](../../../docs/adr/ADR-019-identidade-historica-do-exercicio.md)
- [tests/Steady.Api.Tests/AdherencePersistenceTests.cs](../../../tests/Steady.Api.Tests/AdherencePersistenceTests.cs)
- [src/Steady.Infrastructure/Persistence/SteadyDbContext.cs](../../../src/Steady.Infrastructure/Persistence/SteadyDbContext.cs)

O roteiro acima é uma proposta de verificação da melhoria, não declaração de teste executado.

Especificações de comportamento relacionadas:

- [STORY-014](../../../specs/STORY-014/spec.bdd.md)
