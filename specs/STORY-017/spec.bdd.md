# Spec BDD: STORY-017 — Ficha do personal: validação em tela, observação, tempo e remoção

> **Story**: [story.md](./story.md)
> **Análise**: [analysis.md](./analysis.md)
> **Discovery**: nenhum — ajuste sobre a ficha já entregue (STORY-013/015)
> **ADR**: ADR-012 · ADR-017 (proposto)
> **Status**: Draft
> **Data**: 2026-08-29

---

## Feature: O personal descobre o que falta antes de publicar

A ficha deixa de ser rejeitada só pelo backend. O formulário valida a estrutura
antes do envio e aponta **o campo**, não a ficha. Junto disso, o exercício ganha
os dois campos que faltavam — tempo e observação, ambos opcionais — e a lista de
exercícios ganha remoção, sem a qual a validação travaria o personal.

### Decisões de produto

1. **O erro mora no campo, não no topo.** Campo inválido fica com borda e
   mensagem em vermelho. O `NoticeStrip` do topo continua existindo, mas só para
   o que não pertence a nenhum campo: falha de rede, vínculo encerrado,
   rejeição do backend.
2. **O erro só aparece depois de tentar publicar.** Ninguém é corrigido enquanto
   digita. Uma vez visível, o erro do campo some assim que aquele campo é
   corrigido.
3. **Ficha incompleta não vai à rede.** Nenhuma requisição é enviada enquanto
   houver campo inválido — o personal não espera round-trip para saber.
4. **O app valida estrutura; o domínio valida limite.** Está preenchido? é
   número? o máximo é maior que o mínimo? — app. Séries entre 1 e 20,
   repetições entre 1 e 100, esforço 1–10 — backend, fonte única. O 400 do
   backend continua aparecendo no topo.
5. **Todo treino tem pelo menos um exercício.** A remoção existe para o card que
   sobrou, não para esvaziar o treino: o último exercício de um treino não é
   removível.
6. **Remover é imediato e sem confirmação** — a ficha ainda é rascunho, nada foi
   publicado.
7. **Tempo é em segundos e é valor exato**, não faixa. Ele acompanha séries e
   repetições, nunca as substitui: as duas continuam obrigatórias.
8. **Observação é do personal e por exercício**, até 200 caracteres. É instrução
   de execução, não medida — não entra na comparação da STORY-014 e não se
   confunde com a observação que o corredor escreve ao registrar o treino.
9. **Em branco é ausência** (ADR-012): tempo em branco não é `0`, observação em
   branco não é `""`.
10. **Vermelho entra no design system** como rampa `danger` em
    `src/theme/nocturne.ts` (ADR-017). Nenhum hex solto na tela.
11. Ficha publicada antes desta story continua válida e legível, sem os campos
    novos e sem migration.

### Vocabulário observável

| Termo | Significado |
|-------|-------------|
| `Campo inválido` | Campo que o schema reprovou; exibe borda e mensagem em `danger` |
| `Erro de campo` | Mensagem exibida sob o campo, ligada a um único campo |
| `Aviso do topo` | `NoticeStrip`; reservado ao que não pertence a campo algum |
| `Ausente` | Campo opcional deixado em branco; não é zero nem string vazia |
| `Último exercício` | Único exercício restante de um treino; não removível |
| `Ficha legada` | Ficha publicada antes desta story, sem tempo e sem observação |

---

## Cenários — Validação em tela

```gherkin
Scenario: Publicar ficha com exercício em branco realça o campo
  Given que o personal preencheu a ficha inteira
  And deixou o nome do primeiro exercício de Empurrada em branco
  When toca em publicar a ficha
  Then o campo de nome daquele exercício fica realçado como inválido
  And a mensagem de erro aparece sob aquele campo
  And nenhuma requisição de publicação é enviada
```

