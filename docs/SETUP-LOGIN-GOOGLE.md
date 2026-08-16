# Configurar o login do Google

Guia do que **você** precisa fazer para o login funcionar. O código já está pronto.

Faça na ordem — o passo 5 depende do 4.

> **Por que dois Client IDs?** O nome "Web" confunde: para o Google, esse tipo
> identifica o **seu servidor**, não uma página. O login no celular é nativo,
> sem navegador. O tipo **Web** é o "para quem" o token é emitido (a audiência
> que a API valida); o tipo **Android** é o que prova ao Google que o aplicativo
> instalado é mesmo o seu. Um app mobile precisa dos dois.
>
> **O campo de impressão digital só aparece no tipo Android.** No tipo Web ele
> não existe.

---

## 1. Criar o projeto no Google Cloud

1. Acesse https://console.cloud.google.com
2. No topo, clique no seletor de projeto → **Novo projeto**
3. Nome: `Steady` → **Criar**

## 2. Configurar a tela de consentimento

1. Menu → **APIs e serviços** → **Tela de permissão OAuth**
2. Tipo de usuário: **Externo** → **Criar**
3. Preencha: nome do app (`Steady`), e-mail de suporte, e-mail do desenvolvedor
4. Em **Usuários de teste**, adicione **o seu próprio e-mail do Google**

> Sem se adicionar como usuário de teste, o Google recusa o seu login enquanto
> o app não for publicado.

## 3. Criar o Client ID do tipo **Web**

1. **APIs e serviços** → **Credenciais** → **Criar credenciais** → **ID do cliente OAuth**
2. Tipo de aplicativo: **Aplicativo da Web**
3. Nome: `Steady Web`
4. **Criar** → copie o **ID do cliente** (termina em `.apps.googleusercontent.com`)

> É obrigatório mesmo sendo app de celular: é este client ID que faz o Google
> emitir o token que a API valida.

**Guarde esse valor.** Ele vai em dois lugares — veja o passo 6.

## 4. Gerar o keystore e pegar o SHA-1

O Google exige a **impressão digital SHA-1** para criar o client ID Android. Ela
vem do keystore — o arquivo que assina o aplicativo.

**Você não vai usar `keytool`.** Aquela instrução do Google é para quem guarda o
próprio keystore. Com EAS, quem gera e guarda é a Expo.

**Já foi feito em 2026-08-16**: o keystore foi gerado na nuvem junto com o
primeiro build de desenvolvimento (passo 6). Não precisa gerar de novo — gerar
outro invalidaria o SHA-1 já registrado no Google.

Para ler o SHA-1:

- **Dashboard** (não precisa de terminal): https://expo.dev/accounts/jaozimdotis-team/projects/steady/credentials
  → Android → perfil **development** → **Keystore** → `SHA-1 Fingerprint`
- **Terminal**, se preferir: `npx eas-cli credentials -p android` — é um menu
  interativo, sem equivalente não-interativo nesta versão do CLI

> É `eas-cli`, não `eas` — `npx eas` falha com "could not determine executable to run".

## 5. Criar o Client ID do tipo **Android**

Google Cloud → **Credenciais** → **Criar credenciais** → **ID do cliente OAuth**
→ tipo **Android**:

- Nome do pacote: `com.steady.app`
- Certificado SHA-1: o valor do passo 4

> Não precisa me passar este client ID — ele não entra no código. O Google o usa
> só para reconhecer que o aplicativo instalado é mesmo o seu.

## 6. Gerar o build e instalar no celular

```bash
cd /home/jones/projetos/steady/src/steady-app
npx eas-cli build --profile development --platform android
```

Ao final sai um link. Abra no celular e instale o `.apk`.

> **Pré-requisito**: `expo-dev-client` precisa estar nas dependências, senão o
> comando recusa o perfil `development`. Já foi instalado em 2026-08-16.
>
> Este passo **não depende dos client IDs**: eles são lidos em runtime do `.env`
> pelo dev server, não embutidos no `.apk`. Por isso o build pode (e foi) rodar
> antes dos passos 3 e 5 — é ele que gera o keystore de onde sai o SHA-1.

## 7. Colocar o Client ID Web nos dois lados

Ele precisa ser **o mesmo** nos dois — se divergir, todo login vira erro 401.

**Já foi feito em 2026-08-16.** O valor não fica neste documento de propósito —
consulte-o no Google Cloud (Credenciais → client ID do tipo Web) ou no seu
`launchSettings.json` local. Client ID não é segredo, mas repetir credencial de
ambiente na documentação é como elas acabam onde não deviam.

