# Hipótese — DISC-005: Revisão de aderência após o treino

> Referência ao problema: `.discovery/DISC-005-revisao-de-aderencia-pos-treino/problem.md`

---

## Hipótese

> Acreditamos que **apresentar, depois da sincronização do treino, uma revisão
> assistida por IA que compare a execução com o plano do Steady e a ficha do
> personal, explique as divergências e recomende manter o próximo treino,
> reduzir carga ou priorizar recuperação**
> vai resolver **a falta de contexto para decidir o que fazer depois de um
> treino diferente do prescrito**
> para **todos os usuários que registram treinos no papel de Corredor**,
> e saberemos que funcionou quando **o corredor demonstrar que entendeu a
> divergência e a ação realizada no treino seguinte for coerente com a decisão
> tomada a partir da revisão**.

---

## Suposições críticas

| # | Suposição | Certeza | Como validar |
|---|-----------|---------|---------------|
| 1 | É possível recomendar uma das três ações sem transformar a IA em diagnóstico ou prescrição esportiva insegura. | Baixa | Definir regras e fontes reconhecidas, montar casos perigosos e exigir validação determinística antes de exibir a recomendação. |
| 2 | As prescrições e execuções possuem dados estruturados suficientes para comparar conclusão, distância, duração, esforço, exercícios, séries, repetições e cargas. | Média | Rodar a comparação sobre treinos reais e medir campos não comparáveis, especialmente descrições livres de corrida e nomes livres de exercícios. |
| 3 | O corredor entende a explicação e consegue relacioná-la à decisão sobre o próximo treino. | Baixa | Exibir uma pergunta curta de compreensão/decisão depois da revisão e observar correções, dúvidas e abandono. |
| 4 | A recomendação continua útil quando chega depois da sincronização de um registro criado offline. | Média | Medir tempo entre sincronização e abertura da revisão, além da proporção de revisões pendentes efetivamente lidas. |
| 5 | O treino seguinte registrado permite observar se a decisão informada foi seguida sem confundir ausência de registro com recuperação. | Baixa | Pedir que o corredor registre sua decisão e comparar com a próxima execução elegível; tratar ausência como desconhecida, não como descanso. |

---

## Maior risco

**Suposição #1.** A feature influencia uma decisão com possível efeito sobre
fadiga e lesão. Uma explicação convincente, mas incorreta, pode criar mais
confiança que o fluxo atual. O modelo não pode diagnosticar, inventar relação
causal nem alterar o planejamento. Comparações numéricas e limites de segurança
devem ser calculados e validados pelo código, apoiados por fontes reconhecidas.
Na incerteza ou na presença de dor relevante, a saída segura deve interromper a
recomendação esportiva e orientar recuperação/avaliação profissional conforme
regras previamente aprovadas.

---

## Escopo mínimo

**Dentro do escopo:**

- Revisão criada para corrida, musculação e dias combinados.
- Comparação de conclusão total/parcial/excedida.
- Corrida: distância, duração e esforço percebido.
- Musculação: exercícios, séries, repetições e cargas.
- Uso simultâneo do plano de corrida do Steady e da ficha ativa do personal,
  quando ambos existirem.
- Fatos e diferenças calculados de forma determinística antes da chamada à IA.
- Explicação dos possíveis impactos sem afirmar diagnóstico ou causalidade.
- Uma recomendação informativa entre: manter o próximo treino, reduzir carga ou
  priorizar recuperação, submetida a limites determinísticos de segurança.
- Plano e ficha permanecem inalterados.
- Registro offline entra na fila normalmente; a revisão fica pendente e aparece
  depois da sincronização.
- Registro da decisão compreendida pelo corredor e comparação com o próximo
  treino elegível.
- Possibilidade de o corredor informar que a revisão não fez sentido.

**Fora do escopo (explicitamente):**

- Alterar automaticamente o próximo treino, a ficha ou o plano.
- Gerar um plano de corrida ou uma ficha de musculação.
- Diagnosticar lesão, atribuir causa a uma dor ou substituir personal/médico.
- Chat aberto com o modelo.
- Reprocessar silenciosamente registros históricos em massa.
- Considerar ausência do próximo registro como prova de recuperação.
- Integração com wearables, frequência cardíaca, sono ou HRV.

**Evolução futura registrada:** permitir que uma recomendação aprovada adapte o
treino futuro. Essa evolução exige novo discovery, autorização explícita e
regras adicionais de segurança; não é consequência automática deste MVP.

---

## Métricas de validação

| Métrica | Baseline atual | Meta inicial para considerar válido |
|---------|---------------|--------------------------------------|
| Compreensão da divergência e da recomendação | Não existe revisão | ≥ 80% das revisões lidas são confirmadas como compreensíveis pelo corredor no piloto. |
| Coerência entre decisão informada e próximo treino | Não existe decisão registrada | ≥ 60% dos próximos treinos elegíveis observáveis são coerentes com a decisão registrada. |
| Revisões pendentes abertas após sincronização | Não existe revisão pendente | ≥ 70% são abertas antes do próximo treino planejado. |
| Recomendações contestadas ou sem sentido | Não mensurável | Registrar 100% das contestações; nenhum caso de segurança crítico conhecido permanece sem bloqueio e reteste. |
| Alterações automáticas no planejamento | 0 | 0 durante todo o MVP. |

As metas percentuais são critérios iniciais de piloto, não evidência clínica, e
devem ser recalibradas depois dos primeiros usuários.

---

## Impacto mapeado

```text
Meta: melhorar a decisão do corredor depois de um treino diferente do prescrito
└── Corredor
    ├── Impacto: entende exatamente onde execução e prescrição divergiram
    │   └── Entregável: comparação estruturada de corrida e musculação
    ├── Impacto: entende possíveis consequências sem receber diagnóstico
    │   └── Entregável: explicação limitada e verificável por IA
    ├── Impacto: escolhe conscientemente a conduta para o próximo treino
    │   └── Entregável: manter, reduzir carga ou priorizar recuperação
    └── Impacto: recebe a revisão mesmo quando registrou offline
        └── Entregável: revisão pendente exibida depois da sincronização
```