```gherkin
Scenario: Vários campos inválidos são realçados de uma vez
  Given que o personal deixou o nome de um exercício e as séries de outro em branco
  When toca em publicar a ficha
  Then os dois campos ficam realçados simultaneamente
  And cada um exibe a sua própria mensagem
  And os campos preenchidos corretamente permanecem sem realce
```

```gherkin
Scenario: Erro de preenchimento não usa o aviso do topo
  Given que a ficha tem um campo inválido
  When o personal toca em publicar a ficha
  Then nenhum aviso de preenchimento aparece no topo da tela
```

```gherkin
Scenario: Corrigir o campo apaga o erro daquele campo
  Given que o personal tentou publicar e dois campos ficaram realçados
  When preenche corretamente um deles
  Then o realce e a mensagem daquele campo desaparecem
  And o outro campo continua realçado
```

```gherkin
Scenario: Erro só aparece depois de tentar publicar
  Given que o personal abriu o formulário da ficha nova
  When digita e apaga o nome de um exercício sem tocar em publicar
  Then nenhum campo é realçado como inválido
```

```gherkin
Scenario: Corrida sem descrição é realçada no próprio campo
  Given que o personal preencheu os exercícios de musculação
  And deixou a descrição da corrida de quinta em branco
  When toca em publicar a ficha
  Then o campo de descrição de quinta fica realçado
  And terça e sábado permanecem sem realce
```

```gherkin
Scenario: Faixa de corrida invertida é realçada no campo do máximo
  Given que o personal informou 10 km como mínimo e 8 km como máximo no sábado
  When toca em publicar a ficha
  Then o campo de máximo do sábado fica realçado
  And a mensagem explica que o máximo deve ser maior que o mínimo
```

```gherkin
Scenario: Máximo sem mínimo é realçado
  Given que o personal informou o máximo de duração da terça sem informar o mínimo
  When toca em publicar a ficha
  Then o campo de mínimo da terça fica realçado
```

```gherkin
Scenario: Ficha completa é publicada sem realce
  Given que o personal preencheu todos os campos obrigatórios da ficha
  When toca em publicar a ficha
  Then nenhum campo fica realçado
  And a ficha é enviada à API
  And a confirmação de publicação aparece no aviso do topo
```

## Cenários — Rejeição do backend

```gherkin
Scenario: Limite de domínio rejeitado pelo backend aparece no topo
  Given que o personal informou 40 séries num exercício
  And o formulário aceitou o valor por ser um número válido
  When a API rejeita a ficha pelo limite de séries
  Then a mensagem da API aparece no aviso do topo
  And a ficha não é publicada
  And os valores digitados permanecem na tela
```

```gherkin
Scenario: Falha de rede não realça campo algum
  Given que a ficha está completa e válida
  When o envio falha por indisponibilidade da API
  Then o aviso do topo informa a falha
  And nenhum campo é realçado como inválido
```

## Cenários — Remoção de exercício

```gherkin
Scenario: Personal remove um exercício que sobrou
  Given que o treino de Puxada tem três exercícios
  When o personal remove o segundo
  Then o treino passa a ter dois exercícios
  And os valores dos outros dois permanecem como estavam
```

```gherkin
Scenario: O último exercício do treino não é removível
  Given que o treino de Inferiores tem um único exercício
  Then aquele exercício não oferece a ação de remover
```

```gherkin
Scenario: Remover o exercício remove o erro dele junto
  Given que o personal tentou publicar e o terceiro exercício de Empurrada ficou realçado
  When remove aquele exercício
  And toca em publicar a ficha
  Then a ficha é publicada
  And nenhum resquício do exercício removido é enviado
```

```gherkin
Scenario: Remoção não pede confirmação
  Given que a ficha ainda não foi publicada
  When o personal remove um exercício preenchido
  Then o exercício sai da lista imediatamente
```

## Cenários — Tempo opcional na série

```gherkin
Scenario: Personal prescreve exercício com tempo
  Given que o personal está publicando uma ficha
  When informa 3 séries, 1 repetição e 40 segundos num exercício
  Then o exercício é publicado com o tempo de 40 segundos
  And séries e repetições continuam registradas
```

