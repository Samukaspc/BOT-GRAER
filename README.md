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

No repositório existe o workflow `.github/workflows/ci.yml`. Em cada push ou pull request para `main` ou `master`, o GitHub corre `npm ci` (que compila via `postinstall`) e verifica se existe `dist/index.js`.

## Deploy (Vertra Cloud)

Ficheiros na raiz:

- **`vertracloud.config`** — `MAIN=dist/index.js`, `START=npm start`, Node recomendado, RAM e nome da app.
- **`package.json`** — `postinstall` corre `npm run build` no deploy. A pasta **`dist/`** está no Git para o seletor de ficheiros (ex. Vertra) e o GitHub mostrarem **`dist/index.js`**. Depois de alterares `src/`, corre `npm run build` e inclui o `dist` no commit para não ficar desatualizado.

Passos:

1. No painel da **Vertra Cloud**, define as variáveis de ambiente (iguais ao `.env`): `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, opcionalmente `TEXT_CHANNEL_ID` e `ALLOWED_USER_IDS`.
2. Deploy por **GitHub** ou **ZIP**. Não incluas `node_modules` no ZIP.
3. **Arquivo principal:** **`dist/index.js`** (ou confia no `vertracloud.config`).
4. Na primeira vez ou após mudares comandos slash, corre **`npm run register`** na tua máquina (com o mesmo `.env`) para registar os comandos na guild.

Este bot **não** abre servidor HTTP; ignora avisos genéricos sobre `PORT` típicos de tutoriais web. Se o container reiniciar em loop, vê os logs no painel (token inválido ou falta de variável são causas comuns).

## Dados locais

O ficheiro `data/hierarchy-messages.json` (criado em runtime) guarda os IDs das mensagens da lista por canal. A pasta `data/` está no `.gitignore` e não deve ser commitada.
