# OverloadAssessmentEndpoints - Sobrecarga - Débitos Técnicos

Auditoria: 2026-09-27. Este relatório registra evidência do código atual, não compromisso de implementação.

## Índice

- [1. Resumo Executivo](#resumo)
- [2. Problemas por Criticidade](#problemas)
- [3. Plano de Ação](#plano)
- [4. User Stories para Implementação](#stories)

<a id="resumo"></a>
## 1. Resumo Executivo

- **Estado Atual**: Avaliar a combinação de corrida com musculação avulsa pesada de perna, distinguindo histórico insuficiente de ausência de risco.
- **Principais Problemas**: Leitura integral para janelas de sete dias.
- **Impacto no Negócio**: a limitação afeta previsibilidade do retorno ou evolução operacional; o comportamento observado está detalhado abaixo. Não foi executado teste de carga nesta auditoria documental.

**Evidência primária**: [OverloadAssessmentEndpoints.cs](../../../src/Steady.Api/Endpoints/OverloadAssessmentEndpoints.cs); dependências citadas na [documentação técnica](../DevDocs/OverloadAssessmentEndpoints-Sobrecarga-DevDocs.md). **Referências de comportamento**: [STORY-001](../../../specs/STORY-001/spec.bdd.md), [STORY-002](../../../specs/STORY-002/spec.bdd.md), [STORY-003](../../../specs/STORY-003/spec.bdd.md), [ADR-001](../../../docs/adr/ADR-001-regra-sobrecarga-combinada.md), [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md), [ADR-004](../../../docs/adr/ADR-004-estado-de-historico-insuficiente-no-contrato-de-avaliacao.md).

<a id="problemas"></a>
## 2. Problemas por Criticidade

### Críticos

Nenhum débito adicional comprovado nesta categoria durante a auditoria da unidade.

### Importantes

- **Leitura integral para janelas de sete dias**: GetByCorredorIdAsync materializa todo o histórico para Evaluate. O custo aumenta com os anos de uso embora a comparação dependa de duas janelas e da data inicial.
  - **Ação Recomendada**: Adicionar consultas de janela e da primeira data, preservando exatamente o cálculo de histórico suficiente e os limites inclusivos do ADR-001.
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
2. **Fase 2 - Importantes**: Adicionar consultas de janela e da primeira data, preservando exatamente o cálculo de histórico suficiente e os limites inclusivos do ADR-001.
3. **Fase 3 - Menores**: revisar contrato e documentação depois da correção prioritária.

Antes de alterar a semântica pública, formalizar os critérios no fluxo SDD da story correspondente; este relatório não aprova nova regra de treino.

<a id="stories"></a>
## 4. User Stories para Implementação

### Story proposta 1: Leitura integral para janelas de sete dias

**Contexto Atual**: GetByCorredorIdAsync materializa todo o histórico para Evaluate. O custo aumenta com os anos de uso embora a comparação dependa de duas janelas e da data inicial.

**Objetivo**: Adicionar consultas de janela e da primeira data, preservando exatamente o cálculo de histórico suficiente e os limites inclusivos do ADR-001.

**Regras de Negócio**:

- Preservar isolamento por corredor e as restrições de papel/vínculo existentes.
- Não alterar o dado original de uma execução nem produzir número de prescrição ausente.
- Preservar os caminhos de sucesso documentados nesta unidade.

**Especificação Técnica**:

- Aplicar a alteração no endpoint/dependência indicado pela evidência, com contrato explícito.
- Adicionar consultas de janela e da primeira data, preservando exatamente o cálculo de histórico suficiente e os limites inclusivos do ADR-001.
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

**Navegação**: [Técnica](../DevDocs/OverloadAssessmentEndpoints-Sobrecarga-DevDocs.md), [Regras](../BusinessRulesDocs/Avaliacao-de-Sobrecarga-Sobrecarga-Rules.md), [Índice](README.md).
