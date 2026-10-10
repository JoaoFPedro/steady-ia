# StrengthSessionEndpoints - Treino-Forca - Débitos Técnicos

Auditoria: 2026-09-27. Este relatório registra evidência do código atual, não compromisso de implementação.

## Índice

- [1. Resumo Executivo](#resumo)
- [2. Problemas por Criticidade](#problemas)
- [3. Plano de Ação](#plano)
- [4. User Stories para Implementação](#stories)

<a id="resumo"></a>
## 1. Resumo Executivo

- **Estado Atual**: Registrar musculação avulsa com grupo, intensidade e duração, e opcionalmente dor no encerramento.
- **Principais Problemas**: Enums sem validação de pertencimento.
- **Impacto no Negócio**: a limitação afeta previsibilidade do retorno ou evolução operacional; o comportamento observado está detalhado abaixo. Não foi executado teste de carga nesta auditoria documental.

**Evidência primária**: [StrengthSessionEndpoints.cs](../../../src/Steady.Api/Endpoints/StrengthSessionEndpoints.cs); dependências citadas na [documentação técnica](../DevDocs/StrengthSessionEndpoints-Treino-Forca-DevDocs.md). **Referências de comportamento**: [STORY-001](../../../specs/STORY-001/spec.bdd.md), [STORY-002](../../../specs/STORY-002/spec.bdd.md), [STORY-014](../../../specs/STORY-014/spec.bdd.md), [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md), [ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md).

<a id="problemas"></a>
## 2. Problemas por Criticidade

### Críticos

Nenhum débito adicional comprovado nesta categoria durante a auditoria da unidade.

### Importantes

- **Enums sem validação de pertencimento**: StrengthSession.Create rejeita null, mas não valores numéricos desconhecidos. O endpoint aceita enums no contrato sem testar Enum.IsDefined.
  - **Ação Recomendada**: Validar valores definidos na factory e documentar 400 para valores fora dos enums; verificar persistência e consumo da avaliação.
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
2. **Fase 2 - Importantes**: Validar valores definidos na factory e documentar 400 para valores fora dos enums; verificar persistência e consumo da avaliação.
3. **Fase 3 - Menores**: revisar contrato e documentação depois da correção prioritária.

Antes de alterar a semântica pública, formalizar os critérios no fluxo SDD da story correspondente; este relatório não aprova nova regra de treino.

<a id="stories"></a>
## 4. User Stories para Implementação

### Story proposta 1: Enums sem validação de pertencimento

**Contexto Atual**: StrengthSession.Create rejeita null, mas não valores numéricos desconhecidos. O endpoint aceita enums no contrato sem testar Enum.IsDefined.

**Objetivo**: Validar valores definidos na factory e documentar 400 para valores fora dos enums; verificar persistência e consumo da avaliação.

**Regras de Negócio**:

- Preservar isolamento por corredor e as restrições de papel/vínculo existentes.
- Não alterar o dado original de uma execução nem produzir número de prescrição ausente.
- Preservar os caminhos de sucesso documentados nesta unidade.

**Especificação Técnica**:

- Aplicar a alteração no endpoint/dependência indicado pela evidência, com contrato explícito.
- Validar valores definidos na factory e documentar 400 para valores fora dos enums; verificar persistência e consumo da avaliação.
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

**Navegação**: [Técnica](../DevDocs/StrengthSessionEndpoints-Treino-Forca-DevDocs.md), [Regras](../BusinessRulesDocs/Registro-de-Musculacao-Treino-Forca-Rules.md), [Índice](README.md).
