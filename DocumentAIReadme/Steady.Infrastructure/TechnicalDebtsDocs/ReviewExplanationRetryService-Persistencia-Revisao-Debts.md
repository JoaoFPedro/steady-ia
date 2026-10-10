# ReviewExplanationRetryService - Persistencia-Revisao - Débitos Técnicos

## Índice

- [Resumo executivo](#resumo)
- [Criticidade e evidência](#problemas)
- [Plano de ação](#plano)
- [Story e roteiro de teste](#story)

<a id="resumo"></a>
## 1. Resumo executivo

O comportamento atual está descrito na [documentação técnica](../DevDocs/ReviewExplanationRetryService-Persistencia-Revisao-DevDocs.md). Esta análise registra uma limitação observada, não uma falha confirmada em produção. Quando o provedor retorna null ou lança, RetryAsync muda o status para Unavailable mas não limpa ExplanationJson pré-existente; a limpeza só ocorre no ramo de rejeição. O estado persistido pode conservar texto antigo junto do status indisponível.

<a id="problemas"></a>
## 2. Problemas por criticidade

**Críticos**: nenhum adicional comprovado nesta leitura.

**Importante - Robustez do contrato persistido**: Quando o provedor retorna null ou lança, RetryAsync muda o status para Unavailable mas não limpa ExplanationJson pré-existente; a limpeza só ocorre no ramo de rejeição. O estado persistido pode conservar texto antigo junto do status indisponível.

Evidência: [src/Steady.Infrastructure/Repositories/ReviewExplanationRetryService.cs](../../../src/Steady.Infrastructure/Repositories/ReviewExplanationRetryService.cs). Os métodos descritos em DevDocs permitem localizar a expressão/ramo; o problema é inferido da implementação, sem medição de produção.

**Ação recomendada**: Definir retenção de explicação anterior e tornar persistência/contrato consistentes, sem alterar fatos ou ação.

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

**Contexto atual**: Quando o provedor retorna null ou lança, RetryAsync muda o status para Unavailable mas não limpa ExplanationJson pré-existente; a limpeza só ocorre no ramo de rejeição. O estado persistido pode conservar texto antigo junto do status indisponível.

**Objetivo e especificação técnica**: Definir retenção de explicação anterior e tornar persistência/contrato consistentes, sem alterar fatos ou ação.

**Regras preservadas**: identidade do corredor, autorização por vínculo quando aplicável, fatos e prescrições imutáveis, retorno compatível ou mudança explícita de contrato.

**Critérios de aceite**:

- [ ] A reprodução deixa de produzir a limitação descrita.
- [ ] Resultado e efeitos de registros existentes permanecem compatíveis.
- [ ] O cenário de conta B nunca lê ou altera o recurso da conta A.

**Roteiro de teste concreto**:

1. Revisão de A com ExplanationJson anterior e provedor retorna null: verificar status/texto; após correção ambos seguem política definida de retenção, sem exposição de texto como disponível indevidamente.
2. Provedor retorna número 999 inexistente nos fatos: esperado rejeição, ExplanationJson=null, Unavailable e Action intacta; B pede retry do mesmo Id e recebe false.

Fontes de decisão e testes existentes:

- [docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)
- [docs/adr/ADR-014-fronteira-deterministica-da-revisao.md](../../../docs/adr/ADR-014-fronteira-deterministica-da-revisao.md)
- [docs/adr/ADR-016-provedor-da-explicacao-da-revisao.md](../../../docs/adr/ADR-016-provedor-da-explicacao-da-revisao.md)
- [tests/Steady.Api.Tests/WorkoutReviewEndpointTests.cs](../../../tests/Steady.Api.Tests/WorkoutReviewEndpointTests.cs)
- [src/Steady.Infrastructure/Persistence/SteadyDbContext.cs](../../../src/Steady.Infrastructure/Persistence/SteadyDbContext.cs)

O roteiro acima é uma proposta de verificação da melhoria, não declaração de teste executado.

Especificações de comportamento relacionadas:

- [STORY-014](../../../specs/STORY-014/spec.bdd.md)
