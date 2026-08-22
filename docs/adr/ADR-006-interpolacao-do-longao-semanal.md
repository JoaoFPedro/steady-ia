# ADR-006: Interpolação do longão semanal no Plano de Treino mockado

> **Data**: 2026-08-17
> **Status**: Superseded — ver nota abaixo
> **Story**: STORY-006
> **Decisores**: Jefferson

> **Superseded em 2026-08-17, minutos depois de Accepted.** O escopo em que
> este ADR se apoiava estava errado: a story não pede "semana atual
> calculada", pede o **documento inteiro** do plano de referência, atrás de
> um formulário com botão "Gerar plano" — sem geração dinâmica, sem data de
> prova embutida, sem interpolação nenhuma. `resolveTrainingWeek.ts` e seus
> testes foram removidos. Sem cálculo de progressão, a Lei do Domínio #4 não
> se aplica mais a esta story — nenhum ADR novo a substitui, porque nenhuma
> regra de progressão continua implementada. Preservado por inteiro abaixo
> como registro do que foi tentado e por quê estava errado — imutabilidade de
> ADR (`.sdd/CONSTITUTION.md`).

## Contexto

A STORY-006 exige que a aba Planejamento mostre a distância do longão (Dia C)
da semana atual do corredor. O material de referência
(`.discovery/referencias/plano-treino-24-semanas.md`) só declara marcos
aproximados por fase — ex.: "o longão sobe de ~14km para ~22km ao longo das 8
semanas da fase Base" — não um valor exato por semana. Mostrar um número
específico por semana (em vez de só a faixa da fase) exige calcular algo que a
fonte não escreveu diretamente: isso é regra de progressão *implementada*, não
texto copiado, e a Lei do Domínio #4 (`.sdd/PROJECT-CONSTITUTION.md`) exige
que toda regra desse tipo seja rastreável a uma fonte reconhecida via ADR
antes de produção. Este ADR formaliza a regra já anunciada em
`specs/STORY-006/spec.bdd.md` (regra de negócio 5).

## Opções Consideradas

### Opção A: Mostrar só a faixa da fase (texto qualitativo, sem número semanal)

- **Prós**: Nenhum cálculo novo — é literalmente o texto da fonte. Não aciona
  a exigência de ADR.
- **Contras**: Não responde à pergunta central da hipótese do DISC-002
  ("quanto eu corro *esta* semana") — entrega menos valor que uma tela que só
  repete o que o corredor já lê no documento externo.

### Opção B: Interpolação linear por partes entre os marcos que o plano-fonte já declara, com redução na semana de recuo

- **Prós**: Responde "quanto eu corro esta semana" com um número concreto.
  Nenhum marco novo é inventado — os 9 pontos usados são citados literalmente
  na fonte; a interpolação é só a forma mais simples e menos arbitrária de
  ligá-los. A redução em semana de recuo já está anunciada na fonte
  ("~20–30% menos volume a cada 4 semanas") — só falta escolher um número
  dentro dela.
- **Contras**: Introduz uma camada de cálculo que precisa de rastreabilidade
  formal (este ADR). Semanas distantes de qualquer marco (ex.: semana 12,
  a meio caminho entre os marcos das semanas 9 e 16) recebem um valor que a
  fonte nunca declarou individualmente — é extrapolação, mesmo que pela reta
  mais simples possível.

## Decisão

Escolhida a **Opção B**: o valor concreto por semana é o que a hipótese do
DISC-002 se propôs a validar ("o corredor sabe o que treinar sem sair do
app"); uma tela que só reproduz o texto da fase não teria diferença prática
do documento externo que a story existe para substituir.

### Regra definida

**Fonte**: `.discovery/referencias/plano-treino-24-semanas.md` — tabela
"Progressão aproximada do longão", a menção ao longão máximo de 32–34km nas
semanas 18–19, os valores de taper 21km → 13km → 8km, e a regra "semana de
recuo a cada 4 semanas (~20–30% menos volume)".

**Cálculo** (implementado em `src/planning/resolveTrainingWeek.ts`):

1. Nove marcos-âncora (semana, km), citados literalmente na fonte:
   `(1,14) (8,22) (9,24) (16,29) (17,30) (18,32) (19,34) (21,21) (24,8)`.
2. Para uma semana que coincide com um marco, usa o valor do marco
   diretamente. Para uma semana entre dois marcos, interpola linearmente pela
   reta que liga os dois vizinhos mais próximos.
3. **Semana de recuo** (a 4ª de cada ciclo de 4 dentro das fases Base e
   Construção — únicas com o ciclo "3 semanas de progressão + 1 de recuo",
   conforme a fonte): aplica redução de **25%** — o ponto médio da faixa
   "~20–30%" que a fonte já declara — sobre o valor do passo 2. A redução se
   aplica mesmo quando esse valor é, ele próprio, um marco (ex.: semanas 8 e
   16 são marco *e* semana de recuo ao mesmo tempo).
4. Resultado arredondado ao km mais próximo.

Pico e Taper não têm o ciclo de recuo (a fonte é explícita: "isso vale para
as fases 1 e 2") — nessas fases o valor do passo 2 nunca é reduzido.

## Consequências

### Positivas

- Todo o resultado é rastreável aos 9 números que a fonte já declara — a
  interpolação não inventa marco nenhum, só conecta os existentes.
- Regra simples o bastante para caber numa função pura, sem estado nem I/O
  (`resolveTrainingWeek`), testável com datas injetadas via fake timers.
- Consistente com a regra dos 10% e o espírito de progressão gradual já
  presentes na Lei do Domínio do projeto.

### Negativas

- Semanas distantes de qualquer marco (o pior caso é a semana 12–13, no meio
  do intervalo de 7 semanas entre os marcos 9 e 16) recebem um número que a
  fonte nunca escreveu — é a extrapolação mais simples disponível, mas
  extrapolação ainda assim.
- 25% é o ponto médio da faixa "~20–30%" da fonte, não um valor
  individualmente validado — uma escolha razoável, não uma medição.

### Riscos

- Se o número mostrado divergir do que o corredor real sente no corpo, a aba
  passa confiança falsa — risco já registrado como o de maior probabilidade
  na hipótese do DISC-002 (`.discovery/DISC-002-plano-de-treino-semanal/hypothesis.md`).
  Mitigação: é conteúdo mockado e sem persistência — corrigir a tabela de
  âncoras não afeta nenhum outro dado do sistema.
- Este ADR cobre apenas o Dia C (longão). Os Dias A, B e D permanecem texto
  fixo por fase, copiado da fonte sem cálculo — não precisam de ADR (Notas de
  Especificação de `specs/STORY-006/spec.bdd.md`).

## Referências

- `.discovery/referencias/plano-treino-24-semanas.md`
- `specs/STORY-006/spec.bdd.md` — regras de negócio 3, 4 e 5
- `.discovery/DISC-002-plano-de-treino-semanal/hypothesis.md`
- `.sdd/PROJECT-CONSTITUTION.md` — Lei do Domínio, princípios #1 e #4
