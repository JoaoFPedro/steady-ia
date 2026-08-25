# Hipótese — DISC-004: O personal não recebe a carga realmente executada

> Referência ao problema: `.discovery/DISC-004-historico-de-carga-para-o-personal/problem.md`

---

## Hipótese

> Acreditamos que **permitir ao personal vinculado criar uma ficha com
> exercícios em texto livre, séries e repetições, e permitir ao corredor
> registrar a carga realmente utilizada e uma nota opcional por execução**
> vai resolver **a perda da carga executada e a falta de histórico para ajustar
> a prescrição**
> para **o corredor que treina com acompanhamento e o personal responsável por
> sua ficha**,
> e saberemos que funcionou quando **o personal conseguir consultar a carga
> mais recente e a evolução de cada exercício antes de atualizar a ficha, sem
> depender da memória do corredor**.

---

## Suposições críticas

| # | Suposição | Certeza | Como validar |
|---|-----------|---------|---------------|
| 1 | O corredor registrará a carga real ao executar cada exercício | Média | Medir quantos exercícios prescritos recebem carga em cada treino |
| 2 | Sugerir a última carga reduz o esforço de registro sem induzir confirmação automática de valor incorreto | Média | Comparar preenchimentos novos e cargas ajustadas; observar correções e abandono |
| 3 | O personal consultará o histórico antes de ajustar a ficha | Média | Medir consultas ao histórico antes da criação de uma nova prescrição |
| 4 | Texto livre é suficiente para identificar o mesmo exercício ao longo do histórico do MVP | Baixa | Observar duplicatas e variações de nome criadas pelo mesmo personal |

---

## Maior risco

**Suposição #1.** Se preencher a carga continuar trabalhoso durante ou depois do
treino, o corredor seguirá usando a memória e o personal continuará sem dados.
O MVP deve reduzir o gesto ao mínimo: uma carga para o exercício inteiro,
pré-preenchida com o último valor quando ele existir, e uma nota opcional que
sempre começa vazia.

Há ainda um limite de segurança obrigatório: buscar um corredor pelo e-mail não
autoriza acesso. O personal só pode ver ficha, cargas e notas depois que o
corredor confirmar o vínculo. Subscription futura pode governar cobrança, mas
não substitui consentimento e controle de acesso.

---

## Escopo mínimo

**Dentro do escopo:**

- Perfil próprio de personal autenticado pelo Steady.
- Busca do corredor por e-mail para iniciar o vínculo.
- Confirmação do vínculo pelo corredor antes de liberar qualquer dado.
- Personal publica uma ficha com os quatro treinos obrigatórios: Empurrada,
  Puxada, Inferiores e Corrida. Os três primeiros usam exercícios em texto
  livre, séries e repetições; Corrida usa uma descrição livre.
- A prescrição não define carga: a carga real pertence à execução do corredor.
- Uma carga por exercício, inicialmente vazia no primeiro treino.
- A última carga utilizada aparece como sugestão nos treinos seguintes e pode
  ser confirmada ou alterada.
- Nota curta, livre e opcional por execução; começa vazia em cada treino.
- Histórico cronológico detalhado de cargas, notas e exercícios pulados visível
  para o personal vinculado. O corredor vê somente a ficha ativa e a sugestão
  da carga mais recente aplicável.

**Fora do escopo:**

- Catálogo padronizado de exercícios.
- Carga diferente por série.
- Modelagem de falha ou repetição incompleta.
- Progressão automática de carga.
- Prescrição gerada pela aplicação.
- Subscription, cobrança ou limites comerciais.
- Compartilhamento de dados sem vínculo confirmado.
- Histórico detalhado para o corredor.

---

## Métricas de validação

| Métrica | Baseline atual | Meta para considerar válido |
|---------|---------------|----------------------------|
| Execuções com carga real registrada | 0% — o dado não existe | A maioria dos exercícios executados recebe uma carga antes do próximo treino |
| Última carga recuperável por exercício | Impossível | Disponível para toda execução anterior registrada com carga |
| Histórico acessível ao personal vinculado | Inexistente | Personal consulta cargas, notas e exercícios pulados sem pedir reconstrução de memória ao corredor |
| Exposição a personal não confirmado | Sem funcionalidade hoje | 0 ocorrências |

---

## Impacto mapeado

```text
Meta: ajustar a musculação com base no que o corredor realmente executou
├── Corredor
│   ├── Impacto: registra sem depender da memória
│   │   └── Entregável: carga sugerida + nota opcional por exercício
│   └── Impacto: retoma a carga anterior sem reconstruir o treino
│       └── Entregável: sugestão da última carga positiva na ficha ativa
└── Personal
    ├── Impacto: prescreve uma ficha identificável
    │   └── Entregável: exercício livre + séries + repetições
    └── Impacto: ajusta com evidência
        └── Entregável: acesso autorizado ao histórico do corredor
```
