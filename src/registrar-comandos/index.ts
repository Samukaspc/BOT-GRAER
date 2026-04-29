import { DiscordAPIError, REST, Routes } from "discord.js";
import { env } from "../env";
import { hierarchyCommands } from "../hierarquia/comandos";
import { logErro, logInfo, logOk, logTitulo } from "../logger";

async function registerCommands(): Promise<void> {
  try {
    logTitulo({ texto: "Registro de comandos (slash)" });
    const rest = new REST({ version: "10" }).setToken(env.token);
    await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), {
      body: hierarchyCommands
    });
    logOk({ texto: "Comandos atualizados no servidor." });
    logInfo({ texto: `Aplicacao: ${env.clientId}` });
    logInfo({ texto: `Servidor (guild): ${env.guildId}` });
    console.log("");
  } catch (error) {
    if (error instanceof DiscordAPIError && error.code === 50001) {
      logErro({
        texto:
          "Discord API 50001: sem permissao para registrar comandos neste servidor."
      });
      logErro({
        texto:
          "Confira: bot esta no servidor, CLIENT_ID e GUILD_ID no .env estao corretos."
      });
      process.exit(1);
    }
    throw error;
  }
}

void registerCommands();
