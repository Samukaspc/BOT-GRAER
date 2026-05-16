"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_CARGOS_POR_APROVADO = exports.MAX_APROVADOS_OPCOES = void 0;
exports.montarComunicadoAprovados = montarComunicadoAprovados;
exports.coletarLinhasAprovadosInteracao = coletarLinhasAprovadosInteracao;
const config_1 = require("../config");
const MAX_APROVADOS_OPCOES = 5;
exports.MAX_APROVADOS_OPCOES = MAX_APROVADOS_OPCOES;
const MAX_CARGOS_POR_APROVADO = 4;
exports.MAX_CARGOS_POR_APROVADO = MAX_CARGOS_POR_APROVADO;
function linhaAprovado({ idUsuario, idsCargos }) {
    const mencoesCargo = idsCargos.map((id) => `<@&${id}>`).join("  ");
    if (mencoesCargo.length === 0) {
        return `<@${idUsuario}>`;
    }
    return `<@${idUsuario}>  ${mencoesCargo}`;
}
function montarComunicadoAprovados({ linhas }) {
    const relacao = linhas.map(linhaAprovado).join("\n");
    return [
        "**COMUNICADO OFICIAL – COMANDO GRAER**",
        "",
        "É com grande honra e satisfação que o Comando GRAER, no uso de suas atribuições legais, vem por meio deste anunciar oficialmente os aprovados no Curso de Brevê GRAER.",
        "",
        "Após um período intenso de instruções, treinamentos operacionais e avaliações rigorosas, os policiais abaixo demonstraram excelência, disciplina, comprometimento e preparo técnico, estando agora aptos a integrar esta unidade de elite.",
        "",
        "📜 **RELAÇÃO DE APROVADOS:**",
        relacao,
        "",
        "",
        "Parabenizamos todos os aprovados, que conquistaram, com mérito, o direito de ostentar o brevê GRAER, símbolo de coragem, dedicação e profissionalismo. Que esta nova etapa seja marcada por honra, responsabilidade e contínua evolução dentro da corporação.",
        `<@&${config_1.ROLES.MENCAO_COMUNICADO_GRAER}>`
    ].join("\n");
}
function coletarLinhasAprovadosInteracao(interaction) {
    const linhas = [];
    for (let indice = 1; indice <= MAX_APROVADOS_OPCOES; indice += 1) {
        const usuario = interaction.options.getUser(`aprovado_${indice}`);
        if (!usuario) {
            continue;
        }
        const idsCargos = [];
        for (let slot = 1; slot <= MAX_CARGOS_POR_APROVADO; slot += 1) {
            const cargo = interaction.options.getRole(`cargo_${indice}_${slot}`);
            if (cargo) {
                idsCargos.push(cargo.id);
            }
        }
        linhas.push({
            idUsuario: usuario.id,
            idsCargos: [...new Set(idsCargos)]
        });
    }
    return linhas;
}
