# TrainingHistoryEndpoints - Historico - Débitos Técnicos

Auditoria: 2026-09-27. Este relatório registra evidência do código atual, não compromisso de implementação.

## Índice

- [1. Resumo Executivo](#resumo)
- [2. Problemas por Criticidade](#problemas)
- [3. Plano de Ação](#plano)
- [4. User Stories para Implementação](#stories)

<a id="resumo"></a>
## 1. Resumo Executivo

- **Estado Atual**: Unificar corridas, musculação avulsa e execuções da ficha no histórico do corredor.
- **Principais Problemas**: Lista e detalhe cobrem origens diferentes.
- **Impacto no Negócio**: a limitação afeta previsibilidade do retorno ou evolução operacional; o comportamento observado está detalhado abaixo. Não foi executado teste de carga nesta auditoria documental.

**Evidência primária**: [TrainingHistoryEndpoints.cs](../../../src/Steady.Api/Endpoints/TrainingHistoryEndpoints.cs); dependências citadas na [documentação técnica](../DevDocs/TrainingHistoryEndpoints-Historico-DevDocs.md). **Referências de comportamento**: [STORY-001](../../../specs/STORY-001/spec.bdd.md), [STORY-002](../../../specs/STORY-002/spec.bdd.md), [STORY-013](../../../specs/STORY-013/spec.bdd.md), [STORY-018](../../../specs/STORY-018/spec.bdd.md), [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md), [ADR-009](../../../docs/adr/ADR-009-ficha-ativa-e-execucao-imutavel.md).

<a id="problemas"></a>
## 2. Problemas por Criticidade

### Críticos

Nenhum débito adicional comprovado nesta categoria durante a auditoria da unidade.

### Importantes

- **Lista e detalhe cobrem origens diferentes**: GET da coleção inclui StrengthWorkoutExecution, mas GET por id consulta somente corrida e força avulsa; o id de uma linha da ficha devolve 404.
  - **Ação Recomendada**: Definir detalhe para execução de ficha ou indicar navegação específica no contrato; testar os três tipos de linha e isolamento.
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
2. **Fase 2 - Importantes**: Definir detalhe para execução de ficha ou indicar navegação específica no contrato; testar os três tipos de linha e isolamento.
3. **Fase 3 - Menores**: revisar contrato e documentação depois da correção prioritária.

Antes de alterar a semântica pública, formalizar os critérios no fluxo SDD da story correspondente; este relatório não aprova nova regra de treino.

<a id="stories"></a>
## 4. User Stories para Implementação

### Story proposta 1: Lista e detalhe cobrem origens diferentes

**Contexto Atual**: GET da coleção inclui StrengthWorkoutExecution, mas GET por id consulta somente corrida e força avulsa; o id de uma linha da ficha devolve 404.

**Objetivo**: Definir detalhe para execução de ficha ou indicar navegação específica no contrato; testar os três tipos de linha e isolamento.

**Regras de Negócio**:

- Preservar isolamento por corredor e as restrições de papel/vínculo existentes.
- Não alterar o dado original de uma execução nem produzir número de prescrição ausente.
- Preservar os caminhos de sucesso documentados nesta unidade.

**Especificação Técnica**:

- Aplicar a alteração no endpoint/dependência indicado pela evidência, com contrato explícito.
- Definir detalhe para execução de ficha ou indicar navegação específica no contrato; testar os três tipos de linha e isolamento.
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

**Navegação**: [Técnica](../DevDocs/TrainingHistoryEndpoints-Historico-DevDocs.md), [Regras](../BusinessRulesDocs/Historico-de-Treinos-Historico-Rules.md), [Índice](README.md).
