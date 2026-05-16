"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hierarchyCommands = void 0;
const discord_js_1 = require("discord.js");
const aprovados_1 = require("../aprovados");
function builderAprovados() {
    const builder = new discord_js_1.SlashCommandBuilder()
        .setName("aprovados")
        .setDescription("Publica o comunicado oficial dos aprovados no Curso de Brevê GRAER");
    for (let indice = 1; indice <= aprovados_1.MAX_APROVADOS_OPCOES; indice += 1) {
        builder.addUserOption((option) => option
            .setName(`aprovado_${indice}`)
            .setDescription(`Membro aprovado ${indice}`)
            .setRequired(indice === 1));
        for (let slot = 1; slot <= aprovados_1.MAX_CARGOS_POR_APROVADO; slot += 1) {
            builder.addRoleOption((option) => option
                .setName(`cargo_${indice}_${slot}`)
                .setDescription(`Tag ${slot} do aprovado ${indice} (Piloto, Atirado, Breve...)`));
        }
    }
    return builder;
}
exports.hierarchyCommands = [
    new discord_js_1.SlashCommandBuilder()
        .setName("atualizar")
        .setDescription("Atualiza a lista da hierarquia no canal"),
    new discord_js_1.SlashCommandBuilder()
        .setName("parar")
        .setDescription("Remove as mensagens da lista deste canal"),
    builderAprovados()
].map((command) => command.toJSON());
