# ADR-000: Fundação do Steady

> **Data**: 2026-08-09
> **Status**: Accepted
> **Story**: — (fundação, gerado por `/init`)
> **Decisores**: Jefferson (dev solo)

## Contexto

Steady é um MVP para corredores amadores treinarem com segurança para sua primeira maratona (ou distâncias inferiores). O projeto é construído por um único desenvolvedor, corredor amador há 4 anos mas sem formação em fisiologia esportiva, com horizonte de 2-3 meses para ter algo testável com os primeiros usuários (dezenas a poucas centenas). É necessário decidir a stack técnica e os padrões arquiteturais iniciais que sustentem um domínio de treino relativamente complexo (progressão de carga, prevenção de lesão) sob restrição de tempo e equipe de um único dev.

## Opções Consideradas

### Opção A: React Native (Expo) + .NET + PostgreSQL

- **Prós**: Expo acelera desenvolvimento mobile com acesso simples a GPS nativo; .NET oferece tipagem forte para modelar regras de domínio complexas (progressão, value objects de pace/distância) com segurança; PostgreSQL é maduro, gratuito e lida bem com dados relacionais + geoespaciais se necessário no futuro.
- **Contras**: Dois runtimes/linguagens (TypeScript no frontend, C# no backend) para um dev solo manter.

### Opção B: Stack única (ex: full TypeScript com Node/NestJS + React Native)

- **Prós**: Uma única linguagem reduz troca de contexto para o dev solo.
- **Contras**: Tipagem e ferramentas de domínio do Node são mais fracas que .NET para modelar regras de negócio complexas com segurança; não é a preferência declarada pelo desenvolvedor.

## Decisão

Escolhemos **Opção A** — React Native (Expo) no frontend, .NET no backend, PostgreSQL como banco — porque é a stack que o desenvolvedor já decidiu usar, e porque a tipagem forte do .NET favorece modelar com segurança um domínio onde erros de regra (ex: progressão de volume) têm risco real de lesão para o usuário.

## Consequências

### Positivas

- Tipagem forte no backend reduz risco de bugs em regras de progressão de treino
- Expo acelera acesso a GPS nativo e autenticação (Google Sign-In) sem código nativo customizado
- PostgreSQL suporta crescimento de dezenas para centenas de usuários sem troca de banco

### Negativas

- Dois ecossistemas (TS + C#) para um dev solo manter, revisar e manter atualizados
- Sem par para revisão de código — `/review` (sensor inferencial) precisa compensar a ausência de revisão humana

### Riscos

- Regras de progressão de treino implementadas sem base fisiológica correta → mitigação: toda regra de domínio (Lei do Domínio, PROJECT-CONSTITUTION.md) exige ADR referenciando fonte reconhecida
- Dados de saúde/localização expostos indevidamente → mitigação: mandato inviolável de não exposição entre usuários, dados sensíveis tratados como LGPD-relevantes

## Referências

- `.sdd/PROJECT-CONSTITUTION.md`
- `.sdd/STACK.md`
