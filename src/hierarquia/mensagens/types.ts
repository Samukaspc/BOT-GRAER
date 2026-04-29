import type { Client, GuildTextBasedChannel, TextBasedChannel } from "discord.js";

export type RegistroMensagensPorCanal = Record<string, string[]>;

export type ParametrosApagarListaAnterior = {
  client: Client;
  canal: TextBasedChannel;
  idCanal: string;
};

export type ParametrosPublicarOuEditarLista = {
  client: Client;
  canal: GuildTextBasedChannel;
  idCanal: string;
  partes: string[];
};

export type ParametrosSalvarIdsNovos = {
  idCanal: string;
  idsMensagens: string[];
};

export type ParametrosLimparRegistroCanal = {
  idCanal: string;
};
