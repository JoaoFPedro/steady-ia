# BusinessRulesDocs - Steady.Infrastructure

Indice das regras de negocio da camada `src/Steady.Infrastructure`, em linguagem acessivel a stakeholders de negocio.

| Arquivo | Descricao |
|---|---|
| [Isolamento-de-Dados-por-Corredor-Persistencia-Autenticacao-Rules.md](./Isolamento-de-Dados-por-Corredor-Persistencia-Autenticacao-Rules.md) | Regra de negocio central da camada: nenhum corredor pode acessar dados de outro corredor; cobre identificacao do corredor (login/provisionamento) e o filtro por `corredor_id` aplicado em toda consulta. |
| [Registro-e-Historico-de-Corrida-Persistencia-Treino-Rules.md](./Registro-e-Historico-de-Corrida-Persistencia-Treino-Rules.md) | Como uma sessao de corrida e registrada e consultada, e como alimenta a deteccao de sobrecarga. |
| [Registro-e-Historico-de-Musculacao-Persistencia-Treino-Rules.md](./Registro-e-Historico-de-Musculacao-Persistencia-Treino-Rules.md) | Como uma sessao de musculacao e registrada e consultada, com destaque para o gatilho de "perna pesada" usado na regra de sobrecarga. |
| [Registro-de-Dor-Pos-Treino-Persistencia-Treino-Rules.md](./Registro-de-Dor-Pos-Treino-Persistencia-Treino-Rules.md) | Como o registro de dor funciona -- independente de sessao de treino, sem consulta de historico implementada ainda no MVP. |
| [Modelagem-e-Conexao-com-o-Banco-de-Dados-Persistencia-Configuracao-Rules.md](./Modelagem-e-Conexao-com-o-Banco-de-Dados-Persistencia-Configuracao-Rules.md) | Como a aplicacao se conecta ao banco por ambiente e como o schema de dados e organizado -- base estrutural para todas as demais regras. |

## Cobertura

5/5 unidades documentadas, uma BusinessRulesDocs por unidade de `Steady.Infrastructure`.

## Nota

A regra de **isolamento de dados por corredor** e a mais critica desta camada (dados de saude e localizacao de treino) e e tratada como o tema central de `Isolamento-de-Dados-por-Corredor-Persistencia-Autenticacao-Rules.md`; os demais documentos referenciam essa regra quando aplicavel, em vez de repeti-la integralmente.
