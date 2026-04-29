# BOT-GRAER

Bot em TypeScript com [discord.js](https://discord.js.org/) que monta e atualiza uma lista de hierarquia por cargos no servidor, com comandos slash `/atualizar` e `/parar`.

## Requisitos

- Node.js 20 ou superior (recomendado 22)
- npm

## Configuração

1. Clone o repositório e instale dependências:

   ```bash
   npm install
   ```

2. Copie o ficheiro de ambiente e preencha os valores:

   ```bash
   copy .env.example .env
   ```

   No Linux/macOS: `cp .env.example .env`

3. Variáveis no `.env`:

   | Variável | Obrigatória | Descrição |
   |----------|-------------|-----------|
   | `DISCORD_TOKEN` | Sim | Token do bot (Developer Portal) |
   | `CLIENT_ID` | Sim | Application ID da aplicação Discord |
   | `GUILD_ID` | Sim | ID do servidor onde o bot corre |
   | `TEXT_CHANNEL_ID` | Não | Se definido, os comandos só funcionam nesse canal |
   | `ALLOWED_USER_IDS` | Não | IDs de utilizadores (separados por vírgula) que podem usar os comandos além dos cargos admin configurados no código |

4. Registe os comandos slash no servidor (após alterar comandos ou num setup novo):

   ```bash
   npm run register
   ```

5. Desenvolvimento (executa o TypeScript diretamente):

   ```bash
   npm run dev
   ```

6. Produção: compile e inicie:

   ```bash
   npm run build
   npm start
   ```

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Arranca o bot com `tsx` (sem build) |
| `npm run build` | Compila `src/` para `dist/` com TypeScript |
| `npm start` | Executa `node dist/index.js` |
| `npm run register` | Regista/atualiza comandos slash na guild configurada |

## Comandos no Discord

- `/atualizar` — Gera ou atualiza a lista da hierarquia no canal atual (requer permissões configuradas).
- `/parar` — Remove as mensagens da lista guardadas nesse canal.

Comportamento dos cargos e limites está em `src/hierarquia/config/`.

## CI (GitHub Actions)

No repositório existe o workflow `.github/workflows/ci.yml`. Em cada push ou pull request para `main` ou `master`, o GitHub executa `npm ci` e `npm run build` para garantir que o projeto compila.

## Dados locais

O ficheiro `data/hierarchy-messages.json` (criado em runtime) guarda os IDs das mensagens da lista por canal. A pasta `data/` está no `.gitignore` e não deve ser commitada.
