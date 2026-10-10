# StrengthSessionRepository - Persistencia-Treino - Débitos Técnicos

## Índice

- [Resumo executivo](#resumo)
- [Criticidade e evidência](#problemas)
- [Plano de ação](#plano)
- [Story e roteiro de teste](#story)

<a id="resumo"></a>
## 1. Resumo executivo

O comportamento atual está descrito na [documentação técnica](../DevDocs/StrengthSessionRepository-Persistencia-Treino-DevDocs.md). Esta análise registra uma limitação observada, não uma falha confirmada em produção. GetByCorredorIdAsync não limita o histórico, nem estabelece uma ordem. O registro resumido não contém detalhes necessários para revisão por exercício, o que é uma fronteira de produto, não um bug.

<a id="problemas"></a>
## 2. Problemas por criticidade

**Críticos**: nenhum adicional comprovado nesta leitura.

**Importante - Volume e estabilidade da consulta**: GetByCorredorIdAsync não limita o histórico, nem estabelece uma ordem. O registro resumido não contém detalhes necessários para revisão por exercício, o que é uma fronteira de produto, não um bug.

Evidência: [src/Steady.Infrastructure/Repositories/StrengthSessionRepository.cs](../../../src/Steady.Infrastructure/Repositories/StrengthSessionRepository.cs). Os métodos descritos em DevDocs permitem localizar a expressão/ramo; o problema é inferido da implementação, sem medição de produção.

**Ação recomendada**: Paginar o histórico resumido sem misturar esse contrato com execução de ficha.

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

**Contexto atual**: GetByCorredorIdAsync não limita o histórico, nem estabelece uma ordem. O registro resumido não contém detalhes necessários para revisão por exercício, o que é uma fronteira de produto, não um bug.

**Objetivo e especificação técnica**: Paginar o histórico resumido sem misturar esse contrato com execução de ficha.

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
- [docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md)
- [tests/Steady.Api.Tests/StrengthSessionEndpointTests.cs](../../../tests/Steady.Api.Tests/StrengthSessionEndpointTests.cs)
- [src/Steady.Infrastructure/Persistence/SteadyDbContext.cs](../../../src/Steady.Infrastructure/Persistence/SteadyDbContext.cs)

O roteiro acima é uma proposta de verificação da melhoria, não declaração de teste executado.

Especificações de comportamento relacionadas:

- [STORY-003](../../../specs/STORY-003/spec.bdd.md)
