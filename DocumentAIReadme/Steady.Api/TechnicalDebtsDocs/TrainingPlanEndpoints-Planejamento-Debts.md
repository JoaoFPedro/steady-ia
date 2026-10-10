# TrainingPlanEndpoints - Planejamento - Débitos Técnicos

Auditoria: 2026-09-27. Este relatório registra evidência do código atual, não compromisso de implementação.

## Índice

- [1. Resumo Executivo](#resumo)
- [2. Problemas por Criticidade](#problemas)
- [3. Plano de Ação](#plano)
- [4. User Stories para Implementação](#stories)

<a id="resumo"></a>
## 1. Resumo Executivo

- **Estado Atual**: Ler o documento versionado associado ao corredor, mantendo prescrições e mobilidade sem calcular progressão.
- **Principais Problemas**: 404 reúne falhas de integridade distintas.
- **Impacto no Negócio**: a limitação afeta previsibilidade do retorno ou evolução operacional; o comportamento observado está detalhado abaixo. Não foi executado teste de carga nesta auditoria documental.

**Evidência primária**: [TrainingPlanEndpoints.cs](../../../src/Steady.Api/Endpoints/TrainingPlanEndpoints.cs); dependências citadas na [documentação técnica](../DevDocs/TrainingPlanEndpoints-Planejamento-DevDocs.md). **Referências de comportamento**: [STORY-016](../../../specs/STORY-016/spec.bdd.md), [STORY-020](../../../specs/STORY-020/spec.bdd.md), [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md), [ADR-006](../../../docs/adr/ADR-006-interpolacao-do-longao-semanal.md), [ADR-013](../../../docs/adr/ADR-013-plano-do-steady-como-fonte-de-prescricao.md).

<a id="problemas"></a>
## 2. Problemas por Criticidade

### Críticos

Nenhum débito adicional comprovado nesta categoria durante a auditoria da unidade.

### Importantes

Nenhum débito adicional comprovado nesta categoria durante a auditoria da unidade.

### Menores

- **404 reúne falhas de integridade distintas**: GetForRunnerAsync retorna null tanto sem corredor quanto sem versão associada; handler converte ambos no mesmo 404 sem distinguir internamente configuração inconsistente.
  - **Ação Recomendada**: Preservar a resposta pública sem vazamento e acrescentar diagnóstico interno para associação de versão ausente, sem registrar dados pessoais.
  - **Criticidade**: Menor; classificação desta auditoria, baseada no alcance da falha descrita.

```mermaid
graph LR
    Evidencia[Codigo observado] --> Limite[Limitacao identificada]
    Limite --> Correcao[Alteracao proposta]
    Correcao --> Validacao[Teste de comportamento e isolamento]
```

<a id="plano"></a>
## 3. Plano de Ação

1. **Fase 1 - Críticos**: sem item crítico comprovado nesta unidade.
2. **Fase 2 - Importantes**: sem item importante comprovado nesta unidade.
3. **Fase 3 - Menores**: Preservar a resposta pública sem vazamento e acrescentar diagnóstico interno para associação de versão ausente, sem registrar dados pessoais.

Antes de alterar a semântica pública, formalizar os critérios no fluxo SDD da story correspondente; este relatório não aprova nova regra de treino.

<a id="stories"></a>
## 4. User Stories para Implementação

### Story proposta 1: 404 reúne falhas de integridade distintas

**Contexto Atual**: GetForRunnerAsync retorna null tanto sem corredor quanto sem versão associada; handler converte ambos no mesmo 404 sem distinguir internamente configuração inconsistente.

**Objetivo**: Preservar a resposta pública sem vazamento e acrescentar diagnóstico interno para associação de versão ausente, sem registrar dados pessoais.

**Regras de Negócio**:

- Preservar isolamento por corredor e as restrições de papel/vínculo existentes.
- Não alterar o dado original de uma execução nem produzir número de prescrição ausente.
- Preservar os caminhos de sucesso documentados nesta unidade.

**Especificação Técnica**:

- Aplicar a alteração no endpoint/dependência indicado pela evidência, com contrato explícito.
- Preservar a resposta pública sem vazamento e acrescentar diagnóstico interno para associação de versão ausente, sem registrar dados pessoais.
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

**Navegação**: [Técnica](../DevDocs/TrainingPlanEndpoints-Planejamento-DevDocs.md), [Regras](../BusinessRulesDocs/Plano-do-Steady-Planejamento-Rules.md), [Índice](README.md).
