"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const env_1 = require("../env");
const comandos_1 = require("../hierarquia/comandos");
const logger_1 = require("../logger");
async function registerCommands() {
    try {
        (0, logger_1.logTitulo)({ texto: "Registro de comandos (slash)" });
        const rest = new discord_js_1.REST({ version: "10" }).setToken(env_1.env.token);
        await rest.put(discord_js_1.Routes.applicationGuildCommands(env_1.env.clientId, env_1.env.guildId), {
            body: comandos_1.hierarchyCommands
        });
        (0, logger_1.logOk)({ texto: "Comandos atualizados no servidor." });
        (0, logger_1.logInfo)({ texto: `Aplicacao: ${env_1.env.clientId}` });
        (0, logger_1.logInfo)({ texto: `Servidor (guild): ${env_1.env.guildId}` });
        console.log("");
    }
    catch (error) {
        if (error instanceof discord_js_1.DiscordAPIError && error.code === 50001) {
            (0, logger_1.logErro)({
                texto: "Discord API 50001: sem permissao para registrar comandos neste servidor."
            });
            (0, logger_1.logErro)({
                texto: "Confira: bot esta no servidor, CLIENT_ID e GUILD_ID no .env estao corretos."
            });
            process.exit(1);
        }
        throw error;
    }
}
void registerCommands();
