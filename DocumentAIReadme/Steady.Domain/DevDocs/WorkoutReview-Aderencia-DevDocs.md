# WorkoutReview - Aderencia - Especificacao Tecnica

## Indice

- [1. Visao Geral Tecnica](#visao)
- [2. Configuracao e Dependencias](#dependencias)
- [3. Detalhamento por Metodo](#metodos)
- [D1. Create](#metodo-1)
- [D1. MarkUnderstood](#metodo-2)
- [D1. MarkContested](#metodo-3)
- [D1. UpdateCoherence](#metodo-4)
- [D1. TrySetExplanation](#metodo-5)
- [D1. MarkExplanationUnavailable](#metodo-6)
- [D1. Reject](#metodo-7)
- [U1. ExplanationValidationResult](#metodo-8)
- [U1. IExplanationProvider.ExplainAsync](#metodo-9)
- [U1. Records e enums](#metodo-10)
- [4. Observacoes Tecnicas](#observacoes)

<a id="visao"></a>
## 1. Visao Geral Tecnica

**Proposito e responsabilidades**: Guardar comparacao, acao, versoes e estado da explicacao separados da execucao.

**Fontes verificadas**: [Fonte](../../../src/Steady.Domain/Adherence/WorkoutReview.cs); [Testes](../../../tests/Steady.Domain.Tests/WorkoutReviewTests.cs); [STORY-014](../../../specs/STORY-014/spec.bdd.md), [ADR-014](../../../docs/adr/ADR-014-fronteira-deterministica-da-revisao.md), [ADR-015](../../../docs/adr/ADR-015-tolerancias-e-politicas-versionadas.md), [ADR-016](../../../docs/adr/ADR-016-provedor-da-explicacao-da-revisao.md), [ADR-018](../../../docs/adr/ADR-018-outbox-transacional-da-revisao.md). As regras abaixo descrevem o codigo atual; controles das outras camadas sao identificados explicitamente.

<a id="dependencias"></a>
## 2. Configuracao e Dependencias

Dominio C# puro, sem injecao de framework, endpoints, repositorios ou acesso ao banco. Tipos de apoio constam na secao U1. Persistencia e integracao ficam em [Steady.Infrastructure](../../Steady.Infrastructure/DevDocs/README.md) e [Steady.Api](../../Steady.Api/DevDocs/README.md).

**Entrada e saida**: assinaturas, campos, estados e erros de cada operacao sao discriminados abaixo. Os tipos nao sao contratos HTTP; uma excecao de dominio nao equivale por si so a status HTTP.

**Assinaturas do codigo (entrada tipada e tipo de retorno)**:

- `public sealed record StructuredExplanation( IReadOnlyList<string> Divergences, IReadOnlyList<string> PossibleImpacts, AuthorizedAction Action, string? PainObservation)`
- `public sealed record ExplanationValidationResult(bool Accepted, ExplanationRejectionReason Reason)`
- `public static ExplanationValidationResult Success()`
- `public static ExplanationValidationResult Rejected(ExplanationRejectionReason reason)`
- `public sealed record CoherenceEvaluation( CoherenceStatus Status, Guid? NextExecutionId, int? PolicyVersion, DateTime? EvaluatedAt)`
- `public static WorkoutReview Create( Guid id, Guid executionId, WorkoutExecutionKind executionKind, DateOnly executionDate, WorkoutAdherenceStatus status, AuthorizedAction? action, int policyVersion, int? planVersion, Guid? trainingSheetId, string comparisonJson, DateTime createdAt)`
- `public void MarkUnderstood(DateTime understoodAt)`
- `public void MarkContested()`
- `public void UpdateCoherence( CoherenceStatus status, Guid nextExecutionId, int policyVersion, DateTime evaluatedAt)`
- `public ExplanationValidationResult TrySetExplanation( StructuredExplanation explanation, IReadOnlyCollection<double> allowedNumbers)`
- `public void MarkExplanationUnavailable()`
- `private ExplanationValidationResult Reject(ExplanationRejectionReason reason)`
- `public sealed record ExplanationFact( string Field, double? PrescribedMin, double? PrescribedMax, double? Executed, double? Difference, FieldAdherenceStatus Status)`
- `public sealed record ExplanationContext( string Modality, IReadOnlyList<ExplanationFact> Facts, AuthorizedAction Action, bool PainReported)`

<a id="metodos"></a>
## 3. Detalhamento por Metodo

**D. Entidade/Servico de Dominio**: WorkoutReview. D1 identifica operacoes de dominio; U1 identifica tipos de apoio agrupados nesta unidade.

### Fluxo completo da unidade

```mermaid
sequenceDiagram
    participant Chamador
    participant Revisao as WorkoutReview
    participant Provedor as IExplanationProvider
    Chamador->>Revisao: Create(ids, kind, date, status, action, versoes, snapshot, createdAt)
    Revisao->>Revisao: Validar IDs, policyVersion e snapshot nao vazio
    Revisao-->>Chamador: Pending se action existe; Unavailable caso contrario
    Note over Chamador,Provedor: Orquestracao externa ao dominio, conforme ADR-016
    Chamador->>Provedor: ExplainAsync(ExplanationContext, cancellationToken)
    Provedor-->>Chamador: StructuredExplanation ou null/falha
    Chamador->>Revisao: TrySetExplanation(explanation, allowedNumbers)
    alt Acao ausente ou diferente
        Revisao->>Revisao: Reject(ActionMismatch)
    else Termo proibido
        Revisao->>Revisao: Reject(UnsafeClaim)
    else Numero nao permitido
        Revisao->>Revisao: Reject(UnknownNumber)
    else Texto passa nas verificacoes
        Revisao->>Revisao: Explanation=explanation, Status=Available
    end
    Revisao-->>Chamador: ExplanationValidationResult
    Note over Revisao: Reject chama MarkExplanationUnavailable, preserva acao e snapshot
    Chamador->>Revisao: MarkUnderstood(data), MarkContested(), UpdateCoherence(...)
    Revisao-->>Chamador: Campos auxiliares atualizados, comparacao e acao preservadas
```

<a id="metodo-1"></a>
### D1. Create

Recebe id, executionId/kind/date, status, action, policyVersion, planVersion, trainingSheetId, comparisonJson e createdAt. IDs vazios e snapshot em branco geram ArgumentException; policyVersion<=0 gera ArgumentOutOfRangeException. Sem acao: ExplanationStatus.Unavailable; com acao: Pending. Coherence inicia Unknown com campos null; Entendi null e Contested false. Nao valida sintaxe JSON nem combina enum/acao/status.


<a id="metodo-2"></a>
### D1. MarkUnderstood

Registra understoodAt somente se UnderstoodAt ainda null; chamadas posteriores preservam primeira confirmacao.


<a id="metodo-3"></a>
### D1. MarkContested

Define Contested=true, sem alterar snapshot ou acao.


<a id="metodo-4"></a>
### D1. UpdateCoherence

nextExecutionId obrigatorio e policyVersion>0; substitui CoherenceEvaluation(status,id,versao,data). Nao calcula coerencia, data elegivel ou altera recomendacao.


<a id="metodo-5"></a>
### D1. TrySetExplanation

Recebe StructuredExplanation e allowedNumbers. Action null ou acao distinta rejeita ActionMismatch. Concatena Divergences, PossibleImpacts e PainObservation. Busca termos proibidos sem diferenciar maiusculas: lesao (com/sem acento), tendinite, diagnostico (com/sem acento), causou, causa da dor. Rejeita UnsafeClaim. Regex (?<![\p{L}\d])[+-]?\d+(?:[.,]\d+)? extrai numeros; virgula vira ponto e parse usa cultura invariavel. Numero aceito exige abs(allowed-number)<0.000001; senao UnknownNumber. Sucesso guarda explicacao e Available. Nao verifica coerencia semantica de qualquer parafrase nem condiciona PainObservation ao booleano de dor.


<a id="metodo-6"></a>
### D1. MarkExplanationUnavailable

Apaga Explanation e marca Unavailable, preservando acao/comparacao.


<a id="metodo-7"></a>
### D1. Reject

Privado: chama MarkExplanationUnavailable e retorna ExplanationValidationResult.Rejected(reason).


<a id="metodo-8"></a>
### U1. ExplanationValidationResult

Success retorna Accepted=true/None; Rejected retorna Accepted=false/motivo recebido.


<a id="metodo-9"></a>
### U1. IExplanationProvider.ExplainAsync

Porta assincrona em Adherence/IExplanationProvider.cs: recebe ExplanationContext e CancellationToken; retorna Task<StructuredExplanation?>. Nao faz rede no dominio. ExplanationContext guarda Modality, Facts, Action e PainReported; ExplanationFact guarda Field, PrescribedMin/Max, Executed, Difference e Status. Lista positiva nao possui identidade, e-mail, regiao da dor ou texto livre do usuario.


<a id="metodo-10"></a>
### U1. Records e enums

StructuredExplanation: Divergences, PossibleImpacts, Action, PainObservation. CoherenceEvaluation: Status, NextExecutionId, PolicyVersion, EvaluatedAt. WorkoutExecutionKind: Running, Strength, Combined. ExplanationStatus: Pending, Available, Unavailable. CoherenceStatus: Unknown, Coherent, NotCoherent. ExplanationRejectionReason: None, ActionMismatch, UnsafeClaim, UnknownNumber.


<a id="observacoes"></a>
## 4. Observacoes Tecnicas

**Limites reais**: A porta nao escolhe provedor. Timeout, retentativa manual, outbox e autorizacao ficam externos. Create permite revisao aderente; a regra de nao cria-la pertence ao orquestrador da API.

**Erros**: guard clauses interrompem antes de devolver objeto; metodos de transicao podem lancar InvalidOperationException quando descrito acima. Nao ha tratamento de excecoes ou logs internos.

**Desempenho**: factories e comparacoes percorrem apenas os campos/colecoes recebidos; nao fazem rede. Validacao de explicacao percorre texto e numeros permitidos. Nao ha medicao de desempenho publicada nestes testes.

**Documentos associados**: [Regras](../BusinessRulesDocs/Revisao-do-Treino-Aderencia-Rules.md) e [Debitos](../TechnicalDebtsDocs/WorkoutReview-Aderencia-Debts.md).
