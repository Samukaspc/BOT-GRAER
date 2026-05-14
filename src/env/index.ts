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
  let s = bruto.trim();
  if (s.length === 0) {
    return [];
  }
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) {
        const ids = parsed
          .map((id) => String(id).trim())
          .filter((part) => part.length > 0 && /^\d+$/.test(part));
        if (ids.length > 0) {
          return ids;
        }
      }
    } catch {}
    s = s.slice(1, -1).trim();
  }
  return s
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && /^\d+$/.test(part));
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
