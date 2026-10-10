# CoachingLink - Acompanhamento - Especificacao Tecnica

## Indice

- [1. Visao Geral Tecnica](#visao)
- [2. Configuracao e Dependencias](#dependencias)
- [3. Detalhamento por Metodo](#metodos)
- [D1. Request](#metodo-1)
- [D1. Restore](#metodo-2)
- [D1. Accept](#metodo-3)
- [D1. End](#metodo-4)
- [D1. Expire](#metodo-5)
- [D1. GrantsAccess](#metodo-6)
- [U1. Enums Coaching](#metodo-7)
- [4. Observacoes Tecnicas](#observacoes)

<a id="visao"></a>
## 1. Visao Geral Tecnica

**Proposito e responsabilidades**: Controlar o ciclo de solicitacao, aceitacao e revogacao de acesso do personal.

**Fontes verificadas**: [Fonte](../../../src/Steady.Domain/Coaching/CoachingLink.cs); [Testes](../../../tests/Steady.Domain.Tests/CoachingLinkTests.cs); [STORY-013](../../../specs/STORY-013/spec.bdd.md), [ADR-008](../../../docs/adr/ADR-008-roles-vinculo-e-autorizacao-do-personal.md). As regras abaixo descrevem o codigo atual; controles das outras camadas sao identificados explicitamente.

<a id="dependencias"></a>
## 2. Configuracao e Dependencias

Dominio C# puro, sem injecao de framework, endpoints, repositorios ou acesso ao banco. Tipos de apoio constam na secao U1. Persistencia e integracao ficam em [Steady.Infrastructure](../../Steady.Infrastructure/DevDocs/README.md) e [Steady.Api](../../Steady.Api/DevDocs/README.md).

**Entrada e saida**: assinaturas, campos, estados e erros de cada operacao sao discriminados abaixo. Os tipos nao sao contratos HTTP; uma excecao de dominio nao equivale por si so a status HTTP.

**Assinaturas do codigo (entrada tipada e tipo de retorno)**:

- `public static CoachingLink Request(Guid personalId, Guid corredorId, DateTime requestedAt)`
- `public static CoachingLink Restore( Guid personalId, Guid corredorId, CoachingLinkStatus status, DateTime requestedAt, DateTime? acceptedAt, DateTime? endedAt)`
- `public void Accept(DateTime acceptedAt)`
- `public void End(DateTime endedAt)`
- `public void Expire(DateTime endedAt)`

<a id="metodos"></a>
## 3. Detalhamento por Metodo

**D. Entidade/Servico de Dominio**: CoachingLink. D1 identifica operacoes de dominio; U1 identifica tipos de apoio agrupados nesta unidade.

### Fluxo completo da unidade

```mermaid
sequenceDiagram
    participant Chamador
    participant Vinculo as CoachingLink
    Chamador->>Vinculo: Request(personalId, corredorId, requestedAt)
    alt IDs vazios ou iguais
        Vinculo-->>Chamador: ArgumentException
    else IDs validos
        Vinculo-->>Chamador: Pending, GrantsAccess=false
    end
    Chamador->>Vinculo: Accept(acceptedAt)
    alt Status diferente de Pending
        Vinculo-->>Chamador: InvalidOperationException
    else Pending
        Vinculo-->>Chamador: Active, AcceptedAt, GrantsAccess=true
    end
    Chamador->>Vinculo: End(endedAt)
    alt Ended ou Expired
        Vinculo-->>Chamador: Estado preservado
    else Pending ou Active
        Vinculo-->>Chamador: Ended, EndedAt, GrantsAccess=false
    end
    Note over Vinculo: Expire so muda Pending para Expired; Restore reconstroi sem validar
```

<a id="metodo-1"></a>
### D1. Request

Recebe personalId, corredorId e requestedAt. IDs vazios ou iguais geram ArgumentException. Retorna Pending, sem AcceptedAt/EndedAt e sem acesso.


<a id="metodo-2"></a>
### D1. Restore

Reconstitui todos os campos recebidos sem guard clauses. Nao executa Request nem verifica cronologia ou consistencia de estado.


<a id="metodo-3"></a>
### D1. Accept

Somente Pending pode passar a Active; outro estado gera InvalidOperationException. Registra acceptedAt.


<a id="metodo-4"></a>
### D1. End

Ended e Expired nao mudam. Pending ou Active passam a Ended e registram endedAt; AcceptedAt anterior e preservado.


<a id="metodo-5"></a>
### D1. Expire

Somente Pending passa a Expired com EndedAt; outros estados nao mudam.


<a id="metodo-6"></a>
### D1. GrantsAccess

Getter true exclusivamente em Active. Nao consulta roles nem outros vinculos.


<a id="metodo-7"></a>
### U1. Enums Coaching

CoachingLinkStatus: Pending, Active, Ended, Expired. AccountRole: Corredor e Personal. Role nao e parametro de Request nem garantia de autorizacao por si so.


<a id="observacoes"></a>
## 4. Observacoes Tecnicas

**Limites reais**: Nenhum metodo valida UTC ou ordem cronologica. Restore e uma porta confiada a persistencia. Cardinalidade global exige operacao transacional externa.

**Erros**: guard clauses interrompem antes de devolver objeto; metodos de transicao podem lancar InvalidOperationException quando descrito acima. Nao ha tratamento de excecoes ou logs internos.

**Desempenho**: factories e comparacoes percorrem apenas os campos/colecoes recebidos; nao fazem rede. Validacao de explicacao percorre texto e numeros permitidos. Nao ha medicao de desempenho publicada nestes testes.

**Documentos associados**: [Regras](../BusinessRulesDocs/Vinculo-com-Personal-Acompanhamento-Rules.md) e [Debitos](../TechnicalDebtsDocs/CoachingLink-Acompanhamento-Debts.md).
