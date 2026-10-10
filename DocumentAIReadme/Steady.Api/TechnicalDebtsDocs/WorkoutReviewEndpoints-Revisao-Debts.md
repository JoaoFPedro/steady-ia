# WorkoutReviewEndpoints - Revisao - Débitos Técnicos

Auditoria: 2026-09-27. Este relatório registra evidência do código atual, não compromisso de implementação.

## Índice

- [1. Resumo Executivo](#resumo)
- [2. Problemas por Criticidade](#problemas)
- [3. Plano de Ação](#plano)
- [4. User Stories para Implementação](#stories)

<a id="resumo"></a>
## 1. Resumo Executivo

- **Estado Atual**: Consultar revisão determinística, registrar compreensão/contestação e solicitar nova explicação sem alterar o treino.
- **Principais Problemas**: Retry sem exclusão de tentativas simultâneas.
- **Impacto no Negócio**: a limitação afeta previsibilidade do retorno ou evolução operacional; o comportamento observado está detalhado abaixo. Não foi executado teste de carga nesta auditoria documental.

**Evidência primária**: [WorkoutReviewEndpoints.cs](../../../src/Steady.Api/Endpoints/WorkoutReviewEndpoints.cs); dependências citadas na [documentação técnica](../DevDocs/WorkoutReviewEndpoints-Revisao-DevDocs.md). **Referências de comportamento**: [STORY-014](../../../specs/STORY-014/spec.bdd.md), [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md), [ADR-014](../../../docs/adr/ADR-014-fronteira-deterministica-da-revisao.md), [ADR-015](../../../docs/adr/ADR-015-tolerancias-e-politicas-versionadas.md), [ADR-016](../../../docs/adr/ADR-016-provedor-da-explicacao-da-revisao.md), [ADR-018](../../../docs/adr/ADR-018-outbox-transacional-da-revisao.md), [ADR-019](../../../docs/adr/ADR-019-identidade-historica-do-exercicio.md).

<a id="problemas"></a>
## 2. Problemas por Criticidade

### Críticos

Nenhum débito adicional comprovado nesta categoria durante a auditoria da unidade.

### Importantes

- **Retry sem exclusão de tentativas simultâneas**: POST retry não limita por estado nem trava revisão. Duas chamadas do mesmo dono podem iniciar duas solicitações ao provedor e sobrescrever ExplanationJson/Status.
  - **Ação Recomendada**: Aplicar trava ou estado de tentativa por revisão, definir resposta para tentativa já ativa e testar duas requisições simultâneas sem duplicar chamada externa.
  - **Criticidade**: Importante; classificação desta auditoria, baseada no alcance da falha descrita.

### Menores

Nenhum débito adicional comprovado nesta categoria durante a auditoria da unidade.

```mermaid
graph LR
    Evidencia[Codigo observado] --> Limite[Limitacao identificada]
    Limite --> Correcao[Alteracao proposta]
    Correcao --> Validacao[Teste de comportamento e isolamento]
```

<a id="plano"></a>
## 3. Plano de Ação

1. **Fase 1 - Críticos**: sem item crítico comprovado nesta unidade.
2. **Fase 2 - Importantes**: Aplicar trava ou estado de tentativa por revisão, definir resposta para tentativa já ativa e testar duas requisições simultâneas sem duplicar chamada externa.
3. **Fase 3 - Menores**: revisar contrato e documentação depois da correção prioritária.

Antes de alterar a semântica pública, formalizar os critérios no fluxo SDD da story correspondente; este relatório não aprova nova regra de treino.

<a id="stories"></a>
## 4. User Stories para Implementação

### Story proposta 1: Retry sem exclusão de tentativas simultâneas

**Contexto Atual**: POST retry não limita por estado nem trava revisão. Duas chamadas do mesmo dono podem iniciar duas solicitações ao provedor e sobrescrever ExplanationJson/Status.

**Objetivo**: Aplicar trava ou estado de tentativa por revisão, definir resposta para tentativa já ativa e testar duas requisições simultâneas sem duplicar chamada externa.

**Regras de Negócio**:

- Preservar isolamento por corredor e as restrições de papel/vínculo existentes.
- Não alterar o dado original de uma execução nem produzir número de prescrição ausente.
- Preservar os caminhos de sucesso documentados nesta unidade.

**Especificação Técnica**:

- Aplicar a alteração no endpoint/dependência indicado pela evidência, com contrato explícito.
- Aplicar trava ou estado de tentativa por revisão, definir resposta para tentativa já ativa e testar duas requisições simultâneas sem duplicar chamada externa.
- Manter erro de recurso alheio sem revelar seus dados.

**Critérios de Aceite**:

- [ ] O comportamento identificado deixa de ocorrer sob o cenário de reprodução.
- [ ] O caminho principal mantém os campos e estados descritos na documentação técnica.
- [ ] Recurso de outro corredor ou personal sem vínculo permanece inacessível.

**Roteiro de Teste**:

1. **Reprodução da limitação**: executar a condição descrita em "Contexto Atual".
   - **Entrada**: cenário e métodos explicitados na evidência acima.
   - **Resultado Esperado**: resposta compatível com a correção proposta, sem efeito duplicado nem vazamento.
2. **Regressão de acesso**: repetir com conta sem autorização para o recurso.
   - **Entrada**: identificador conhecido de outro corredor ou sessão inválida.
   - **Resultado Esperado**: 401 no filtro ou resposta de recusa/404 prevista pelo contrato, sem dados do recurso.
3. **Caminho principal**: executar operação válida do dono autorizado.
   - **Entrada**: contrato documentado para a rota correspondente.
   - **Resultado Esperado**: resultado de sucesso existente preservado.

**Navegação**: [Técnica](../DevDocs/WorkoutReviewEndpoints-Revisao-DevDocs.md), [Regras](../BusinessRulesDocs/Revisao-do-Treino-Revisao-Rules.md), [Índice](README.md).
