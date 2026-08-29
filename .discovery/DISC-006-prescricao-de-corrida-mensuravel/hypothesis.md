# Hipótese — DISC-006: A prescrição de corrida não é mensurável

> Referência ao problema: `.discovery/DISC-006-prescricao-de-corrida-mensuravel/problem.md`

---

## Hipótese

> Acreditamos que **permitir ao personal informar distância, duração e esforço
> como faixas opcionais ao lado da descrição livre**
> vai resolver **a ambiguidade da prescrição de corrida e a impossibilidade de
> compará-la com a execução**
> para **corredores com personal vinculado**,
> e saberemos que funcionou quando **a maior parte dos dias de corrida
> publicados trouxer ao menos um campo numérico e o corredor executar dentro da
> faixa prescrita com mais frequência do que hoje executa dentro da intenção
> descrita**.

---

## Suposições críticas

| # | Suposição | Certeza | Como validar |
|---|-----------|---------|--------------|
| 1 | O personal preenche campos opcionais em número suficiente para a prescrição virar comparável. | Baixa | Medir a proporção de dias de corrida publicados com ao menos um campo numérico no piloto. |
| 2 | Faixa é a forma correta; obrigar valor único produziria prescrição falsa. | Alta | Já observável nas prescrições reais: "8 a 10 km", "3x8–12". |
| 3 | Três campos por dia, opcionais, não tornam o formulário do personal pesado a ponto de reduzir publicações. | Média | Observar tempo de publicação e abandono do formulário. |
| 4 | O corredor entende a faixa sem instrução adicional. | Média | Observar execuções fora da faixa acompanhadas de dúvida ou contestação. |

---

## Maior risco

**Suposição #1.** Se o personal não preencher, a story entrega um formulário
mais denso e nenhuma prescrição comparável — custo sem retorno, e a STORY-014
continua sem poder revisar corrida. A mitigação não é tornar obrigatório: é
manter o custo de preencher baixo (campos por dia, ao lado do que ele já
escreve) e medir a adoção antes de decidir por obrigatoriedade em outro ciclo.

---

## Escopo mínimo

**Dentro do escopo:**

- Distância, duração e esforço percebido, opcionais e independentes, por dia de
  corrida da ficha.
- Faixa com mínimo obrigatório e máximo opcional.
- Validação nos mesmos limites que `RunningSession` já aplica.
- Leitura de ficha legada sem os campos.
- Exibição dos números junto da descrição no detalhamento do dia.

**Fora do escopo:**

- Comparar execução com prescrição (DISC-005 / STORY-014).
- Campos obrigatórios.
- Extrair número da descrição livre, por qualquer meio.
- Carga prescrita de musculação.
- Sugerir valores ao personal a partir do histórico.

---

## Métricas de validação

| Métrica | Baseline atual | Meta inicial |
|---------|---------------|--------------|
| Dias de corrida publicados com ao menos um campo numérico | 0 — o campo não existe | ≥ 50% no piloto |
| Fichas publicadas por personal | Baseline atual preservado | Sem queda após a mudança |
| Erros de validação por publicação | Não mensurável | Tendência decrescente após as primeiras publicações |
