# Decisão — DISC-004: O personal não recebe a carga realmente executada

> Data: 2026-08-24
> Decidido por: Jefferson
> Referências: `.discovery/DISC-004-historico-de-carga-para-o-personal/problem.md` · `.discovery/DISC-004-historico-de-carga-para-o-personal/hypothesis.md`

---

## Decisão

- [x] **Construir** → Story criada em `specs/STORY-013/`
- [ ] **Validar primeiro** → Experimento / pesquisa necessária antes de construir
- [ ] **Diferir** → Válido, mas não agora
- [ ] **Descartar** → Fora do escopo, problema não confirmado ou hipótese refutada

---

## Rationale

O problema é frequente e hoje não possui nenhuma alternativa dentro do produto:
a carga executada fica apenas na memória e não chega ao personal. O Steady já
registra a sessão agregada de musculação, mas esse dado não permite acompanhar
progressão por exercício.

O recorte do MVP mantém a execução simples: uma carga por exercício, nota livre
opcional e sugestão da última carga. A prescrição vem do personal e contém
somente exercício, séries e repetições. Catálogo, carga por série e progressão
automática aumentariam o custo sem serem necessários para validar se o histórico
melhora o ajuste da ficha.

A busca por e-mail foi mantida como forma de descoberta, mas não como
autorização. O corredor precisa confirmar o vínculo antes que o personal veja
qualquer dado de desempenho físico.

---

## Se Construir

**Story criada:** `specs/STORY-013/`

**Escopo acordado:**

- Perfil de personal e vínculo iniciado por busca de e-mail.
- Confirmação obrigatória do corredor.
- Ficha completa com Empurrada, Puxada, Inferiores e Corrida; musculação em
  texto livre com séries e repetições.
- Carga real e nota opcional registradas pelo corredor por exercício.
- Sugestão da última carga usada.
- Histórico visível ao personal vinculado.

**O que fica fora desta versão:**

- Catálogo de exercícios e normalização de nomes.
- Carga por série e falhas de repetição estruturadas.
- Progressão gerada pelo Steady.
- Subscription e cobrança.

---

## Aprendizados

- O dado que o personal prescreve e o dado que o corredor executa são fatos
  diferentes: a ficha define séries e repetições; a execução registra a carga.
- A última carga é uma sugestão de interface, não deve ser gravada como nova
  execução até o corredor confirmar o treino.
- Subscription é uma futura regra comercial. Autorização de acesso aos dados é
  uma exigência independente e já pertence ao MVP.
