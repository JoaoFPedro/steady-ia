# Registro e Historico de Musculacao - Persistencia-Treino - Regras de Negócio

## Índice

- [Resumo](#resumo)
- [Jornada](#jornada)
- [Regras e restrições](#regras)
- [Fluxo](#fluxo)
- [Cenários](#cenarios)

<a id="resumo"></a>
## 1. Resumo da funcionalidade

Guardar musculação resumida e dor, preservando o reenvio idempotente. Usuários: corredor e, nos recursos de coaching, personal autorizado por vínculo. A operação acontece nos registros/consultas do aplicativo ou no processamento de revisão. O valor é conservar histórico confiável e restringir acesso aos participantes autorizados.

<a id="jornada"></a>
## 2. Jornada do usuário

```mermaid
journey
    title Registro e Historico de Musculacao
    section Preparação
      Acessar conta autenticada: 5: Corredor
      Informar ou consultar dados próprios: 4: Corredor
    section Confirmação
      Receber resultado da operação: 4: Corredor
      Consultar histórico preservado: 5: Corredor
```

Pontos de contato: conta autenticada, funcionalidade de treino/planejamento/coaching e histórico ou revisão. Os repositórios não exibem telas; preservam os dados usados por esses pontos de contato.

<a id="regras"></a>
## 3. Regras de negócio e restrições

- **AddAsync**: Busca por corredor/chave; existente retorna Created=false. Mapeia Date, MuscleGroup, Intensity e DurationMinutes, gera Id, adiciona dor opcional e salva uma vez. Não cria ReviewOutbox: revisão detalhada pertence a TrainingSheetRepository.
- **GetByCorredorIdAsync**: Lista somente CorredorId, sem ordem nem paginação.
- **GetByIdAsync**: Consulta Id e CorredorId; ausência retorna null.

A conta recebida vem da autenticação na API. Onde há personal, papel e vínculo têm funções diferentes: ter o papel não concede acesso a todo corredor. A regra específica de autorização está descrita acima e na documentação técnica. Inputs do domínio são validados antes da persistência; não há diagnóstico médico nesta camada.

<a id="fluxo"></a>
## 4. Fluxos de processo

```mermaid
flowchart TD
    A[Conta autenticada inicia operação] --> B{Identidade e condições do contrato atendidas?}
    B -->|Não| C[Ausência ou falha conforme cenário]
    B -->|Sim| D[Consulta ou gravação do recurso descrito]
    D --> E{Recurso ou chave já existe?}
    E -->|Sim| F[Usa estado persistido conforme contrato]
    E -->|Não| G[Cria recurso ou retorna ausência]
    F --> H[Resultado para funcionalidade]
    G --> H
```

Integrações: autenticação fornece identidade; domínio valida prescrições/registros; persistência conserva estado; API traduz resultado para resposta.

<a id="cenarios"></a>
## 5. Casos de uso e cenários

| Entrada | Pré-condição/ação | Resultado esperado |
|---|---|---|
| A, chave K, 2026-08-30, duração 40, dor=true | Registro novo válido | Sessão e dor confirmadas; Created=true |
| A, mesma chave K | Reenvio | Sessão original e Created=false |
| B, Id da sessão de A | Busca | null |

A e B representam contas diferentes; K uma chave de idempotência; P um personal; R/L/F identificadores de revisão, vínculo ou ficha. Cada cenário parte do estado indicado, executa o método citado e verifica tanto o retorno quanto a ausência de mudança em dados alheios.

Referências normativas e técnicas:

- [docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)
- [docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md)
- [tests/Steady.Api.Tests/StrengthSessionEndpointTests.cs](../../../tests/Steady.Api.Tests/StrengthSessionEndpointTests.cs)
- [src/Steady.Infrastructure/Persistence/SteadyDbContext.cs](../../../src/Steady.Infrastructure/Persistence/SteadyDbContext.cs)
- [Detalhamento técnico](../DevDocs/StrengthSessionRepository-Persistencia-Treino-DevDocs.md)

Especificações de comportamento relacionadas:

- [STORY-003](../../../specs/STORY-003/spec.bdd.md)
