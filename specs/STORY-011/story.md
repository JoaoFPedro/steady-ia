# Story: STORY-011 — Cabeçalho da Dashboard: saudação, contagem e fase

Discovery: — (sem discovery associado, ver *Contexto*)
Protótipo: `Marathon training app design/steady.html` (turno 3, artboard 3a — Dashboard)

## Descrição

Como **corredor amador seguindo o plano de 24 semanas rumo à minha primeira maratona**,
Quero **abrir o app e ver, de cara, quem eu sou no app, quanto tempo falta para a prova e em que
ponto do plano estou**,
Para que **eu saiba se o treino de hoje é de acumular base ou de polir — e quanto ainda tenho pela
frente — sem abrir o planejamento inteiro**.

## Contexto

A Dashboard hoje abre com a data por extenso ("sábado, 22 de agosto") e vai direto ao card do treino
do dia (STORY-007). A data responde *que dia é hoje*, que é justamente o que o corredor já sabe. O
protótipo responde outra coisa no mesmo espaço: **onde eu estou no plano**.

O protótipo (artboard 3a) tem três elementos no cabeçalho:

```
Bom dia, Marina                    [15 semanas]
Semana 6 de 20 · fase Base
```

Nada disso é novo do ponto de vista de dado: a conta autenticada já é lida pelo menu lateral
(STORY-005), a data da prova já vem no planejamento (`raceDate`, STORY-006/010, já lido pela home
para decidir o destino de "Ver plano da semana") e as quatro fases já estão escritas em
`trainingPlanDocument.ts` (STORY-006). O que falta é a **aritmética entre eles** — e ela não existe
em spec nenhuma, por isso esta story.

A contagem é **regressiva a partir da data da prova**, não a partir da criação do plano. É o modelo
que o código já assume (`raceDate.ts`: *"o plano é contado de trás para frente"*) e o único que faz o
taper cair nas 4 semanas que antecedem a prova, independentemente de quando o corredor gerou o plano.

## Critérios de Aceite

- [ ] Corredor abre a Dashboard e é saudado pelo primeiro nome da conta Google, no período do dia
- [ ] Corredor vê quantas semanas faltam para a prova
- [ ] Corredor vê em que semana do plano está, de quantas, e o nome da fase
- [ ] A semana e a fase saem da data da prova do planejamento mais recente, contadas de trás para
      frente sobre as 24 semanas do plano
- [ ] Sem planejamento nenhum, o cabeçalho convida a criar um — nunca inventa semana ou fase
- [ ] Com a prova a mais de 24 semanas, o cabeçalho diz que o plano ainda não começou
- [ ] No dia da prova, o cabeçalho marca que é hoje
- [ ] Passada a prova, o cabeçalho volta a mostrar só a saudação
- [ ] Nenhuma chamada de rede nova: tudo sai do que a Dashboard já lê

## Fora de Escopo

| Item | Razão |
|------|-------|
| Prontidão ("62% · no ritmo certo") e projeção de chegada | Exige cálculo de aderência ao plano no domínio — o app nunca calcula treino (FF-004, ADR-001). Story própria, com regra vinda da API |
| Escolher qual plano acompanhar quando há vários | O mais recente é o plano em vigor; troca explícita é escopo da aba Planejamento |
| Plano com duração diferente de 24 semanas | O documento do plano é fixo em 24 semanas (STORY-006). Quando a API passar a gerar planos de duração variável, a fonte da duração muda — a regra de contagem, não |
| Ajustar a barra de abas / navegação do protótipo | Já coberto e decidido em stories anteriores |

## Estimativa

- **Tamanho**: P
- **Complexidade**: Baixa — três funções puras e um cabeçalho; nenhum dado novo, nenhuma rede

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-005 (identidade da conta na home) | Concluída |
| Story | STORY-006 (documento do plano, fases, `raceDate`) | Concluída |
| Story | STORY-010 (lista de planejamentos vinda do servidor) | Concluída |
