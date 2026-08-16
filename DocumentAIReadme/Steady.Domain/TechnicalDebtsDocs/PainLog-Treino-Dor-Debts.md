# PainLog - Treino-Dor - Débitos Técnicos

## Índice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: entidade mínima, com uma única guard clause (região obrigatória), coberta por 1 teste (`tests/Steady.Domain.Tests/PainLogTests.cs`). O código em si é correto e simples.
- **Principais Problemas**: divergência entre o texto da spec BDD e o modelo de domínio implementado (indicador "doeu" ausente); ausência de vocabulário controlado para a região do corpo, inconsistente com o padrão usado em `StrengthSession.MuscleGroup`.
- **Impacto no Negócio**: médio no ponto 1 (gap de spec x implementação, que compromete a rastreabilidade da regra de negócio) e médio-baixo no ponto 2 (qualidade de dado para análise futura, quando/se a calibração da regra de sobrecarga usar esses registros).

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum problema crítico identificado. **Importante**: o ponto abaixo (indicador "doeu" ausente) foi classificado como Importante, não Crítico, porque não há nenhum consumidor atual do campo ausente — o gap é de rastreabilidade spec-código, não de funcionalidade quebrada em produção.

### 🟡 Importantes

- **Indicador "doeu" mencionado na spec, ausente no modelo de domínio**: `specs/STORY-001/spec.bdd.md` (regra de negócio #7 e cenário "Corredor registra dor pós-treino dias depois") descreve o registro de dor como "data + região do corpo + doeu/não doeu", e o `Then` do cenário Gherkin afirma textualmente: *"o registro de dor é salvo com a data, a região e o indicador 'doeu'"*. O tipo `PainLog` implementado tem apenas `Date` e `Region` — não existe nenhuma propriedade booleana ou enum representando esse indicador em nenhuma camada (`Steady.Domain`, `Steady.Api.Contracts.PainLogContracts`, `Steady.Infrastructure.Persistence.PainLogEntity`). Na prática, o sistema atual usa a **existência do registro** como proxy implícito de "doeu = true" — não há como registrar "não doeu" hoje.
  - **Ação Recomendada**: esclarecer com produto se (a) o indicador é implícito por design (todo `PainLog` representa uma ocorrência de dor, e "não doeu" simplesmente não gera registro) e a spec deveria ser ajustada para refletir isso, ou (b) o campo foi de fato esquecido na implementação e precisa ser adicionado. Esta é exatamente o tipo de divergência que o comando `/sync` do SDD Kit existe para resolver — recomenda-se rodar `/sync` para reconciliar spec e código antes de tratar como bug.

### 🟢 Menores

- **`Region` é texto livre, sem vocabulário controlado**: diferente de `StrengthSession.MuscleGroup` (um `enum` fechado com 5 valores), `PainLog.Region` aceita qualquer string não vazia. Isso permite inconsistências de dado (ex: "Canela", "canela", "perna direita - canela", "Perna") que dificultam agregações futuras (ex: "quais regiões doem mais quando há sobrecarga de perna?" — o tipo de análise que o ADR-001 sugere como forma de calibrar a regra).
  - **Ação Recomendada**: não é urgente para o MVP (a spec não define um vocabulário fechado de regiões), mas vale registrar como candidato a evolução se/quando a calibração da regra de sobrecarga (mencionada nos Riscos do ADR-001) virar trabalho ativo. Se avançar, considerar um `enum BodyRegion` seguindo o mesmo padrão de `MuscleGroup`.
- **Sem validação de data futura**: mesma lacuna observada em `RunningSession` e `StrengthSession` — `Create` não rejeita `date` no futuro. Aqui o impacto é ainda mais ambíguo, já que a regra de negócio explicitamente permite registrar dor com atraso (dias depois do treino) — a pergunta é apenas se "no futuro" (data ainda não vivida) faz sentido.
  - **Ação Recomendada**: baixa prioridade; revisitar apenas se a decisão de produto sobre datas futuras nas outras entidades (ver `RunningSession-Treino-Corrida-Debts.md`) motivar uma regra unificada de "nenhuma entidade de treino aceita data futura".

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhuma ação necessária.
2. **Fase 2 - Importantes**: rodar `/sync` (ou sessão equivalente com produto) para decidir o destino do indicador "doeu" — ajustar a spec para refletir o comportamento implícito atual, ou adicionar o campo explícito ao domínio, contratos de API e entidade de persistência.
3. **Fase 3 - Menores**: avaliar `enum BodyRegion` como evolução futura, condicionado a uso real de análise de dados de dor; alinhar política de data futura com as demais entidades de treino.

## 4. User Stories para Implementação

### Story 1: Reconciliar o indicador "doeu" entre spec e domínio

**Contexto Atual**: a spec BDD descreve um indicador explícito "doeu/não doeu" que não existe no modelo `PainLog`. O comportamento real do sistema é: todo registro criado representa implicitamente uma ocorrência de dor (não há caminho para registrar "não doeu").

**Objetivo**: eliminar a divergência entre spec e código, garantindo que a documentação de negócio reflita o comportamento real (ou que o código seja ajustado para expor o campo que a spec descreve).

**Regras de Negócio**:
- A decidir com produto: opção A — a existência do registro já é o indicador (ajustar `spec.bdd.md` para remover a menção a um campo `doeu` separado); opção B — adicionar campo explícito `HasPain`/`Doeu` (booleano) a `PainLog`, permitindo futuramente registrar "não doeu" como controle negativo.

**Especificação Técnica**:
- Se opção A: editar `specs/STORY-001/spec.bdd.md`, ajustando o `Then` do cenário "Corredor registra dor pós-treino dias depois" para remover a menção ao indicador separado, documentando a decisão via `/sync`.
- Se opção B: adicionar `bool HasPain` (ou nome equivalente) a `PainLog.Create`, propagar para `PainLogEntity` (`Steady.Infrastructure`) e para `PainLogRequest`/`PainLogResponse` (`Steady.Api.Contracts`) — mudança que atravessa as três camadas do sistema, não apenas `Steady.Domain`.

**Critérios de Aceite**:
- [ ] Divergência entre `spec.bdd.md` e `PainLog.cs` documentada e resolvida (uma das duas muda).
- [ ] Se opção B: testes cobrindo os dois estados do indicador (`doeu = true` e `doeu = false`).
- [ ] `specs/STORY-001/spec.bdd.md` atualizado e sincronizado com o código, conforme fluxo `/sync` do projeto.

**Roteiro de Teste**:
1. **Teste 1** (se opção B): registrar dor com `doeu = true`.
   - **Entrada**: data, região, `doeu = true`.
   - **Resultado Esperado**: `PainLog` criado com o indicador refletido.
2. **Teste 2** (se opção B): registrar dor com `doeu = false`.
   - **Entrada**: data, região, `doeu = false`.
   - **Resultado Esperado**: `PainLog` criado normalmente, sem violar nenhuma regra existente (região continua obrigatória).

### Story 2: Avaliar vocabulário controlado para região do corpo

**Contexto Atual**: `PainLog.Region` é texto livre, permitindo variações de grafia para a mesma região anatômica.

**Objetivo**: melhorar a qualidade do dado para suportar análises futuras (ex: correlação entre região de dor e padrão de sobrecarga), seguindo o mesmo padrão já usado em `MuscleGroup`.

**Regras de Negócio**:
- A definir com produto: lista fechada de regiões do corpo relevantes para o contexto de corrida + musculação de perna (ex: Canela, Joelho, Coxa, Panturrilha, Tornozelo, Quadril, Lombar).

**Especificação Técnica**:
- Se aprovado, criar `enum BodyRegion` em `Steady.Domain.Training`, seguindo o padrão de `MuscleGroup.cs`.
- Alterar `PainLog.Create` para receber `BodyRegion` em vez de `string region`, atualizando guard clause de "obrigatório" (deixa de ser `IsNullOrWhiteSpace`, passa a ser checagem de enum válido, como em `StrengthSession`).
- Migração de dado: registros já persistidos com texto livre precisam de estratégia de migração (fora do escopo de `Steady.Domain` — envolve `Steady.Infrastructure`).

**Critérios de Aceite**:
- [ ] Lista de regiões aprovada por produto.
- [ ] `PainLog.Create` passa a validar contra o `enum`, rejeitando valores fora da lista.
- [ ] Estratégia de migração de dados legados documentada antes da implementação.

**Roteiro de Teste**:
1. **Teste 1**: registrar dor com uma região válida do novo `enum`.
   - **Entrada**: `region = BodyRegion.Canela` (exemplo).
   - **Resultado Esperado**: `PainLog` criado normalmente.
2. **Teste 2**: registrar dor com região fora da lista (se a API ainda aceitar string bruta na borda).
   - **Entrada**: `region` = valor não mapeável ao enum.
   - **Resultado Esperado**: rejeição com mensagem clara sobre região inválida.
