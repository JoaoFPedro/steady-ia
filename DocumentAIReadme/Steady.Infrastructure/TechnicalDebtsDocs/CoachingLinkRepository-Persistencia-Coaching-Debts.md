# CoachingLinkRepository - Persistencia-Coaching - Débitos Técnicos

## Índice

- [Resumo executivo](#resumo)
- [Criticidade e evidência](#problemas)
- [Plano de ação](#plano)
- [Story e roteiro de teste](#story)

<a id="resumo"></a>
## 1. Resumo executivo

O comportamento atual está descrito na [documentação técnica](../DevDocs/CoachingLinkRepository-Persistencia-Coaching-DevDocs.md). Esta análise registra uma limitação observada, não uma falha confirmada em produção. HasActiveAsync e consultas históricas/publicação usam verificações separadas da operação protegida. Encerramento concorrente pode acontecer depois da verificação de autorização.

<a id="problemas"></a>
## 2. Problemas por criticidade

**Críticos**: nenhum adicional comprovado nesta leitura.

**Importante - Robustez do contrato persistido**: HasActiveAsync e consultas históricas/publicação usam verificações separadas da operação protegida. Encerramento concorrente pode acontecer depois da verificação de autorização.

Evidência: [src/Steady.Infrastructure/Repositories/CoachingLinkRepository.cs](../../../src/Steady.Infrastructure/Repositories/CoachingLinkRepository.cs). Os métodos descritos em DevDocs permitem localizar a expressão/ramo; o problema é inferido da implementação, sem medição de produção.

**Ação recomendada**: Definir semântica de concorrência do consentimento e testar encerramento durante leitura/publicação antes de escolher bloqueio ou condição atômica.

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

**Contexto atual**: HasActiveAsync e consultas históricas/publicação usam verificações separadas da operação protegida. Encerramento concorrente pode acontecer depois da verificação de autorização.

**Objetivo e especificação técnica**: Definir semântica de concorrência do consentimento e testar encerramento durante leitura/publicação antes de escolher bloqueio ou condição atômica.

**Regras preservadas**: identidade do corredor, autorização por vínculo quando aplicável, fatos e prescrições imutáveis, retorno compatível ou mudança explícita de contrato.

**Critérios de aceite**:

- [ ] A reprodução deixa de produzir a limitação descrita.
- [ ] Resultado e efeitos de registros existentes permanecem compatíveis.
- [ ] O cenário de conta B nunca lê ou altera o recurso da conta A.

**Roteiro de teste concreto**:

1. Pausar PublishAsync após HasActiveAsync(P,A); encerrar vínculo em outro escopo; continuar publicação. Registrar comportamento atual e verificar semântica escolhida após correção.
2. P consulta histórico de B sem vínculo: esperado lista vazia, mesmo com vínculo ativo para A.

Fontes de decisão e testes existentes:

- [docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)
- [docs/adr/ADR-008-roles-vinculo-e-autorizacao-do-personal.md](../../../docs/adr/ADR-008-roles-vinculo-e-autorizacao-do-personal.md)
- [docs/adr/ADR-009-ficha-ativa-e-execucao-imutavel.md](../../../docs/adr/ADR-009-ficha-ativa-e-execucao-imutavel.md)
- [tests/Steady.Api.Tests/CoachingCardinalityEndpointTests.cs](../../../tests/Steady.Api.Tests/CoachingCardinalityEndpointTests.cs)
- [src/Steady.Infrastructure/Persistence/SteadyDbContext.cs](../../../src/Steady.Infrastructure/Persistence/SteadyDbContext.cs)

O roteiro acima é uma proposta de verificação da melhoria, não declaração de teste executado.

Especificações de comportamento relacionadas:

- [STORY-013](../../../specs/STORY-013/spec.bdd.md)
- [STORY-019](../../../specs/STORY-019/spec.bdd.md)
