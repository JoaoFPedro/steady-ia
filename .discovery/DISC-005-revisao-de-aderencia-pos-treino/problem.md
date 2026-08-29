# Problema — DISC-005: Revisão de aderência após o treino

> Criado em: 2026-08-28
> Facilitado por: Codex

---

## Persona

**Quem tem o problema?**

Todos os usuários que registram treinos no papel de **Corredor**, tanto quem
treina sozinho quanto quem está vinculado a um personal. A pessoa segue um
planejamento de corrida do Steady, uma ficha publicada pelo personal ou ambos
em um dia combinado.

---

## Situação atual

**Como as coisas funcionam hoje?**

O corredor consulta a prescrição do dia, realiza corrida, musculação ou ambas e
registra os dados executados. O Steady consegue derivar se as modalidades
previstas foram registradas, mas não apresenta uma revisão da diferença entre
prescrição e execução. Depois de um treino diferente do planejado, o corredor
simplesmente segue o próximo treino previsto.

O preenchimento do registro não é uma dificuldade relatada. O problema começa
depois que os dados foram informados.

---

## Problema

**O que está errado, faltando ou frustrante nesse fluxo?**

O corredor não recebe uma leitura clara da aderência do treino realizado à
prescrição de corrida e/ou à ficha do personal. Quando há diferença de volume,
intensidade, exercícios ou execução parcial, ele não entende os possíveis
impactos dessa diferença sobre o treino seguinte e não tem apoio para decidir
entre manter o próximo treino, reduzir a carga ou priorizar recuperação.

---

## Impacto

**Por que isso importa? Qual é o custo do problema?**

| Dimensão | Impacto |
|----------|---------|
| Frequência | Pode ocorrer após qualquer treino registrado que divirja da prescrição, especialmente em dias combinados. |
| Afetados | Todos os corredores que seguem um plano do Steady, uma ficha do personal ou ambos. |
| Custo | O próximo treino é seguido sem considerar a execução real; isso pode acumular fadiga, reduzir a aderência e aumentar a incerteza sobre recuperação e carga. |

---

## Alternativas atuais

**Como as pessoas resolvem isso hoje sem a nossa solução?**

| Alternativa | Limitação |
|-------------|-----------|
| Seguir o plano sem revisão | Ignora diferenças entre o que foi prescrito e o que realmente foi executado. |
| Avaliar pela própria sensação | Não cruza sistematicamente a sensação com os registros, a prescrição e o histórico recente. |
| Consultar o personal | Depende de disponibilidade e de reconstruir manualmente o contexto do treino. |

---

## Evidências

- Relato do produto: quando o treino diverge, o corredor hoje segue o plano sem
  uma etapa de revisão.
- O código já possui prescrições, execuções imutáveis e histórico de carga, mas
  a aderência atual considera principalmente presença das modalidades, não a
  correspondência detalhada entre prescrito e realizado.

---

## Perguntas em aberto

- [ ] Quais diferenças são materialmente relevantes para corrida e musculação
  na primeira versão?
- [ ] Quais regras determinísticas e fontes reconhecidas devem limitar as
  explicações e sugestões apresentadas pela IA?
- [ ] Uma sugestão de reduzir carga ou priorizar recuperação precisa de
  confirmação ou visibilidade do personal vinculado?
- [ ] Qual evidência observável demonstra que a revisão melhora a decisão do
  corredor sem criar falsa confiança?
