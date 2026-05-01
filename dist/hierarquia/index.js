"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasAdminPermission = hasAdminPermission;
exports.buildHierarchyLines = buildHierarchyLines;
const util_1 = require("@discordjs/util");
const config_1 = require("./config");
function msAposRateLimitMembros(erro) {
    if (typeof erro === "object" && erro !== null && "data" in erro) {
        const dados = erro.data;
        if (typeof dados?.retry_after === "number") {
            return Math.ceil(dados.retry_after * 1000) + 400;
        }
    }
    const texto = erro instanceof Error ? erro.message : "";
    const achado = /Retry after ([\d.]+)/i.exec(texto);
    if (achado) {
        return Math.ceil(parseFloat(achado[1]) * 1000) + 400;
    }
    return 16000;
}
function esperar({ ms }) {
    return new Promise((resolver) => {
        setTimeout(resolver, ms);
    });
}
async function fetchTodosMembros({ servidor }) {
    const limite = 10;
    let tentativa = 0;
    while (tentativa < limite) {
        try {
            return await servidor.members.fetch();
        }
        catch (erro) {
            const ehLimite = erro instanceof util_1.GatewayRateLimitError ||
                (erro instanceof Error && erro.message.includes("rate limited"));
            if (!ehLimite || tentativa === limite - 1) {
                throw erro;
            }
            tentativa += 1;
            await esperar({ ms: msAposRateLimitMembros(erro) });
        }
    }
    throw new Error("fetch membros");
}
function formatarVagas({ atual, maximo }) {
    return `${String(atual).padStart(2, "0")}/${String(maximo).padStart(2, "0")}`;
}
function membroSoEstagiarioSemCargoHierarquia(membro) {
    if (!membro.roles.cache.has(config_1.ROLES.ESTAGIARIO)) {
        return false;
    }
    return !config_1.HIERARCHY.some((roleId) => membro.roles.cache.has(roleId));
}
function hasAdminPermission({ membro, idsUsuariosPermitidos }) {
    if (idsUsuariosPermitidos.includes(membro.id)) {
        return true;
    }
    return config_1.ADMIN_ROLES.some((roleId) => membro.roles.cache.has(roleId));
}
async function buildHierarchyLines({ servidor }) {
    await servidor.roles.fetch();
    const members = await fetchTodosMembros({ servidor });
    const grouped = new Map();
    for (const roleId of config_1.HIERARCHY) {
        grouped.set(roleId, []);
    }
    for (const member of members.values()) {
        if (member.user.bot) {
            continue;
        }
        for (const roleId of config_1.HIERARCHY) {
            if (!member.roles.cache.has(roleId)) {
                continue;
            }
            if (member.roles.cache.has(config_1.ROLES.PRE_GRAER_D) &&
                (roleId === config_1.ROLES.PILOTO_GRAER ||
                    roleId === config_1.ROLES.CURSO_BREVE_GRAER ||
                    roleId === config_1.ROLES.CURSO_ATIRADO_GRAER)) {
                continue;
            }
            const list = grouped.get(roleId);
            if (list) {
                list.push(member);
            }
        }
    }
    const lines = [];
    lines.push(config_1.HIERARCHY_HEADER);
    lines.push("");
    for (const roleId of [...config_1.HIERARCHY].reverse()) {
        const grupo = grouped.get(roleId) ?? [];
        grupo.sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR", { sensitivity: "base" }));
        const maxVagas = config_1.ROLE_LIMITS[roleId] ?? 99;
        const vagas = formatarVagas({ atual: grupo.length, maximo: maxVagas });
        lines.push(`# <@&${roleId}> (${vagas})`);
        lines.push("");
        if (grupo.length === 0) {
            lines.push("_Nenhum membro neste nível._");
        }
        else {
            for (const membro of grupo) {
                lines.push(`<@${membro.id}>`);
            }
        }
        lines.push("");
        if (roleId === config_1.ROLES.CURSO_ATIRADO_GRAER) {
            const estagiarios = [...members.values()]
                .filter((m) => !m.user.bot && membroSoEstagiarioSemCargoHierarquia(m))
                .sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR", { sensitivity: "base" }));
            const maxEst = config_1.ROLE_LIMITS[config_1.ROLES.ESTAGIARIO] ?? 99;
            const vagasEst = formatarVagas({
                atual: estagiarios.length,
                maximo: maxEst
            });
            lines.push(`# <@&${config_1.ROLES.ESTAGIARIO}> (${vagasEst})`);
            lines.push("");
            if (estagiarios.length === 0) {
                lines.push("_Nenhum membro neste nível._");
            }
            else {
                for (const membro of estagiarios) {
                    lines.push(`<@${membro.id}>`);
                }
            }
            lines.push("");
        }
    }
    const dataAtual = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit"
    });
    lines.push("```");
    lines.push(`Atualizado ${dataAtual}`);
    lines.push("```");
    return lines;
}
