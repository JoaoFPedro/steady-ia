# Steady

Aplicativo de treino para corredores amadores que já correm 21km e querem chegar
à primeira maratona sem se machucar no caminho.

O problema que ele ataca é específico: quem treina sozinho não tem como saber se
a carga da semana subiu demais. Volume de corrida e musculação somam no mesmo
corpo, mas ninguém soma os dois na hora de decidir se dá para treinar forte hoje.
O Steady faz essa conta e avisa.

## O que ele faz hoje

- **Registro offline-first** de corrida, musculação e dor. O registro entra numa
  fila local antes de qualquer rede e é confirmado na hora — correr sem sinal é
  o normal, não a exceção.
- **Detecção de sobrecarga combinada**: compara a carga recente (corrida +
  musculação) com a janela anterior e sinaliza risco. Exige 14 dias de histórico
  e diz explicitamente quando ainda está reunindo dados, em vez de fingir que
  "sem risco" e "não sei" são a mesma coisa.
- **Planejamento**: o corredor responde um formulário sobre a prova-alvo e o
  próprio perfil, e o pedido fica guardado por corredor. O conteúdo de treino
  exibido ainda é estático — gerar os exercícios a partir das respostas é o
  próximo passo.
- **Login com Google**, sem senha própria.

## Stack

| Camada | Tecnologia |
|---|---|
| App | Expo SDK 57 · React Native 0.86 · React 19 · TypeScript 6 · expo-router |
| API | .NET 10 · ASP.NET Core Minimal APIs |
| Persistência | PostgreSQL · EF Core 9 (Npgsql) |
| Testes | xUnit (backend, banco real via Testcontainers) · Jest (app) |

O backend é dividido em três projetos: `Steady.Domain` (C# puro, sem framework),
`Steady.Infrastructure` (EF Core, repositórios, migrations) e `Steady.Api`
(endpoints, autenticação).

## Rodando

Pré-requisitos: .NET 10 SDK, Node 20+, Docker e `dotnet-ef`.

```bash
# 1. Configuração local (ambos são ignorados pelo git)
cp src/Steady.Api/Properties/launchSettings.example.json \
   src/Steady.Api/Properties/launchSettings.json
#    preencha o Client ID do Google e a connection string

# 2. Sobe banco, migrations, API e dev server numa sessão tmux
scripts/dev.sh
```

`scripts/dev.sh --stop` derruba API e Expo. O script detecta sozinho se o banco
é um container local ou gerenciado, e confere antes de subir o que costuma
quebrar em silêncio — arquivos de configuração ausentes e divergência entre o
Client ID do app e o da API.

O app usa módulo nativo do Google Sign-In, então **não roda no Expo Go**: precisa
de um development build. O guia completo de Google Cloud, keystore e client IDs
está em [`docs/SETUP-LOGIN-GOOGLE.md`](docs/SETUP-LOGIN-GOOGLE.md).

### Testes

```bash
dotnet test Steady.slnx           # domínio + API (sobe Postgres em container)
cd src/steady-app && npx jest     # app
```

## Como o repositório é organizado

```
.discovery/     Sessões de discovery — problema, hipótese e decisão
specs/          Uma pasta por story: story.md + spec.bdd.md em Gherkin
docs/adr/       Decisões arquiteturais, com contexto e alternativas
src/            Steady.Domain · Steady.Infrastructure · Steady.Api · steady-app
tests/          Steady.Domain.Tests · Steady.Api.Tests
scripts/        Subida do ambiente local e blindagem do banco gerenciado
```

O fluxo de trabalho é orientado a especificação: nada é implementado sem um
cenário BDD aprovado, e toda decisão arquitetural vira um ADR. Regras de
progressão de treino são rastreáveis a uma fonte reconhecida — a regra dos 10%,
periodização clássica — e nunca a um julgamento do código, porque quem escreve
não tem formação em fisiologia esportiva.

As regras invioláveis do projeto estão em
[`.sdd/PROJECT-CONSTITUTION.md`](.sdd/PROJECT-CONSTITUTION.md); o domínio, em
[`.sdd/memory/DOMAIN.md`](.sdd/memory/DOMAIN.md).

## Licença

MIT
