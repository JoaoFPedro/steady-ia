# Spec BDD: STORY-006 — Aba Planejamento com formulário e plano gerado

> **Story**: [story.md](./story.md)
> **Discovery**: [../../.discovery/DISC-002-plano-de-treino-semanal/](../../.discovery/DISC-002-plano-de-treino-semanal/)
> **Template de layout**: `tela.html` (turno 2 — artboard 2a: formulário; artboard 2b: plano gerado, 4 abas internas)
> **Status**: Draft — aguardando aprovação de Produto & Design
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)
> **Substitui**: a primeira versão desta spec ("semana atual calculada"), descartada por má leitura do pedido original — ver `story.md`

---

## Feature: Aba Planejamento

Uma segunda aba, ao lado da Dashboard, com um formulário que espelha o
`TrainingPlanRequest` (`.discovery/referencias/plano-treino-input-schema.md`).
Ao preencher os campos obrigatórios e tocar em **Gerar plano**, o corredor vê
o documento **inteiro** de `.discovery/referencias/plano-treino-24-semanas.md`
— todas as seções, não um recorte. Não há geração dinâmica nesta versão: o
plano é sempre o mesmo documento, e o formulário não o altera.

### Regras de Negócio

1. A aba Planejamento existe **apenas autenticado**, ao lado da Dashboard —
   mesma regra da Dashboard hoje. A tela de login não tem abas.
2. A aba abre mostrando o **formulário**, nunca o plano — gerar é uma ação
   explícita do corredor, nunca automática.
3. Campos **obrigatórios** (conforme o JSON Schema do `TrainingPlanRequest`):
   distância da prova, data da prova, maior corrida recente, distância e
   duração do tempo de referência, dias de treino por semana, duração da
   sessão de força, acesso a equipamento. **Opcionais**: primeira vez nessa
   distância (checkbox — sempre tem um valor, nunca bloqueia), corridas por
   semana hoje, dias preferidos, dores recorrentes, lesões anteriores.
4. O botão **Gerar plano** só habilita quando todos os campos obrigatórios
   estão preenchidos. Campos opcionais vazios não bloqueiam.
5. Ao gerar, a aba mostra o **documento completo**, organizado em **4 abas
   internas** (Fases · Semana · Mobilidade · Regras — artboard 2b):
   princípio central, as 4 fases, a progressão aproximada do longão e o
   ajuste do polimento (Fases); os 7 dias da semana de treino, cada um
   expansível para ver exercícios (Semana); as duas seções de mobilidade
   (Mobilidade); as 5 regras de ouro e a observação sobre ritmos (Regras).
   Nenhuma seção do plano-fonte fica de fora — só reorganizada em abas em
   vez de uma rolagem única.
5a. **O conteúdo da aba "Semana" é o plano real** (colado pelo corredor,
   2026-08-17) — um split de corpo inteiro em 7 dias (Perna pesada, Peito e
   tríceps + corrida moderada, Ombro, Costas e bíceps + corrida de
   qualidade, Perna leve, Longão, Descanso), não mais o A/B/C/D de
   `plano-treino-24-semanas.md`. Esse arquivo ficou desatualizado — segue
   registrado em `.discovery/referencias/` mas não é mais a fonte do
   conteúdo gerado; `trainingPlanDocument.ts` é a transcrição literal do
   plano real. Duas versões anteriores desta aba (semana calculada; depois
   uma reconciliação inventada de 7 dias) foram descartadas por não
   corresponderem ao pedido — ver histórico do `story.md`.
6. **Nenhuma geração dinâmica**: o plano mostrado é sempre o mesmo documento,
   qualquer que seja o valor preenchido no formulário. O formulário existe
   para a experiência ser honesta sobre o fluxo real (pedir dados → gerar);
   calcular um plano a partir desses dados é uma feature futura, fora do
   escopo do DISC-002.
7. O corredor pode voltar do plano gerado ao formulário (**Editar dados**).
   Os valores preenchidos continuam lá — voltar não limpa o formulário.
8. Trocar de aba (Dashboard ↔ Planejamento) preserva o que estava na tela —
   formulário parcialmente preenchido, ou plano já gerado. O React Navigation
   mantém cada aba montada por padrão; nada nesta story desliga esse
   comportamento.
9. Nenhum dado do formulário nem do plano é persistido nem enviado à API —
   tudo vive só no estado da tela.
10. **(Adendo 2026-08-21)** A Dashboard mostra um card "Plano da semana"
    (modelo `tela.html`, artboard 3a) com um botão **"Ver plano da semana"**
    que navega para a aba Planejamento. O conteúdo do card é estático — sem
    número de semana/fase calculado, já que isso segue fora de escopo do
    DISC-002 (regra 6).

---

### Cenários — Happy Path

```gherkin
Scenario: Corredor toca no card "Plano da semana" na Dashboard
  Given que estou autenticado na Dashboard
  When toco em "Ver plano da semana"
  Then vejo a aba Planejamento
```

```gherkin
Scenario: Corredor abre a aba Planejamento e vê o formulário
  Given que estou autenticado na tela inicial
  When toco na aba Planejamento
  Then vejo o formulário de solicitação de plano
  And não vejo nenhum plano gerado ainda
```

```gherkin
Scenario: Corredor preenche os campos obrigatórios e o botão habilita
  Given que estou no formulário da aba Planejamento
  When preencho distância da prova, data, maior corrida recente, tempo de
    referência, dias de treino por semana, duração da força e equipamento
  Then o botão "Gerar plano" fica habilitado
```

