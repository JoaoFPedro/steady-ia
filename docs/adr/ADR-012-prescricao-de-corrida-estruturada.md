# ADR-012: Prescrição de corrida estruturada na ficha do personal

> **Data**: 2026-08-28
> **Status**: Accepted
> **Story**: STORY-015
> **Decisores**: Produto e Engenharia Steady

## Contexto

A STORY-014 compara a execução de corrida com a prescrição em distância,
duração e esforço percebido. Hoje isso é impossível: `RunningWorkout`
(`src/Steady.Domain/Coaching/TrainingSheet.cs`) guarda apenas
`TuesdayDescription`, `ThursdayDescription` e `SaturdayDescription` — texto
livre digitado pelo personal, sem nenhum campo numérico.

Sem prescrição estruturada, todo campo de corrida cairia no cenário
`Campo não comparável não é inventado` e a revisão de corrida entregaria apenas
"correu / não correu". O discovery DISC-005 trata o dia combinado como caso
central, então a corrida não pode ficar de fora.

Extrair número de texto livre com IA foi descartado de saída: a Lei do Domínio
#4 exige que toda regra de carga seja rastreável a uma fonte reconhecida, e a
STORY-014 exige que a comparação seja determinística **antes** de qualquer
chamada ao modelo.

## Opções Consideradas

### Opção A: Manter texto livre e inferir os números com IA

- **Prós**: nenhuma mudança na ficha, no app do personal ou no banco.
- **Contras**: viola a fronteira determinística da STORY-014; um número
  alucinado vira base de recomendação de carga; irreprodutível entre execuções.

### Opção B: Substituir a descrição livre por campos numéricos obrigatórios

- **Prós**: comparação sempre possível; contrato simples.
- **Contras**: quebra fichas publicadas; força o personal a numerar prescrições
  que ele descreve qualitativamente ("fartlek leve", "longão confortável"),
  empobrecendo a instrução que o corredor lê hoje.

### Opção C: Campos estruturados opcionais ao lado da descrição livre

- **Prós**: a descrição continua sendo a instrução que o corredor lê; o que o
  personal preencher vira comparável; o que ele deixar em branco fica
  explicitamente `NãoComparável`; fichas antigas continuam legíveis.
- **Contras**: a comparação de corrida passa a ter cobertura parcial e variável
  por ficha; exige migration e mudança no card do personal.

## Decisão

Escolhemos **Opção C**.

- `RunningWorkout` passa a conter, por dia prescrito (terça, quinta, sábado),
  um `RunPrescription` com `Description` (obrigatória, como hoje) e
  `DistanceKm`, `DurationMinutes` e `PerceivedEffort` **opcionais**.
- Cada campo numérico é uma **faixa**, não um ponto: `Min`/`Max` com `Max`
  ausente significando alvo exato. Prescrição de corrida é naturalmente
  intervalar ("8 a 10 km"), e forçar ponto único produziria divergência
  artificial na comparação.
- Campo não preenchido nunca é inferido, nem pelo código nem pelo modelo. Ele
  entra na comparação com estado `NãoComparável`.
- Fichas já publicadas continuam válidas: a desserialização de um documento sem
  os campos numéricos produz um `RunPrescription` só com descrição, exatamente
  como o comportamento de leitura legada que a ADR-010 já estabeleceu.
- A ficha permanece imutável e substituível (ADR-009). Estruturar a corrida não
  altera fichas existentes; só publicações novas carregam os números.

## Consequências

### Positivas

- A comparação de corrida deixa de ser sempre `NãoComparável` e passa a
  depender apenas do que o personal escolheu prescrever.
- A cobertura da revisão é visível e auditável: dá para medir quantas fichas
  prescrevem números e calibrar o produto com isso.
- Nenhum número apresentado ao corredor tem origem em inferência.

### Negativas

- O card Corrida do personal ganha três campos opcionais por dia, aumentando a
  densidade de um formulário que já tem três descrições.
- Duas fichas podem produzir revisões de profundidade diferente, o que precisa
  ser explicado na interface para não parecer inconsistência.

### Riscos

- Personal preencher número contraditório com a descrição ("longão leve" com
  3 km) → a revisão compara o número e exibe a descrição ao lado; o código não
  arbitra entre os dois nem sinaliza contradição textual.
- Faixa invertida ou absurda → validação de domínio com guard clause nos mesmos
  limites já usados em `RunningSession.Create`.
- Adoção baixa dos campos opcionais esvaziar a story → métrica de cobertura de
  campos comparáveis acompanhada no piloto (suposição crítica #2 do DISC-005).

## Referências

- `specs/STORY-014/spec.bdd.md` — cenários de corrida e `NãoComparável`
- `.discovery/DISC-005-revisao-de-aderencia-pos-treino/hypothesis.md` — suposição #2
- ADR-009 — ficha ativa substituível e execução imutável
- ADR-010 — ficha com prescrições de corrida por dia
- `.sdd/PROJECT-CONSTITUTION.md` — Lei do Domínio #4