```gherkin
Scenario: Tempo em branco fica ausente, não zero
  Given que o personal preencheu um exercício sem informar o tempo
  When publica a ficha
  Then o exercício fica sem tempo prescrito
  And o valor zero não é atribuído ao tempo
```

```gherkin
Scenario: Tempo não dispensa séries nem repetições
  Given que o personal informou 40 segundos num exercício
  And deixou as repetições em branco
  When toca em publicar a ficha
  Then o campo de repetições fica realçado
```

```gherkin
Scenario: Tempo inválido é realçado no campo
  Given que o personal digitou um valor não numérico no tempo de um exercício
  When toca em publicar a ficha
  Then o campo de tempo fica realçado
```

```gherkin
Scenario: Tempo zero ou negativo é rejeitado
  Given que o personal informou tempo zero num exercício
  When a ficha é submetida
  Then o tempo é rejeitado com mensagem clara
  And a ficha não é publicada
```

```gherkin
Scenario: Corredor vê o tempo prescrito
  Given que a ficha ativa prescreve 40 segundos num exercício de Inferiores
  When o corredor abre o detalhamento de segunda-feira
  Then o tempo aparece junto de séries e repetições daquele exercício
```

```gherkin
Scenario: Exercício sem tempo não mostra campo vazio ao corredor
  Given que a ficha ativa prescreve um exercício sem tempo
  When o corredor abre o detalhamento do dia
  Then apenas séries e repetições são exibidas para aquele exercício
```

## Cenários — Observação por exercício

```gherkin
Scenario: Personal anota observação num exercício
  Given que o personal está publicando uma ficha
  When escreve "não travar o cotovelo" na observação de um exercício
  Then a ficha é publicada com aquela observação naquele exercício
  And os demais exercícios permanecem sem observação
```

```gherkin
Scenario: Observação em branco fica ausente
  Given que o personal publicou um exercício sem observação
  When a ficha ativa é consultada
  Then aquele exercício não tem observação
  And a observação não é registrada como texto vazio
```

```gherkin
Scenario: Observação longa demais é realçada no campo
  Given que o personal escreveu mais de 200 caracteres na observação de um exercício
  When toca em publicar a ficha
  Then o campo de observação fica realçado
  And a mensagem informa o limite de 200 caracteres
```

```gherkin
Scenario: Corredor lê a observação do personal ao registrar o treino
  Given que a ficha ativa traz observação num exercício
  When o corredor abre o registro daquele treino
  Then a observação do personal aparece junto da prescrição do exercício
  And ela é distinguível do campo em que o corredor escreve a própria observação
```

## Cenários — Compatibilidade

```gherkin
Scenario: Ficha legada continua legível
  Given que existe ficha publicada antes desta story
  When o corredor abre o detalhamento do dia
  Then os exercícios são exibidos sem tempo e sem observação
  And nenhum erro é apresentado
```

```gherkin
Scenario: Publicar não altera a ficha anterior
  Given que existe uma ficha ativa com tempo e observação
  When o personal publica uma ficha nova
  Then a ficha anterior permanece inalterada no histórico
  And a nova passa a ser a ativa
```

## Cenários — Segurança

```gherkin
Scenario: Publicar continua exigindo role de personal
  Given que um corredor sem role de personal tenta publicar uma ficha
  When a requisição chega à API
  Then a publicação é recusada por falta de permissão
```

```gherkin
Scenario: Publicar continua exigindo vínculo ativo
  Given que o personal não tem vínculo ativo com o corredor
  When tenta publicar uma ficha para ele
  Then a publicação é recusada
```

```gherkin
Scenario: Observação do personal não é interpretada como marcação
  Given que a observação de um exercício contém caracteres de marcação
  When o corredor abre o detalhamento do dia
  Then o texto é exibido literalmente, sem interpretação
```
