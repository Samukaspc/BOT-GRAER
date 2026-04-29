import type { ChatInputCommandInteraction, Guild } from "discord.js";

export type ErroComCampoCodigo = { code: unknown };

export type ErroComCampoStatus = { status: unknown };

export type ParametrosComTempoLimite<T> = {
  promessa: Promise<T>;
  ms: number;
};

export type ParametrosEditarRespostaSegura = {
  interaction: ChatInputCommandInteraction;
  conteudo: string;
};

export type ParametrosMensagemPermissaoLista = {
  guild: Guild;
  idCanal: string;
};

export type ParametrosChunkLines = {
  linhas: string[];
  tamanhoMaximo: number;
};

export type ParametrosIniciarDefer = {
  interaction: ChatInputCommandInteraction;
};

export type ParametrosCodigoErroDiscord = {
  erro: unknown;
};

export type ParametrosMensagemErroUsuario = {
  erro: unknown;
};
