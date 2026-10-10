---
name: onboarding
title: Onboarding do projeto
description: Guia de onboarding ao preencher os arquivos de memória pela primeira vez
applies: .sdd/memory/**,.sdd/STACK.md
---

Você está editando arquivos de memória ou blueprints do isabel. Isso acontece no início de um projeto ou ao fazer onboarding em um projeto existente.

## Se `.sdd/STACK.md` não existir ou estiver vazio

Oriente o dev a rodar `/onboard` (projeto com código) ou `/init` (projeto novo). Ambos detectam a stack lendo os arquivos do projeto — linguagem, framework, test runner, banco, ORM, UI library, package manager — e escrevem `.sdd/STACK.md`.

## Se `.sdd/memory/PROJECT.md` está sem preenchimento

Ajude a preencher com base no código existente. Leia:

1. `README.md` do projeto (se existir)
2. Estrutura de pastas principal
3. Arquivos de entrypoint (main, app, index, server)
4. Arquivos de configuração (package.json, pyproject.toml, pom.xml, etc.)

Depois preencha:
- **Contexto**: o que o projeto faz, para quem, por quê
- **Glossário**: termos de domínio encontrados no código
- **Links**: repositório, board, docs

## Se `.sdd/memory/DOMAIN.md` está sem preenchimento

Leia o código e extraia:
- **Entidades**: models, schemas, entities — com campos principais
- **Fluxos principais**: os 3-5 fluxos mais importantes do sistema
- **Fronteiras**: onde o sistema se conecta com o mundo externo

## Se `docs/blueprints/` está vazio

Sugira criar `docs/blueprints/current-architecture.mermaid` com um diagrama C4 nível 2 dos módulos principais.

## Regra

Não invente informação. Se não conseguir inferir do código, deixe o campo com `# TODO: preencher` e oriente o dev.
