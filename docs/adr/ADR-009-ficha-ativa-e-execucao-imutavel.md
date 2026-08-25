# ADR-009 — Ficha ativa substituível e execução imutável

> Status: Aceita
> Data: 2026-08-24
> Contexto: STORY-013 · DISC-004

## Contexto

O corredor precisa ver somente a prescrição vigente, enquanto o personal
precisa consultar exatamente o que foi prescrito e executado no passado. Editar
uma ficha já usada faria execuções antigas parecerem ter seguido outra
prescrição e violaria a Lei do Domínio #2.

A execução de musculação também precisa funcionar offline e chegar inteira ao
servidor: exercícios executados, pulados, cargas e notas não podem sincronizar
parcialmente.

## Decisão

- Cada publicação cria uma nova ficha imutável contendo exatamente Empurrada,
  Puxada, Inferiores e Corrida.
- A nova ficha se torna a única ativa do corredor em uma transação; a anterior
  permanece armazenada como inativa.
- A interface não expõe versionamento ao corredor.
- Cada execução referencia a ficha e guarda snapshot de nome, séries e
  repetições. Uma publicação futura nunca muda o passado.
- A execução completa é um agregado persistido e sincronizado como um único
  JSON com uma chave de idempotência.
- Uma ficha nova inicia todas as sugestões vazias. Dentro da mesma ficha, a
  sugestão vem apenas da última execução do exercício: positivo sugere a carga;
  pulado deixa vazio.
- Corrida reutiliza `RunningSession`; a descrição prescrita pertence à ficha e
  o histórico profissional agrega o registro real do corredor.

## Consequências

- A persistência usa documento JSON para a definição e para o snapshot da
  execução, mantendo a escrita atômica e evitando tabelas filhas prematuras no
  MVP.
- Validação ocorre no domínio e novamente na borda da API; JSON do cliente
  nunca é persistido sem reconstruir o agregado.
- Fichas e execuções antigas não são apagadas quando o vínculo termina.