- **API**: `Google__ClientId` em `Steady.Api/Properties/launchSettings.json` — copie
  de `launchSettings.example.json`, que é o modelo versionado (o arquivo real é
  ignorado pelo git). Assim `dotnet run` já sobe configurado. Sem o client ID a API **se recusa a subir**,
  de propósito — sem ele aceitaria token emitido para qualquer outro aplicativo
  (ver `docs/adr/ADR-002-*.md`). Fora do ambiente de desenvolvimento, use a
  variável de ambiente: `export Google__ClientId="..."`.
- **App**: `src/steady-app/.env` (fora do git; o modelo versionado é `.env.example`).

Se precisar refazer, os dois valores têm de ser **idênticos** — divergiram, todo
login vira 401.

O `EXPO_PUBLIC_API_URL` do `.env` **não** é o `hostname -I` do WSL: veja a seção
sobre WSL2 mais abaixo.

## 8. Rodar

O `.apk` do passo 6 é só a casca do app: o código JavaScript vem do servidor de
desenvolvimento. Por isso **não é preciso refazer o build** quando o `.env` muda
— basta reiniciar o servidor:

```bash
cd /home/jones/projetos/steady/src/steady-app
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.28 npx expo start --clear
```

Abra o app instalado no celular; ele se conecta ao servidor sozinho.

> Só é preciso refazer o build (passo 6) quando muda algo **nativo**: uma
> biblioteca nova com código nativo, o nome do pacote ou os plugins do `app.json`.

---

## O ambiente é WSL2 — o celular não alcança nada sem ponte

O WSL2 roda numa rede NAT própria. O `hostname -I` de dentro dele devolve algo
como `172.17.57.156`, que **não existe** para o celular. O endereço que vale é o
do Windows na rede local: **192.168.0.28** (interface Ethernet).

Nada que escute dentro do WSL fica visível nesse endereço automaticamente. É
preciso encaminhar as portas — **PowerShell como Administrador**:

```powershell
# API (5050) e Metro/dev server do Expo (8081)
netsh interface portproxy add v4tov4 `
  listenaddress=0.0.0.0 listenport=5050 connectaddress=172.17.57.156 connectport=5050

netsh interface portproxy add v4tov4 `
  listenaddress=0.0.0.0 listenport=8081 connectaddress=172.17.57.156 connectport=8081

New-NetFirewallRule -DisplayName "WSL Steady" `
  -Direction Inbound -Protocol TCP -LocalPort 5050,8081 -Action Allow
```

Conferir: `netsh interface portproxy show v4tov4`.

> **O IP do WSL muda a cada reinício.** Quando o app parar de alcançar a API,
> quase sempre é isso. Descubra o novo com `hostname -I`, remova as regras
> antigas (`netsh interface portproxy reset`) e refaça os dois comandos.
>
> **Alternativa permanente**: rede espelhada. Crie `%USERPROFILE%\.wslconfig`
> com `[wsl2]` + `networkingMode=mirrored`, rode `wsl --shutdown` no PowerShell
> e reabra o terminal. O WSL passa a compartilhar a rede do Windows e o
> portproxy deixa de ser necessário. Exige Windows 11 22H2+ (esta máquina tem).

### O dev server precisa anunciar o IP certo

Por padrão o Expo anuncia o IP que enxerga — o do WSL. O app instalado tentaria
buscar o bundle em `172.17.57.156:8081` e falharia. Force o endereço:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.28 npx expo start --clear
```

## Para o teste ponta a ponta funcionar

- PostgreSQL rodando, com `ConnectionStrings__SteadyDb` definida
- API rodando e escutando em `0.0.0.0:5050` (não só `localhost`), senão o
  celular não alcança — já configurado em `Steady.Api/Properties/launchSettings.json`
- Portas 5050 e 8081 encaminhadas do Windows para o WSL (acima)
- Celular na mesma rede que o computador

---

## O que verificar depois de instalar

1. Abrir o app → cai na tela de login
2. Entrar com o Google → chega na home
3. Registrar uma corrida
4. Conferir no banco: `select * from running_sessions;` — deve ter uma linha com
   `corredor_id` e `idempotency_key` preenchidos
5. **Desligar o Wi-Fi** e registrar outra corrida → o app aceita e a home mostra
   "1 registro pendente"
6. **Religar o Wi-Fi** → o aviso some sozinho e a segunda linha aparece no banco

Os passos 5 e 6 são os que provam que a fila offline funciona no aparelho — a
parte mais arriscada da STORY-003.

---

## Sobre segredos

O **Client ID não é segredo** e pode ir para o git. O que nunca pode é *client
secret* — e este fluxo não usa nenhum.

Ainda assim, `.env` está no `.gitignore` do projeto, porque ele também carrega o
endereço da sua máquina.
