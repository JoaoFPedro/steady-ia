# ADR-010: Ficha com prescrições de corrida por dia

> **Data**: 2026-08-25
> **Status**: Accepted
> **Story**: STORY-013
> **Decisores**: Produto e Engenharia Steady

## Contexto

A ficha ativa é o planejamento que o corredor consulta. Ela possui um único
card lógico de Corrida, mas a semana prescreve corrida em três dias com
objetivos diferentes: terça, quinta e sábado. O contrato atual guarda somente
`runDescription`, obrigando os três dias a compartilhar o mesmo texto.

Os exercícios estáticos hoje exibidos em Planejamento → Semana → Detalhamento
de cada dia também competem com a ficha publicada pelo personal. A ficha deve
ser a fonte canônica da prescrição, preservando leitura offline e fichas já
gravadas no documento JSON anterior.

## Opções Consideradas

### Opção A: Três workouts independentes do tipo Corrida

- **Prós**: cada prescrição já nasce como item separado.
- **Contras**: quebra a invariável de exatamente quatro tipos na ficha e exige
  identificador adicional para distinguir três itens com o mesmo tipo.

### Opção B: Um workout Corrida com três campos nomeados por dia

- **Prós**: mantém um único card e a invariável dos quatro tipos; o encaixe na
  semana é explícito e simples.
- **Contras**: vincula o formato atual da ficha aos três dias de corrida do
  calendário semanal.

### Opção C: Lista genérica de prescrições com dia configurável

- **Prós**: permite calendários futuros com quantidade e dias variáveis.
- **Contras**: amplia o escopo do MVP, exige validação de cardinalidade e cria
  flexibilidade que o produto ainda não pediu.

## Decisão

Escolhemos **Opção B** porque corresponde diretamente à interface aprovada: um
card Corrida com três inputs obrigatórios, para terça, quinta e sábado.

- `RunningWorkout` continua sendo o único workout do tipo `Run` e passa a
  possuir três descrições.
- O contrato HTTP e os tipos do app transportam as três prescrições de forma
  explícita.
- O documento JSON da ficha adota o novo formato sem alterar a tabela ou a
  atomicidade da publicação.
- A leitura aceita o documento legado com uma única descrição durante a
  transição, aplicando esse texto aos três dias; toda nova publicação grava o
  formato novo.
- Planejamento → Semana usa a ficha ativa como fonte dos exercícios e das
  corridas. O conteúdo estático não é fallback de prescrição.

## Consequências

### Positivas

- Cada dia de corrida apresenta a orientação correta sem criar cards ou tipos
  artificiais.
- Ficha, calendário e tela usam uma única fonte canônica.
- A evolução não exige migration de esquema relacional.

### Negativas

- O contrato de publicação e resposta da ficha muda em API e app.
- Terça, quinta e sábado ficam explícitos no modelo do MVP.
- A desserialização precisa sustentar temporariamente dois formatos JSON.

### Riscos

- Ficha antiga tornar-se ilegível → desserialização compatível e teste com
  fixture do formato anterior.
- Exercícios estáticos continuarem influenciando progresso → `dayRequirements`
  deve operar sobre a prescrição resolvida da ficha.
- Botão diário abrir o registro genérico → teste de mapeamento do destino para
  `/coaching/strength` e da descrição correta para `/log/run`.

## Referências

- `specs/STORY-013/analysis.md`
- `docs/adr/ADR-009-ficha-ativa-e-execucao-imutavel.md`
- `specs/STORY-013/blueprint.mermaid`
