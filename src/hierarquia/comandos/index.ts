import { SlashCommandBuilder } from "discord.js";
import { MAX_APROVADOS_OPCOES, MAX_CARGOS_POR_APROVADO } from "../aprovados";

function builderAprovados(): SlashCommandBuilder {
  const builder = new SlashCommandBuilder()
    .setName("aprovados")
    .setDescription(
      "Publica o comunicado oficial dos aprovados no Curso de Brevê GRAER"
    );
  for (let indice = 1; indice <= MAX_APROVADOS_OPCOES; indice += 1) {
    builder.addUserOption((option) =>
      option
        .setName(`aprovado_${indice}`)
        .setDescription(`Membro aprovado ${indice}`)
        .setRequired(indice === 1)
    );
    for (let slot = 1; slot <= MAX_CARGOS_POR_APROVADO; slot += 1) {
      builder.addRoleOption((option) =>
        option
          .setName(`cargo_${indice}_${slot}`)
          .setDescription(`Tag ${slot} do aprovado ${indice} (Piloto, Atirado, Breve...)`)
      );
    }
  }
  return builder;
}

export const hierarchyCommands = [
  new SlashCommandBuilder()
    .setName("atualizar")
    .setDescription("Atualiza a lista da hierarquia no canal"),
  new SlashCommandBuilder()
    .setName("parar")
    .setDescription("Remove as mensagens da lista deste canal"),
  builderAprovados()
].map((command) => command.toJSON());
