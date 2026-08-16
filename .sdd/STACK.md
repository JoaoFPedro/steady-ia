# Stack

- **Linguagem**: TypeScript (frontend) / C# (backend)
- **Framework**: React Native + Expo (frontend) / .NET (backend)
- **Test runner**: Jest (frontend) / xUnit (backend)
- **Banco / ORM**: PostgreSQL / Entity Framework Core
- **Package manager**: npm

## Frontend — `src/steady-app`

- **Expo SDK 57** · React Native 0.86 · React 19.2 · TypeScript 6
- Expo mudou bastante entre versões: consulte a doc versionada em
  https://docs.expo.dev/versions/v57.0.0/ antes de escrever código de plataforma.
- Navegação por arquivos (`expo-router`), fila offline em AsyncStorage,
  detecção de conexão via NetInfo, login Google via `expo-auth-session`.

## Design System — Nocturne

Fonte: `Marathon training app design/_ds/nocturne-*/`. Tokens espelhados em
`src/steady-app/src/theme/nocturne.ts` — nunca escreva hex solto no app.

- Fundo `#161826`, superfície `#232532`, texto `#e9e9ed`, accent `#9184d9`
- Botão primário é **contorno**, nunca preenchido; accent como linha e brilho, nunca preenchimento amplo
- Espaçamento denso (0.7×) e raio 8px vêm dos tokens
- Faixa de aviso = superfície + contorno de 1px em `accent-700`
