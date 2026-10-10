# WorkoutReviewRepository - Persistencia-Revisao - Débitos Técnicos

## Índice

- [Resumo executivo](#resumo)
- [Criticidade e evidência](#problemas)
- [Plano de ação](#plano)
- [Story e roteiro de teste](#story)

<a id="resumo"></a>
## 1. Resumo executivo

O comportamento atual está descrito na [documentação técnica](../DevDocs/WorkoutReviewRepository-Persistencia-Revisao-DevDocs.md). Esta análise registra uma limitação observada, não uma falha confirmada em produção. GetByCorredorAsync materializa histórico completo. A ordenação não desempata revisões com mesma data e CreatedAt.

<a id="problemas"></a>
## 2. Problemas por criticidade

**Críticos**: nenhum adicional comprovado nesta leitura.

**Importante - Volume e estabilidade da consulta**: GetByCorredorAsync materializa histórico completo. A ordenação não desempata revisões com mesma data e CreatedAt.

Evidência: [src/Steady.Infrastructure/Repositories/WorkoutReviewRepository.cs](../../../src/Steady.Infrastructure/Repositories/WorkoutReviewRepository.cs). Os métodos descritos em DevDocs permitem localizar a expressão/ramo; o problema é inferido da implementação, sem medição de produção.

**Ação recomendada**: Paginar com ordem estável e manter autorização por corredor em cada página.

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

**Contexto atual**: GetByCorredorAsync materializa histórico completo. A ordenação não desempata revisões com mesma data e CreatedAt.

**Objetivo e especificação técnica**: Paginar com ordem estável e manter autorização por corredor em cada página.

**Regras preservadas**: identidade do corredor, autorização por vínculo quando aplicável, fatos e prescrições imutáveis, retorno compatível ou mudança explícita de contrato.

**Critérios de aceite**:

- [ ] A reprodução deixa de produzir a limitação descrita.
- [ ] Resultado e efeitos de registros existentes permanecem compatíveis.
- [ ] O cenário de conta B nunca lê ou altera o recurso da conta A.

**Roteiro de teste concreto**:

1. Inserir 205 registros válidos da conta A, incluindo dois com o mesmo instante de ordenação, e 3 da conta B; consultar A com limite 50. Esperado após correção: 50 itens por página, cursor estável, 205 Ids únicos ao percorrer páginas e nenhum Id de B.
2. Consultar última página e continuar seu cursor; esperado: lista vazia, sem repetir o último item.

Fontes de decisão e testes existentes:

- [docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)
- [docs/adr/ADR-008-roles-vinculo-e-autorizacao-do-personal.md](../../../docs/adr/ADR-008-roles-vinculo-e-autorizacao-do-personal.md)
- [docs/adr/ADR-014-fronteira-deterministica-da-revisao.md](../../../docs/adr/ADR-014-fronteira-deterministica-da-revisao.md)
- [tests/Steady.Api.Tests/WorkoutReviewEndpointTests.cs](../../../tests/Steady.Api.Tests/WorkoutReviewEndpointTests.cs)
- [src/Steady.Infrastructure/Persistence/SteadyDbContext.cs](../../../src/Steady.Infrastructure/Persistence/SteadyDbContext.cs)

O roteiro acima é uma proposta de verificação da melhoria, não declaração de teste executado.

Especificações de comportamento relacionadas:

- [STORY-014](../../../specs/STORY-014/spec.bdd.md)
