export type ChaveEnvObrigatoria = "DISCORD_TOKEN" | "CLIENT_ID" | "GUILD_ID";

export type ParametrosObterEnvObrigatorio = {
  chave: ChaveEnvObrigatoria;
};

export type ParametrosObterEnvOpcional = {
  nome: string;
};

export type ParametrosParseIdsDiscord = {
  bruto: string | null;
};

export type ConfigAmbiente = {
  token: string;
  clientId: string;
  guildId: string;
  textChannelIds: readonly string[];
  allowedUserIds: readonly string[];
};
