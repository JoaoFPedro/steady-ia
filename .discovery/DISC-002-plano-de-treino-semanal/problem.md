# Problema — DISC-002: Falta um plano de treino dentro do app

> Criado em: 2026-08-17
> Facilitado por: Jefferson

---

## Persona

**Quem tem o problema?**

O mesmo corredor amador do DISC-001 (Jefferson, dogfooding): já correu meia
maratona, treina para sua primeira maratona combinando corrida e musculação. A
diferença é o momento do fluxo — aqui ele já está **na frente do treino do dia**,
decidindo o que fazer, não olhando para trás avaliando o que já fez.

---

## Situação atual

**Como as coisas funcionam hoje?**

O app (STORY-001, STORY-003) registra sessões de corrida e musculação **depois**
de acontecerem e avalia sobrecarga combinada olhando para o histórico recente —
é uma ferramenta retrospectiva. Não existe, dentro do app, nenhuma tela que diga
o que treinar hoje ou nesta semana.

Para saber o que fazer, o corredor segue um plano de 24 semanas elaborado **fora
do app**, com apoio de um assistente de IA
(`.discovery/referencias/plano-treino-24-semanas.md`): 4 fases (Base, Construção,
Pico, Taper), estrutura semanal fixa de 4 dias (A/B/C/D), com progressão e
semanas de recuo definidas. Antes de cada sessão ele abre esse documento,
localiza de cabeça em que semana da periodização está — contando a partir da
data da prova — e lê o que o dia pede.

---

## Problema

**O que está errado, faltando ou frustrante nesse fluxo?**

O app sabe o que o corredor **já fez** e sabe se isso **já gerou sobrecarga**,
mas não sabe — e não diz — o que ele **deveria fazer a seguir**. Essa metade do
fluxo (planejamento) vive inteiramente fora do produto, num documento estático
que não sabe em que semana o corredor está "hoje" e não conversa com nada que o
app já registra.

---

## Impacto

**Por que isso importa? Qual é o custo do problema?**

| Dimensão | Impacto |
|----------|---------|
| Frequência | Toda sessão de treino — até 4x/semana, ao longo de 24 semanas |
| Afetados | O próprio usuário hoje (dogfooding); qualquer corredor amador que siga periodização estruturada teria o mesmo problema |
| Custo | Atrito de consultar um documento fora do app antes de cada sessão; risco de perder a contagem de qual semana/fase está em curso; o app hoje entrega só metade da promessa da Constituição ("treinar com segurança e consistência") — mostra o passado, não guia o próximo passo |

---

## Alternativas atuais

**Como as pessoas resolvem isso hoje sem a nossa solução?**

| Alternativa | Limitação |
|-------------|-----------|
| Documento de referência (`plano-treino-24-semanas.md`) fora do app | Estático — não calcula em que semana o corredor está, não conversa com as sessões já registradas nem com a avaliação de sobrecarga que o app já tem |
| Memorização / contagem manual de semanas a partir da data da prova | Sujeito a erro, exige disciplina de checar antes de cada treino |

---

## Evidências

- O plano de 24 semanas já existe como documento de referência, fruto de uma
  sessão anterior de planejamento com IA — é a fonte que o corredor pretende
  seguir de fato, hoje vivendo fora do app.
- O próprio `plano-treino-input-schema.md` já registrava, como pendência, que
  "nenhuma decisão foi tomada sobre se isso vira feature do produto" — esta
  sessão fecha essa pendência.

---

## Perguntas em aberto

- [ ] Quando a prova-alvo mudar (adiar, cancelar, trocar distância), o que
      acontece com o plano em uso? Fora do escopo do mock, relevante para a
      versão com geração real.
- [ ] Como a estrutura A/B/C/D se adapta a `trainingDaysPerWeek` diferente de 4
      (3, 5, 6)? Já registrado como aberto no `plano-treino-input-schema.md`,
      segue sem resposta.
