# Steady — instruções para Codex

Este repositório usa o SDD Kit em `.sdd/`. Antes de alterar produto ou código, leia apenas os arquivos de contexto exigidos pela skill SDD selecionada.

## Skills do projeto

Os antigos comandos de `.claude/commands/` foram adaptados para skills do Codex em `.agents/skills/`:

- `$sdd-init`: fundação de projeto novo.
- `$sdd-onboard`: adoção idempotente de projeto existente.
- `$sdd-discover`: discovery de Produto & Design.
- `$sdd-spec`: especificação BDD após discovery.
- `$sdd-analyze`: análise estratégica antes da implementação.
- `$sdd-plan`: planejamento de uma história sem implementar.
- `$sdd-feature`: pipeline completo de feature.
- `$sdd-implement`: implementação TDD a partir da spec.
- `$sdd-review`: revisão contra BDD, qualidade e segurança.
- `$sdd-sync`: sincronização bidirecional entre spec e código.

Os antigos agents de documentação foram adaptados como skills:

- `$steady-api-docs`
- `$steady-domain-docs`
- `$steady-infrastructure-docs`
- `$documentai-orchestrator`

Quando o usuário mencionar o nome antigo com barra, por exemplo `/implement`, trate-o como invocação da skill equivalente `$sdd-implement`. Quando mencionar diretamente um antigo agent, carregue a skill de mesmo nome.

## Regras comuns

- Preserve mudanças preexistentes no worktree.
- Obedeça `.sdd/CONSTITUTION.md` e `.sdd/PROJECT-CONSTITUTION.md` nos fluxos SDD.
- Não pule pontos de aprovação marcados como `PARE` nas skills.
- Use os templates em `.sdd/templates/` em vez de recriá-los.
- Nos fluxos de documentação, a referência canônica é `.codex/prompts/documenta-ai.md`.
- O orquestrador pode delegar aos subagents especialistas quando o usuário solicitar o pipeline autônomo ou documentação de múltiplos projetos. Cada subagent deve carregar a skill especialista correspondente.

## Compatibilidade

`.claude/` permanece como origem histórica. A versão executável pelo Codex está em `.agents/skills/`; mudanças futuras de workflow devem ser refletidas nas duas árvores enquanto ambas forem mantidas.

Os scripts em `.codex/hooks/` são cópias de compatibilidade dos hooks do Claude. Eles não estão ativados automaticamente: só conecte hooks de lifecycle depois de validar o evento e o schema suportados pela versão do Codex em uso.
