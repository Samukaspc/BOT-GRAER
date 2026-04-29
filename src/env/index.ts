import { config } from "dotenv";
import type {
  ConfigAmbiente,
  ParametrosObterEnvObrigatorio,
  ParametrosObterEnvOpcional,
  ParametrosParseIdsDiscord
} from "./types";

config();

function getEnvValue({ chave }: ParametrosObterEnvObrigatorio): string {
  const value = process.env[chave];
  if (!value) {
    throw new Error(`Variavel ausente: ${chave}`);
  }
  return value;
}

function getOptionalEnvValue({ nome }: ParametrosObterEnvOpcional): string | null {
  const value = process.env[nome];
  if (!value) {
    return null;
  }
  return value;
}

function parseDiscordUserIds({ bruto }: ParametrosParseIdsDiscord): readonly string[] {
  if (!bruto) {
    return [];
  }
  return bruto
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export const env = {
  token: getEnvValue({ chave: "DISCORD_TOKEN" }),
  clientId: getEnvValue({ chave: "CLIENT_ID" }),
  guildId: getEnvValue({ chave: "GUILD_ID" }),
  textChannelId: getOptionalEnvValue({ nome: "TEXT_CHANNEL_ID" }),
  allowedUserIds: parseDiscordUserIds({
    bruto: getOptionalEnvValue({ nome: "ALLOWED_USER_IDS" })
  })
} satisfies ConfigAmbiente;

export type { ChaveEnvObrigatoria } from "./types";
