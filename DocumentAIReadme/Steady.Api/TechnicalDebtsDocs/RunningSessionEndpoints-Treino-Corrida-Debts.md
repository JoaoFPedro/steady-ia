# RunningSessionEndpoints - Treino-Corrida - Débitos Técnicos

Auditoria: 2026-09-27. Este relatório registra evidência do código atual, não compromisso de implementação.

## Índice

- [1. Resumo Executivo](#resumo)
- [2. Problemas por Criticidade](#problemas)
- [3. Plano de Ação](#plano)
- [4. User Stories para Implementação](#stories)

<a id="resumo"></a>
## 1. Resumo Executivo

- **Estado Atual**: Registrar a corrida do corredor e sua intenção durável de revisão, sem esperar o provedor de explicação.
- **Principais Problemas**: Replay concorrente não tem recuperação explícita.
- **Impacto no Negócio**: a limitação afeta previsibilidade do retorno ou evolução operacional; o comportamento observado está detalhado abaixo. Não foi executado teste de carga nesta auditoria documental.

**Evidência primária**: [RunningSessionEndpoints.cs](../../../src/Steady.Api/Endpoints/RunningSessionEndpoints.cs); dependências citadas na [documentação técnica](../DevDocs/RunningSessionEndpoints-Treino-Corrida-DevDocs.md). **Referências de comportamento**: [STORY-001](../../../specs/STORY-001/spec.bdd.md), [STORY-002](../../../specs/STORY-002/spec.bdd.md), [STORY-014](../../../specs/STORY-014/spec.bdd.md), [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md), [ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md), [ADR-018](../../../docs/adr/ADR-018-outbox-transacional-da-revisao.md).

<a id="problemas"></a>
## 2. Problemas por Criticidade

### Críticos

Nenhum débito adicional comprovado nesta categoria durante a auditoria da unidade.

### Importantes

- **Replay concorrente não tem recuperação explícita**: AddAsync faz leitura seguida de SaveChangesAsync sem capturar DbUpdateException; o índice único protege dados, mas dois reenvios simultâneos podem terminar com erro de persistência na chamada perdedora.
  - **Ação Recomendada**: Recuperar a entidade vencedora somente em violação do índice de idempotência e testar duas requisições simultâneas.
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
2. **Fase 2 - Importantes**: Recuperar a entidade vencedora somente em violação do índice de idempotência e testar duas requisições simultâneas.
3. **Fase 3 - Menores**: revisar contrato e documentação depois da correção prioritária.

Antes de alterar a semântica pública, formalizar os critérios no fluxo SDD da story correspondente; este relatório não aprova nova regra de treino.

<a id="stories"></a>
## 4. User Stories para Implementação

### Story proposta 1: Replay concorrente não tem recuperação explícita

**Contexto Atual**: AddAsync faz leitura seguida de SaveChangesAsync sem capturar DbUpdateException; o índice único protege dados, mas dois reenvios simultâneos podem terminar com erro de persistência na chamada perdedora.

**Objetivo**: Recuperar a entidade vencedora somente em violação do índice de idempotência e testar duas requisições simultâneas.

**Regras de Negócio**:

- Preservar isolamento por corredor e as restrições de papel/vínculo existentes.
- Não alterar o dado original de uma execução nem produzir número de prescrição ausente.
- Preservar os caminhos de sucesso documentados nesta unidade.

**Especificação Técnica**:

- Aplicar a alteração no endpoint/dependência indicado pela evidência, com contrato explícito.
- Recuperar a entidade vencedora somente em violação do índice de idempotência e testar duas requisições simultâneas.
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

**Navegação**: [Técnica](../DevDocs/RunningSessionEndpoints-Treino-Corrida-DevDocs.md), [Regras](../BusinessRulesDocs/Registro-de-Corrida-Treino-Corrida-Rules.md), [Índice](README.md).
