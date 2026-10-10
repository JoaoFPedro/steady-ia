# Avaliacao de Sobrecarga - Sobrecarga - Regras de Negócio

## Índice

- [1. Resumo da Funcionalidade](#resumo)
- [2. Jornada do Usuário](#jornada)
- [3. Regras de Negócio por Funcionalidade](#regras)
- [4. Validações e Restrições](#validacoes)
- [5. Fluxos de Processo](#fluxos)
- [6. Casos de Uso e Cenários](#casos)

<a id="resumo"></a>
## 1. Resumo da Funcionalidade

**Propósito**: Avaliar a combinação de corrida com musculação avulsa pesada de perna, distinguindo histórico insuficiente de ausência de risco.

**Usuários**: corredor autenticado; personal autenticado nas ações de acompanhamento que exigem esse papel.

**Valor de Negócio**: manter registros e decisões acessíveis somente a quem tem autorização, com resultado consistente entre consultas e sincronização.

**Frequência de Uso**: conforme registros e consultas do usuário, sem frequência obrigatória imposta por estas rotas.

**Impacto Operacional**: o servidor mantém o estado persistido; a disponibilidade de rede e da persistência determina quando o resultado pode ser confirmado.

**Fontes da verdade**: [STORY-001](../../../specs/STORY-001/spec.bdd.md), [STORY-002](../../../specs/STORY-002/spec.bdd.md), [STORY-003](../../../specs/STORY-003/spec.bdd.md), [ADR-001](../../../docs/adr/ADR-001-regra-sobrecarga-combinada.md), [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md), [ADR-004](../../../docs/adr/ADR-004-estado-de-historico-insuficiente-no-contrato-de-avaliacao.md). As regras abaixo distinguem comportamento observável atual e limitações identificadas no código; não criam decisão nova de produto.

<a id="jornada"></a>
## 2. Jornada do Usuário

### Visão Geral da Jornada

```mermaid
journey
    title Jornada da funcionalidade
    section Preparacao
      Entrar na conta: 5: Usuario
      Escolher operacao: 4: Usuario
    section Operacao
      Informar dados ou consultar: 4: Usuario
      Validar acesso e dados: 4: Sistema
    section Resultado
      Ver confirmacao ou ausencia: 5: Usuario
```

### Pontos de Contato

- **Conta**: a identidade vem do login Google; nome e e-mail não determinam quem é dono dos registros.
- **Operação**: o usuário acessa as ações descritas abaixo no aplicativo; este documento descreve o serviço que as sustenta.
- **Retorno**: confirmação, dados ou erro explícito; indisponibilidade técnica não representa histórico vazio.

<a id="regras"></a>
## 3. Regras de Negócio por Funcionalidade

### 3.1. Avaliar sobrecarga

**O que faz**: Avaliar sobrecarga para o usuário autorizado.

**Regras Aplicadas**:

- **Acesso**: usa a conta autenticada e as restrições específicas da operação. Dados próprios não podem ser solicitados com um dono escolhido no corpo.
- **Execução atual**: Busca corridas e sessões avulsas do corredor; reconstitui factories de domínio; calcula hoje em UTC; Evaluate usa janelas fechadas de sete dias; projeta hasRisk, suggestion e hasSufficientHistory.
- **Resposta observável**: 200 inclusive sem histórico; 401 token inválido.

**Cenários de Uso**:

- **Principal**: pessoa autorizada consulta dados existentes e recebe a visão correspondente.
- **Alternativo**: ausência segue a resposta da rota: lista vazia ou recurso não encontrado.
- **Exceção**: token inválido impede a operação; papel/vínculo/dono são conferidos quando exigidos.

**Resultado Esperado**: OverloadAssessmentResponse.

<a id="validacoes"></a>
## 4. Validações e Restrições

### Controle de Acesso

- Todas as ações requerem sessão válida. Papel Personal é necessário somente nas rotas explicitamente descritas acima.
- O acesso do personal a histórico/revisão depende de vínculo ativo; encerrá-lo remove esse acesso nas consultas protegidas.

### Dados e Entrada

OverloadDetectionService.Evaluate exige amplitude de histórico >=14 dias (data mais antiga até hoje, inclusive), não 14 registros diários. Janela recente hoje-6 até hoje; anterior hoje-13 até hoje-7. Risco exige PernaFrontal/PernaPosterior com Pesado na recente, carga anterior de corrida positiva e carga recente >=1.10 * anterior. Carga de corrida = duração * esforço. Sem histórico suficiente retorna InsufficientHistory; sem risco retorna suggestion null.

- Tipos e campos completos estão na [especificação técnica](../DevDocs/OverloadAssessmentEndpoints-Sobrecarga-DevDocs.md).
- Registro que exige chave de sincronização sem essa chave é recusado. Reenvio não significa edição do dado original.

### Restrições do Sistema

O endpoint não consulta PainLogs nem StrengthWorkoutExecutions. A sugestão orienta sem bloquear registros. Factories de reconstituição são chamadas diretamente, sem DomainFactory.TryCreate; dados persistidos inválidos podem lançar exceção.

Não há janela de horário de funcionamento codificada nestes endpoints. O serviço depende de token válido, configuração do provedor de login e persistência.

<a id="fluxos"></a>
## 5. Fluxos de Processo

### Fluxo Principal

```mermaid
flowchart TD
    A[Usuario escolhe operacao] --> B{Sessao valida?}
    B -->|Nao| C[Recusar acesso]
    B -->|Sim| D{Autorizado para a operacao?}
    D -->|Nao| E[Recusar ou ocultar recurso]
    D -->|Sim| F[Validar dados e executar operacao]
    F --> G[Mostrar resultado conforme a rota]
```

### Integrações com Outros Processos

```mermaid
graph LR
    Conta[Conta autenticada] --> Funcionalidade[Operacao solicitada]
    Funcionalidade --> Persistencia[Dados do corredor]
    Persistencia --> Consulta[Consulta posterior autorizada]
```

<a id="casos"></a>
## 6. Casos de Uso e Cenários

### Caso de Uso 1: Avaliar sobrecarga

**Ator Principal**: usuário autorizado para esta ação.

**Objetivo**: Avaliar sobrecarga.

**Pré-condições**: sessão válida; papel, vínculo e recurso quando exigidos pela regra acima.

**Fluxo Principal**:

1. Usuário escolhe a ação e informa Sem corpo; sem parâmetros.
2. Sistema executa as validações de acesso e dados descritas para esta ação.
3. Sistema devolve OverloadAssessmentResponse.

**Pós-condições**: 200 inclusive sem histórico; 401 token inválido. Uma resposta de erro não deve ser exibida pelo app como confirmação.

### Matriz de Cenários

| Cenário | Entrada | Ação do Sistema | Resultado Esperado |
|---|---|---|---|
| Avaliar sobrecarga | Sem corpo; sem parâmetros | Validar acesso e executar regras acima | 200 inclusive sem histórico; 401 token inválido |
| Sessão inválida | Token ausente/expirado | Recusar antes da lógica do handler | 401 |

**Navegação**: [Técnica](../DevDocs/OverloadAssessmentEndpoints-Sobrecarga-DevDocs.md), [Débitos](../TechnicalDebtsDocs/OverloadAssessmentEndpoints-Sobrecarga-Debts.md), [Índice](README.md).
