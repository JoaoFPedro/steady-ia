# Spec BDD: STORY-016 — Plano do Steady como prescrição no servidor

> **Story**: [story.md](./story.md)
> **Discovery**: [../../.discovery/DISC-007-plano-que-o-app-nao-guarda/](../../.discovery/DISC-007-plano-que-o-app-nao-guarda/)
> **ADR**: ADR-013
> **Status**: Implemented
> **Data**: 2026-08-28

---

## Feature: O plano que o corredor lê passa a viver no servidor

O documento estático do aplicativo é transcrito para o servidor como plano
versionado e imutável, associado a cada corredor. O aplicativo passa a lê-lo
pela API, com cache offline. Nenhum número novo nasce nessa mudança.

### Decisões de produto

1. Persistir não é gerar. O conteúdo é transcrição literal do documento atual.
2. O plano é versionado e imutável. Uma versão nova nunca reescreve a anterior
   nem a que já está associada a um corredor.
3. Cada corredor aponta para uma versão. Hoje todos apontam para a mesma; a
   estrutura é o que a geração futura vai precisar.
4. Nos dias de corrida, o plano usa a mesma `RunPrescription` opcional da ficha
   (STORY-015), para que as duas fontes sejam comparáveis pelo mesmo código.
5. O seed preenche número só onde o texto-fonte declara um valor **no nível do
   dia**. O documento só dá números por fase (`longRunProgression`), nunca por
   dia da semana — promover uma faixa de fase para um dia fixo do `weekPlan`
   exigiria escolher a fase, e isso é cálculo de progressão. Por isso os três
   dias de corrida do `weekPlan` (terça, quinta, sábado) nascem só com
   descrição; `longRunProgression` continua existindo, por fase, como campo à
   parte do plano.
6. Nenhuma interpolação semanal. A ADR-006 registra a tentativa anterior e por
   que ela estava errada.
7. O aplicativo troca a constante local pela leitura da API, mantendo o
   comportamento offline que o corredor já tem.
8. Falha de leitura mostra o estado de falha, nunca um plano vazio (ADR-004).

### Vocabulário observável

| Termo | Significado |
|-------|-------------|
| `Versão de plano` | Documento imutável identificado por número crescente |
| `Plano do corredor` | A versão à qual aquele corredor está associado |
| `Seed` | Transcrição do documento estático que cria a versão 1 |
| `Ausente` | Campo numérico que o texto-fonte não sustenta |

---

## Cenários — Happy Path

```gherkin
Scenario: Corredor lê o plano vindo do servidor
  Given que existe uma versão de plano vigente
  And o corredor está associado a ela
  When abre a aba Planejamento
  Then vê o mesmo documento que via antes desta story
  And o conteúdo veio da API, não da constante do aplicativo
```

```gherkin
Scenario: Seed reproduz o documento estático campo a campo
  Given que a migration criou a versão 1 do plano
  When o conteúdo persistido é comparado com TRAINING_PLAN_DOCUMENT
  Then título, fases, visão semanal, plano da semana, taper, longão, mobilidade e regras coincidem campo a campo
  And nenhuma diferença de texto é aceita como equivalente
```

```gherkin
Scenario: Dia de corrida do plano nasce sem número, porque a fonte só declara por fase
  Given que o texto-fonte declara a faixa de distância do longão por fase, não por dia
  When o seed é gerado
  Then terça, quinta e sábado do weekPlan recebem RunPrescription só com descrição
  And nenhum campo numérico é promovido de longRunProgression para um dia específico
  And longRunProgression continua preservado, por fase, como campo à parte do plano
```

```gherkin
Scenario: Corredor novo recebe a versão vigente
  Given que existe uma versão de plano vigente
  When um corredor é provisionado no primeiro acesso
  Then passa a apontar para essa versão
  And consegue ler seu plano imediatamente
```

---

## Cenários — Edge Cases

```gherkin
Scenario: Nada é interpolado entre marcos
  Given que o texto-fonte declara faixas por fase, não valores por semana
  When o seed é gerado
  Then nenhum campo numérico é calculado a partir de outros dois
  And semanas sem marco declarado não recebem distância própria
  And nenhuma regra de progressão é executada nesta story
```

```gherkin
Scenario: Dia sem número prescrito permanece ausente
  Given que o plano descreve a corrida de terça apenas qualitativamente
  When o corredor lê o plano
  Then vê a descrição da terça
  And os campos numéricos da terça permanecem ausentes
  And em nenhum momento aparecem como zero
```

```gherkin
Scenario: Publicar versão nova não muda o plano já associado
  Given que o corredor aponta para a versão 1
  When a versão 2 do plano é publicada
  Then o corredor continua lendo a versão 1
  And a versão 1 permanece íntegra
```

```gherkin
Scenario: Plano continua visível sem conexão
  Given que o corredor já leu seu plano uma vez
  When abre a aba Planejamento sem conexão
  Then vê o plano do cache
  And nenhuma tela vazia é apresentada
```

```gherkin
Scenario: Falha de leitura não vira plano vazio
  Given que a leitura do plano falha
  And não existe cache local
  When o corredor abre a aba Planejamento
  Then vê o aviso de falha de leitura
  And não vê um plano vazio nem uma semana sem treinos
```

---

## Cenários — Autorização e integridade

```gherkin
Scenario: Corredor nunca lê o plano de outro
  Given que dois corredores estão associados a versões de plano
  When um deles consulta o plano por qualquer identificador conhecido
  Then recebe somente o plano associado a ele
  And nenhum dado do outro corredor é retornado
```

```gherkin
Scenario: Versão de plano é imutável
  Given que existe uma versão de plano persistida
  When qualquer caminho do sistema tenta alterá-la
  Then a alteração é impedida
  And a leitura do corredor permanece idêntica
```

```gherkin
Scenario: Ausência de versão vigente é falha de configuração
  Given que nenhuma versão de plano está marcada como vigente
  When a API é iniciada
  Then a falha é sinalizada explicitamente
  And o problema não aparece ao corredor como plano vazio
```

---

## Mapping esperado: Cenário → Teste

| Área | Cobertura automatizada esperada |
|------|---------------------------------|
| `SteadyTrainingPlan` | Domínio: versão, imutabilidade, dias de corrida com prescrição opcional |
| Seed | Persistência: equivalência campo a campo com `TRAINING_PLAN_DOCUMENT` |
| Ausência de interpolação | Persistência: nenhum campo derivado de outros dois |
| Associação | Persistência: corredor aponta para versão; versão nova não realoca |
| Endpoint | API: leitura do plano do corredor e isolamento entre corredores |
| Arranque | API: ausência de versão vigente falha explicitamente |
| Aplicativo | Jest: leitura da API, cache offline, estado de falha distinto de vazio |

## Fora de escopo

- Gerar o plano a partir do `PlanRequest`.
- Personalizar conteúdo por corredor.
- Calcular progressão, volume semanal ou longão por semana.
- Editar o plano pelo aplicativo.
- Comparar execução com o plano (STORY-014).
