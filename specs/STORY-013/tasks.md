# Tasks — STORY-013

## 1. Decisões e domínio

- [x] Registrar ADR de roles, vínculo e autorização.
- [x] Registrar ADR de ficha ativa substituível e execução imutável.
- [x] Implementar roles, vínculo, ficha e execução no domínio por TDD.

## 2. Persistência e API

- [x] Persistir roles, vínculos, fichas ativas e execuções atômicas.
- [x] Criar migration da STORY-013.
- [x] Implementar endpoints de vínculo com autorização por role.
- [x] Implementar publicação, leitura da ficha e histórico autorizado.
- [x] Implementar registro idempotente da execução completa.
- [x] Cobrir isolamento entre corredores/personals e erros de contrato.

## 3. Aplicativo

- [x] Adicionar contratos de coaching e cache da ficha ativa.
- [x] Implementar fila offline para execução completa.
- [x] Implementar validação de carga, pulados, nota e sugestão.
- [x] Implementar áreas de personal e corredor conforme roles.
- [x] Integrar corrida ao formulário existente.

## 4. Fechamento

- [x] Executar testes .NET e Jest, typecheck e cobertura.
- [x] Atualizar mapping cenário → teste e critérios de aceite.
- [x] Executar `/review` automático com OWASP Top 10.

## 5. Integração da ficha ao planejamento diário

- [x] Cobrir por TDD o mapeamento dos quatro tipos da ficha nos sete dias.
- [x] Evoluir `RunningWorkout` para terça, quinta e sábado mantendo um único tipo Run.
- [x] Evoluir contratos da API, documento JSON e tipos do app para as três corridas.
- [x] Ler fichas legadas com `runDescription` sem perda de acesso.
- [x] Atualizar o card Corrida do personal com três inputs obrigatórios.
- [x] Carregar a ficha ativa no documento de planejamento com suporte ao cache offline.
- [x] Substituir exercícios estáticos no detalhamento diário pela prescrição resolvida.
- [x] Abrir `/coaching/strength` e `/log/run` com o treino e a corrida corretos do dia.
- [x] Preservar seção Semana e dia expandido ao voltar da execução.
- [x] Manter aceite e encerramento de vínculo acessíveis na área Planejamento.
- [x] Remover a aba principal e a rota dedicada Treinos sem deixar rota fantasma.
- [x] Executar testes .NET/Jest, typecheck, review e sync; atualizar mapping e critérios.

## 6. Registro único e combinação com corrida

- [x] Substituir ações diretas do detalhamento por um único botão `Registrar Treino`.
- [x] Implementar seleção do treino realizado antes do formulário de execução.
- [x] Criar armazenamento local para o rascunho de musculação aguardando corrida.
- [x] Finalizar o rascunho como `strengthWorkout` quando a corrida não for registrada.
- [x] Recuperar rascunho abandonado no reinício e incluí-lo no descarte de sessão.
- [x] Criar o tipo de fila `combinedWorkout` com uma chave de idempotência.
- [x] Encaminhar a prescrição do dia ao formulário da corrida complementar.
- [x] Criar contrato e endpoint para o comando combinado.
- [x] Persistir musculação e corrida na mesma transação com rollback integral.
- [x] Garantir reenvio idempotente sem duplicar nenhuma parte.
- [x] Cobrir seleção, pergunta condicional, cancelamento e corrida direta por TDD.
- [x] Executar testes, typecheck, review e sync; atualizar mapping e critérios.
