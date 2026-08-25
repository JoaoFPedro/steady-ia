# Problema — DISC-003: O plano e o registro não se encontram

> Criado em: 2026-08-22
> Facilitado por: Jefferson

---

## Persona

**Quem tem o problema?**

O mesmo corredor amador do DISC-001 e do DISC-002 (Jefferson, dogfooding). A
diferença é de novo o momento do fluxo, e agora é o terceiro:

| Discovery | Momento | Pergunta |
|-----------|---------|----------|
| DISC-001 | Olhando para trás | "estou me sobrecarregando?" |
| DISC-002 | Antes do treino | "o que eu treino hoje?" |
| **DISC-003** | **Terminou de treinar, celular na mão** | **"como eu registro isto que acabei de fazer — e o plano ficou em dia?"** |

---

## Situação atual

**Como as coisas funcionam hoje?**

O app já tem as duas metades. Elas simplesmente não se tocam.

**Metade "o que treinar"** — a Dashboard abre com o card *Plano da semana*
(`app/(tabs)/index.tsx:154`, STORY-007), que mostra o treino de hoje em duas
linhas: título e descrição. Os **exercícios** não estão ali. Para vê-los, o
corredor toca em "Ver plano da semana", cai em `/planning/plan` — que abre
sempre na aba **Dados**, com todos os dias fechados —, troca para a aba
**Semana** (`src/planning/PlanningDocument.tsx:212`), rola até "Detalhamento de
cada dia" e expande o dia certo (`DayRow`, mesmo arquivo).

**Metade "o que foi feito"** — para registrar, ele volta para a Dashboard, toca
no card *Registrar* e escolhe Corrida ou Musculação (`app/log/run.tsx`,
`app/log/strength.tsx`, STORY-001/003). O formulário abre **em branco**, sem
nenhuma noção de que existe um plano, muito menos de que hoje era dia de costas
e bíceps com corrida de qualidade.

Contando os toques para o gesto completo — ver o que era pra fazer e registrar
o que foi feito:

```
Dashboard → Ver plano da semana → aba Semana → (rolar) expandir o dia
          → voltar → Registrar → Musculação → formulário em branco
```

Cinco toques e uma rolagem, e no fim o formulário não sabe nada do que o
corredor acabou de ler.

**O que não existe em lugar nenhum**: qualquer noção de *dia cumprido*. O
`DOMAIN.md` é explícito — *"não existe distinção entre planejado e realizado,
porque não há plano"*. `RunningSession` e `StrengthSession` caem num histórico
avulso, sem data-alvo, sem vínculo, sem nada que diga a que dia do plano
pertenciam.

---

## Problema

**O que está errado, faltando ou frustrante nesse fluxo?**

O caminho do plano até o registro **passa por fora do app**: pela cabeça do
corredor. Ele lê os exercícios numa tela, memoriza, atravessa a navegação de
volta e redigita numa tela que não faz ideia do que ele leu. O app tem os dois
dados e obriga uma pessoa a ser a ponte entre eles, seis dias por semana.

A consequência é maior que o atrito. Porque nada liga registro a plano, **o app
é estruturalmente incapaz de dizer se o plano está sendo cumprido** — a única
pergunta que importa para quem tem uma prova marcada.

---

## Impacto

| Dimensão | Impacto |
|----------|---------|
| Frequência | 6 dias por semana (domingo é descanso), por 24 semanas — ~144 vezes por plano |
| Afetados | O próprio usuário hoje (dogfooding); qualquer corredor que siga periodização e queira saber se está aderindo a ela |
| Custo imediato | Cinco toques e uma rolagem para o que deveria ser um gesto; formulário em branco depois de já ter lido o treino na tela ao lado |
| Custo real | Registro que não acontece. Atrito no fim do treino, cansado, é onde o hábito morre — e sem registro a avaliação de sobrecarga (ADR-001) fica sem insumo, que é a promessa central do produto |
| Custo estrutural | A % de progresso pedida pelo produto **não pode existir** enquanto registro e plano forem universos separados. `specs/STORY-011/story.md` já teve de colocá-la fora de escopo por isso |

---

## Alternativas atuais

| Alternativa | Limitação |
|-------------|-----------|
| Memorizar o treino ao ler o plano e redigitar depois | É o que acontece hoje. Funciona até o corredor estar cansado ou distraído — exatamente quando ele acaba de treinar |
| Não registrar | O caminho de menor esforço, e o que o atrito favorece. Mata a sobrecarga (ADR-001) por falta de dado |
| Manter a contagem de dias cumpridos de cabeça | Ninguém faz isso por 24 semanas. Na prática, o corredor não sabe quanto do plano cumpriu |

---

## Evidências

- O card *Plano da semana* e a aba **Semana** já existem e já funcionam
  (STORY-006, STORY-007, STORY-008). O que falta não é tela — é **ligação**.
- `PlanningDocument.tsx:46` abre sempre em `'dados'`, e `SemanaSection` inicia
  com `expanded === null`. Nenhum caminho do app leva ao dia de hoje aberto.
- `DOMAIN.md`, seção *Entidades — previstas, ainda não existem*: "Registro de
  Desempenho — não implementado. Hoje `RunningSession`/`StrengthSession`
  acumulam esse papel — não existe distinção entre planejado e realizado".
- `specs/STORY-011/story.md`, *Fora de Escopo*: a prontidão/% foi adiada porque
  "exige cálculo de aderência ao plano no domínio". Este discovery é o que
  destrava aquilo.

---

## Perguntas em aberto

- [ ] **O denominador da % colide com a contagem regressiva.**
      `src/planning/trainingProgress.ts` conta o plano **de trás para frente a
      partir da data da prova**: quem gera o plano a 10 semanas da prova já
      "está" na semana 15 de 24, e as 84 diárias anteriores nunca existiram
      para ele. Com denominador fixo de 144, esse corredor termina o plano em
      ~42% — a % mentiria por construção. Precisa de resposta no `/spec`.
- [ ] **Treino fora da grade.** A semana do plano é fixa (`weekPlan`, sempre
      igual). Se o corredor correr no domingo ou trocar quinta por sexta, a
      derivação de "dia cumprido" erra. Vale tolerância? Qual?
- [ ] **O grupo muscular importa?** Segunda pede perna pesada. Registrar peito
      na segunda cumpre a segunda? Casar `MuscleGroup` com o que o plano pedia
      é mais fiel e mais rígido.
- [ ] Herdada do DISC-002 e ainda sem resposta: como a grade semanal se adapta
      a `trainingDaysPerWeek` diferente do que o documento estático assume.
