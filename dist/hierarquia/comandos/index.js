"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hierarchyCommands = void 0;
const discord_js_1 = require("discord.js");
exports.hierarchyCommands = [
    new discord_js_1.SlashCommandBuilder()
        .setName("atualizar")
        .setDescription("Atualiza a lista da hierarquia no canal"),
    new discord_js_1.SlashCommandBuilder()
        .setName("parar")
        .setDescription("Remove as mensagens da lista deste canal")
].map((command) => command.toJSON());
