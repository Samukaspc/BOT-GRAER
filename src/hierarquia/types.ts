import type { Guild, GuildMember } from "discord.js";

export type PayloadRateLimitMembros = { data: { retry_after?: number } };

export type ParametrosVerificarPermissaoAdmin = {
  membro: GuildMember;
  idsUsuariosPermitidos: readonly string[];
};

export type ParametrosMontarLinhasHierarquia = {
  servidor: Guild;
};

export type ParametrosBuscarMembrosServidor = {
  servidor: Guild;
};

export type ParametrosFormatarVagas = {
  atual: number;
  maximo: number;
};

export type ParametrosEsperaMs = {
  ms: number;
};
