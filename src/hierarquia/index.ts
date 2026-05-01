import { GatewayRateLimitError } from "@discordjs/util";
import { GuildMember } from "discord.js";
import {
  ADMIN_ROLES,
  HIERARCHY,
  HIERARCHY_HEADER,
  ROLE_LIMITS,
  ROLES
} from "./config";
import type {
  ParametrosBuscarMembrosServidor,
  ParametrosEsperaMs,
  ParametrosFormatarVagas,
  ParametrosMontarLinhasHierarquia,
  ParametrosVerificarPermissaoAdmin,
  PayloadRateLimitMembros
} from "./types";

function msAposRateLimitMembros(erro: unknown): number {
  if (typeof erro === "object" && erro !== null && "data" in erro) {
    const dados = (erro as PayloadRateLimitMembros).data;
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

function esperar({ ms }: ParametrosEsperaMs): Promise<void> {
  return new Promise((resolver) => {
    setTimeout(resolver, ms);
  });
}

async function fetchTodosMembros({ servidor }: ParametrosBuscarMembrosServidor) {
  const limite = 10;
  let tentativa = 0;
  while (tentativa < limite) {
    try {
      return await servidor.members.fetch();
    } catch (erro: unknown) {
      const ehLimite =
        erro instanceof GatewayRateLimitError ||
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

function formatarVagas({ atual, maximo }: ParametrosFormatarVagas): string {
  return `${String(atual).padStart(2, "0")}/${String(maximo).padStart(2, "0")}`;
}

function membroSoEstagiarioSemCargoHierarquia(membro: GuildMember): boolean {
  if (!membro.roles.cache.has(ROLES.ESTAGIARIO)) {
    return false;
  }
  return !HIERARCHY.some((roleId) => membro.roles.cache.has(roleId));
}

export function hasAdminPermission({
  membro,
  idsUsuariosPermitidos
}: ParametrosVerificarPermissaoAdmin): boolean {
  if (idsUsuariosPermitidos.includes(membro.id)) {
    return true;
  }
  return ADMIN_ROLES.some((roleId) => membro.roles.cache.has(roleId));
}

export async function buildHierarchyLines({
  servidor
}: ParametrosMontarLinhasHierarquia): Promise<string[]> {
  await servidor.roles.fetch();
  const members = await fetchTodosMembros({ servidor });
  const grouped = new Map<string, GuildMember[]>();

  for (const roleId of HIERARCHY) {
    grouped.set(roleId, []);
  }

  for (const member of members.values()) {
    if (member.user.bot) {
      continue;
    }
    for (const roleId of HIERARCHY) {
      if (!member.roles.cache.has(roleId)) {
        continue;
      }
      if (
        member.roles.cache.has(ROLES.PRE_GRAER_D) &&
        (roleId === ROLES.PILOTO_GRAER ||
          roleId === ROLES.CURSO_BREVE_GRAER ||
          roleId === ROLES.CURSO_ATIRADO_GRAER)
      ) {
        continue;
      }
      const list = grouped.get(roleId);
      if (list) {
        list.push(member);
      }
    }
  }

  const lines: string[] = [];

  lines.push(HIERARCHY_HEADER);
  lines.push("");

  for (const roleId of [...HIERARCHY].reverse()) {
    const grupo = grouped.get(roleId) ?? [];
    grupo.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "pt-BR", { sensitivity: "base" })
    );

    const maxVagas = ROLE_LIMITS[roleId] ?? 99;
    const vagas = formatarVagas({ atual: grupo.length, maximo: maxVagas });

    lines.push(`# <@&${roleId}> (${vagas})`);
    lines.push("");

    if (grupo.length === 0) {
      lines.push("_Nenhum membro neste nível._");
    } else {
      for (const membro of grupo) {
        lines.push(`<@${membro.id}>`);
      }
    }

    lines.push("");

    if (roleId === ROLES.CURSO_ATIRADO_GRAER) {
      const estagiarios = [...members.values()]
        .filter(
          (m) => !m.user.bot && membroSoEstagiarioSemCargoHierarquia(m)
        )
        .sort((a, b) =>
          a.displayName.localeCompare(b.displayName, "pt-BR", { sensitivity: "base" })
        );

      const maxEst = ROLE_LIMITS[ROLES.ESTAGIARIO] ?? 99;
      const vagasEst = formatarVagas({
        atual: estagiarios.length,
        maximo: maxEst
      });

      lines.push(`# <@&${ROLES.ESTAGIARIO}> (${vagasEst})`);
      lines.push("");

      if (estagiarios.length === 0) {
        lines.push("_Nenhum membro neste nível._");
      } else {
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
