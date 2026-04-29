import { SlashCommandBuilder } from "discord.js";

export const hierarchyCommands = [
  new SlashCommandBuilder()
    .setName("atualizar")
    .setDescription("Atualiza a lista da hierarquia no canal"),
  new SlashCommandBuilder()
    .setName("parar")
    .setDescription("Remove as mensagens da lista deste canal")
].map((command) => command.toJSON());
