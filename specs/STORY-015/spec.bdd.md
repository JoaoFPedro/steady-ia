# Spec BDD: STORY-015 — Prescrição de corrida estruturada na ficha

> **Story**: [story.md](./story.md)
> **Discovery**: [../../.discovery/DISC-006-prescricao-de-corrida-mensuravel/](../../.discovery/DISC-006-prescricao-de-corrida-mensuravel/)
> **ADR**: ADR-012
> **Status**: Implemented
> **Data**: 2026-08-28

---

## Feature: Números opcionais ao lado da descrição da corrida

A ficha ganha, por dia de corrida, distância, duração e esforço percebido
opcionais. A descrição livre continua obrigatória e continua sendo o que o
corredor lê primeiro. O que o personal preencher vira dado comparável; o que
ele deixar em branco fica ausente e assim permanece.

### Decisões de produto

1. Descrição obrigatória, números opcionais. A ficha nunca deixa de ser
   publicável por falta de número.
2. Cada campo numérico é uma faixa: mínimo obrigatório, máximo opcional. Máximo
   ausente significa alvo exato.
3. Os três campos são independentes. Prescrever só a distância é válido.
4. Campo em branco é ausência, não zero. Nada é inferido da descrição.
5. Os limites de cada campo são os mesmos que `RunningSession` já valida, para
   que prescrição e execução vivam na mesma escala.
6. Ficha publicada antes desta story continua válida e legível sem os números.
7. Publicar continua substituindo a ficha ativa sem apagar versões (ADR-009).

### Vocabulário observável

| Termo | Significado |
|-------|-------------|
| `Alvo exato` | Faixa com mínimo preenchido e máximo ausente |
| `Faixa` | Mínimo e máximo preenchidos, com máximo maior que o mínimo |
| `Ausente` | Campo não preenchido pelo personal; não é zero |
| `Ficha legada` | Ficha publicada antes desta story, sem campos numéricos |

---

## Cenários — Happy Path

```gherkin
Scenario: Personal prescreve corrida com os três campos
  Given que o personal possui vínculo ativo com o corredor
  When publica a ficha com a corrida de terça descrita e com 8 a 10 km, 45 a 55 minutos e esforço 5 a 6
  Then a ficha ativa passa a conter os três campos da terça como faixas
  And a descrição de terça continua preservada
  And quinta e sábado permanecem sem campos numéricos
```

```gherkin
Scenario: Personal prescreve alvo exato sem faixa
  Given que o personal está publicando uma ficha
  When informa 21 km para o sábado sem informar máximo
  Then a distância de sábado é registrada como alvo exato de 21 km
  And nenhum máximo é inventado a partir do mínimo
```

```gherkin
Scenario: Personal prescreve apenas um dos campos
  Given que o personal está publicando uma ficha
  When informa somente o esforço percebido da quinta
  Then o esforço da quinta fica registrado
  And distância e duração da quinta permanecem ausentes
  And a ficha é publicada normalmente
```

```gherkin
Scenario: Corredor vê os números junto da descrição
  Given que a ficha ativa prescreve 8 a 10 km para a terça
  When o corredor abre o detalhamento da terça
  Then vê a descrição da corrida
  And vê a distância prescrita ao lado dela
  And o dia sem números prescritos mostra somente a descrição
```

---

## Cenários — Edge Cases

```gherkin
Scenario: Ficha publicada sem nenhum número continua válida
  Given que o personal preenche apenas as três descrições
  When publica a ficha
  Then a ficha ativa é criada
  And os campos numéricos dos três dias ficam ausentes
  And o corredor vê exatamente o que via antes desta story
```

```gherkin
Scenario: Ficha legada é lida sem perda de acesso
  Given que existe uma ficha publicada antes desta story
  When o corredor ou o personal a consulta
  Then ela é desserializada com as três descrições
  And os campos numéricos aparecem como ausentes
  And nenhum erro de leitura é produzido
```

```gherkin
Scenario: Campo em branco não vira zero
  Given que o personal deixa a distância de quinta em branco
  When a ficha é publicada e relida
  Then a distância de quinta permanece ausente
  And em nenhum momento é representada como zero
```

```gherkin
Scenario: Nova publicação não altera a ficha anterior
  Given que existe uma ficha ativa com números prescritos
  When o personal publica outra ficha com números diferentes
  Then a nova ficha passa a ser a ativa
  And a ficha anterior preserva seus próprios números
```

---

## Cenários — Validação, autorização e erros

```gherkin
Scenario: Faixa invertida é rejeitada
  Given que o personal informa 12 km como mínimo e 8 km como máximo
  When tenta publicar a ficha
  Then a publicação é rejeitada com mensagem sobre a faixa
  And nenhuma ficha nova é criada
  And a ficha ativa anterior permanece intacta
```

```gherkin
Scenario: Valor fora dos limites do domínio é rejeitado
  Given que o personal informa uma distância, uma duração ou um esforço fora dos limites que RunningSession aceita
  When tenta publicar a ficha
  Then a publicação é rejeitada com mensagem sobre o campo
  And nenhuma ficha nova é criada
```

```gherkin
Scenario: Zero e negativo não são prescrição
  Given que o personal informa zero ou valor negativo em qualquer campo numérico
  When tenta publicar a ficha
  Then a publicação é rejeitada
  And a mensagem distingue campo vazio de campo com valor inválido
```

```gherkin
Scenario: Esforço percebido respeita a escala existente
  Given que o personal informa esforço 11
  When tenta publicar a ficha
  Then a publicação é rejeitada
  And a mensagem cita a escala de 1 a 10
```

```gherkin
Scenario: Publicar continua exigindo personal com vínculo ativo
  Given que um usuário sem role de personal, ou sem vínculo ativo com o corredor
  When tenta publicar uma ficha com prescrição estruturada
  Then a publicação é negada
  And nenhuma ficha é criada para aquele corredor
```

---

## Mapping esperado: Cenário → Teste

| Área | Cobertura automatizada esperada |
|------|---------------------------------|
| `RunPrescription` | Domínio: alvo exato, faixa, ausência, faixa invertida e limites |
| `RunningWorkout` | Domínio: três dias independentes, tipo Run preservado |
| Serialização | Persistência: ida e volta com e sem números, leitura de ficha legada |
| Contrato da API | API: publicação válida, rejeições e mensagens |
| Autorização | API: role de personal e vínculo ativo |
| App do personal | Jest: campos opcionais, faixa e validação antes do envio |
| App do corredor | Jest: exibição dos números junto da descrição e dia sem números |

## Fora de escopo

- Comparar execução com prescrição (STORY-014).
- Campos obrigatórios.
- Extração de número a partir da descrição livre.
- Carga prescrita de musculação.
- Sugestão automática de valores ao personal.