```gherkin
Scenario: Corredor gera o plano e vê o documento completo
  Given que preenchi todos os campos obrigatórios do formulário
  When toco em "Gerar plano"
  Then vejo o princípio central do plano
  And vejo as 4 fases (Base, Construção, Pico, Taper)
  And vejo o detalhamento dos 4 dias (A/B/C/D)
  And vejo a progressão aproximada do longão
  And vejo a seção de mobilidade
  And vejo as 5 regras de ouro
```

```gherkin
Scenario: Corredor volta ao formulário a partir do plano gerado
  Given que gerei o plano a partir do formulário preenchido
  When toco em "Editar dados"
  Then volto a ver o formulário
  And os campos que preenchi continuam com os mesmos valores
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Botão continua desabilitado enquanto faltar um campo obrigatório
  Given que estou no formulário da aba Planejamento
  When preencho todos os campos obrigatórios menos um
  Then o botão "Gerar plano" continua desabilitado
```

```gherkin
Scenario: Corredor gera o plano sem preencher nenhum campo opcional
  Given que preenchi só os campos obrigatórios do formulário
  When toco em "Gerar plano"
  Then vejo o documento completo do plano, normalmente
```

```gherkin
Scenario: Trocar de aba preserva o formulário parcialmente preenchido
  Given que preenchi parte do formulário na aba Planejamento
  When toco na aba Dashboard e depois volto para Planejamento
  Then os campos que já preenchi continuam com os mesmos valores
```

```gherkin
Scenario: A aba Planejamento não existe fora da autenticação
  Given que não estou autenticado e estou na tela de login
  When observo a tela
  Then não há abas — nem Dashboard nem Planejamento
```

---

### Cenários — Error Cases

Não há casos de erro nesta story: a aba não faz chamada de rede, não lê nem
escreve na fila offline, e os únicos dados que aceita do corredor (o
formulário) nunca alcançam um limite de sistema — não são enviados a
lugar nenhum, só liberam o botão. Não há formato a validar além de "vazio ou
não": a mesma regra que as telas `log/*` já seguem, onde a validação de
verdade fica do lado do servidor — que esta tela nunca chama.

---

## Mapping: Cenário → Teste

> Test runner: Jest (`.sdd/STACK.md`).

Esta story **não introduz nenhuma lógica computável** — o documento é dado
estático (`trainingPlanDocument.ts`, tipado, sem função sobre ele) e o botão
"Gerar plano" é um `if` de completude idêntico ao já usado, sem teste, nas
telas `log/run.tsx`/`log/strength.tsx`/`log/pain.tsx`. Não há função pura
nova para testar — diferente da STORY-005 (`accountPresentation.ts`), aqui
não sobrou nenhuma regra fora do React.

| Cenário | Cobertura |
|---------|-----------|
| Todos os cenários acima | 🔵 Manual — ver tabela abaixo |

**Sem cobertura automatizada — verificação manual no aparelho:**

| Cenário | Por quê |
|---------|---------|
| Todos | Formulário, navegação entre form/documento e entre abas —
  `@testing-library/react-native` não instala neste projeto (limitação
  herdada da STORY-003/005/006 — `react-dom@19.2.8` × `react@19.2.3` do Expo
  SDK 57) |

> **FF-001 não é medido por esta story.** Nenhum arquivo em `src/planning/`
> tem lógica condicional a testar — `trainingPlanRequest.ts` e
> `trainingPlanDocument.ts` são dados; `PlanningForm.tsx`/`PlanningDocument.tsx`
> são apresentação pura sem `@testing-library/react-native`. Forçar um teste
> aqui seria testar que um objeto é igual a si mesmo — sem valor.

---

## Notas de Especificação

- **Nenhum ADR.** Sem cálculo, a Lei do Domínio #4 não se aplica —
  `ADR-006` (que existiu por poucos minutos, para a versão errada desta
  story) está marcado Superseded, sem substituto.
- **Nenhuma dependência nova.** `expo-router` já suporta abas nativamente.
  `Field` ganhou um modo `multiline` (textarea) — extensão retrocompatível,
  as 3 telas `log/*` que já o usam não mudam de comportamento. Multi-seleção
  (dias preferidos, dores recorrentes) usa `MultiChoice`, um componente novo
  local a `src/planning/` — não altera `Choice`, que continua single-select
  para as 3 telas que já o usam.
- **`recurringPainAreas` e `preferredWeekdays` são arrays no schema.** O
  formulário captura os dois como multi-seleção de verdade (`MultiChoice`),
  fiel ao `TrainingPlanRequest` — a primeira versão desta spec havia
  simplificado para escolha única; corrigido ao seguir o template `tela.html`.
- **Slider da sessão de força virou campo numérico.** O template pede um
  `<input type="range">` (20–90min, passo 5); React Native não tem slider
  nativo e o projeto não tem `@react-native-community/slider` instalado.
  Campo numérico é a adaptação mais simples sem dependência nova — mesma
  informação, captura menos vistosa.
- **Botão sempre anuncia "24 semanas".** O template mostra
  `Gerar plano de {{ f.weeks }} semanas`, sugerindo um número calculado da
  data informada. Como o documento gerado é sempre o plano de 24 semanas
  (regra 6), um número diferente no botão prometeria algo que o resultado
  não cumpre — o botão usa a constante fixa, não a data do formulário.
- **Fora do escopo, herdado do discovery**: geração dinâmica de verdade,
  Objetivo de Corrida como entidade persistida, adaptação da estrutura
  A/B/C/D para outro número de dias de treino, e qualquer cruzamento com o
  registro real de sessões. Ver
  `.discovery/DISC-002-plano-de-treino-semanal/hypothesis.md`.
