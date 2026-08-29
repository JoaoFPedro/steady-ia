# Spec BDD: STORY-018 — Dia registrado fecha o botão de registro

> **Story**: [story.md](./story.md)
> **ADR**: ADR-003 (fila conta como registro) · ADR-009 · ADR-011
> **Status**: Implemented
> **Data**: 2026-08-29

---

## Feature: O dia registrado não aceita segundo registro

### Decisões de produto

1. O botão fecha em `cumprido` — todas as modalidades previstas registradas.
2. `parcial` **mantém o botão aberto**: só ocorre em terça e quinta (ADR-011),
   e fechar tiraria do corredor o caminho para registrar a corrida que falta.
3. Fecha **só o dia registrado**. O botão já só existe em hoje.
4. Registro na fila vale como registro (ADR-003): o dia fecha na hora, offline.
5. O que a ficha registra conta igual ao registro avulso — nas duas pontas.
6. Execução da ficha não tem duração: o histórico mostra o nome do treino
   ("Empurrada"), nunca "0 min".
7. **A janela do plano não governa o botão.** `weekStatuses` corta os 168 dias
   que terminam na prova (regra 19) para manter exato o denominador do
   progresso. "Já registrei hoje?" é outra pergunta: quem monta o plano com
   onze meses de antecedência estava fora da janela e nunca via o botão fechar.
   O botão lê `todayRegistrationStatus`, sem o corte; as marcas da semana e o
   progresso seguem com a janela, inalterados.

---

## Cenários — Botão

```gherkin
Scenario: Dia cumprido fecha o botão
  Given que hoje é segunda-feira e o plano prevê musculação
  And o corredor já registrou a musculação de hoje
  When abre o detalhamento de hoje
  Then o botão de registro está desabilitado
  And exibe "Treino registrado"
```

```gherkin
Scenario: Dia ainda vazio aceita o registro
  Given que hoje o plano prevê treino
  And o corredor ainda não registrou nada hoje
  When abre o detalhamento de hoje
  Then o botão de registro está habilitado
```

```gherkin
Scenario: Dia parcial continua aceitando o registro
  Given que hoje é terça-feira, com musculação e corrida previstas
  And o corredor registrou apenas a musculação
  When abre o detalhamento de hoje
  Then o botão de registro continua habilitado
  And ele consegue registrar a corrida que falta
```

```gherkin
Scenario: Fechar um dia não fecha os outros
  Given que o corredor registrou o treino de hoje
  When abre o detalhamento de outro dia da semana
  Then aquele dia não é afetado pelo registro de hoje
```

```gherkin
Scenario: Dia cumprido fecha o botão mesmo fora da janela do plano
  Given que a prova do corredor é daqui a onze meses
  And hoje está fora dos 168 dias que terminam na prova
  And o corredor já registrou tudo que hoje previa
  When abre o detalhamento de hoje
  Then o botão de registro está desabilitado
  And as marcas da semana continuam sem exibir "Feito", como antes
```

```gherkin
Scenario: Histórico ilegível nunca bloqueia o registro
  Given que a leitura do histórico falhou
  When o corredor abre o detalhamento de hoje
  Then o botão de registro continua habilitado
```

## Cenários — O que conta como registro

```gherkin
Scenario: Musculação registrada pela ficha fecha o dia
  Given que o corredor registrou a musculação pela ficha do personal
  When o estado do dia é recalculado
  Then o dia conta a musculação como registrada
```

```gherkin
Scenario: Registro combinado fecha as duas modalidades
  Given que o corredor registrou musculação e corrida numa unidade só
  When o estado do dia é recalculado
  Then o dia conta as duas modalidades como registradas
```

```gherkin
Scenario: Registro na fila fecha o dia antes do sync
  Given que o corredor registrou o treino sem conexão
  When o estado do dia é recalculado
  Then o dia já conta como registrado
```

```gherkin
Scenario: O dia não reabre depois do sync
  Given que o registro saiu da fila e chegou ao servidor
  When o estado do dia é recalculado
  Then o dia continua contando como registrado
```

```gherkin
Scenario: Plano e dor não fecham dia de treino
  Given que o corredor só tem pedido de plano e registro de dor na fila
  When o estado do dia é recalculado
  Then nenhuma modalidade é dada como registrada
```

## Cenários — Histórico

```gherkin
Scenario: Musculação da ficha aparece no histórico do corredor
  Given que o corredor registrou a Empurrada pela ficha
  When abre o histórico
  Then a execução aparece como musculação, nomeada "Empurrada"
  And nenhuma duração é exibida, porque ela não foi registrada
```

```gherkin
Scenario: Histórico continua isolado por corredor
  Given que outro corredor registrou execuções pela ficha dele
  When o corredor consulta o próprio histórico
  Then as execuções do outro não aparecem
```
