"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
function getEnvValue({ chave }) {
    const value = process.env[chave];
    if (!value) {
        throw new Error(`Variavel ausente: ${chave}`);
    }
    return value;
}
function getOptionalEnvValue({ nome }) {
    const value = process.env[nome];
    if (!value) {
        return null;
    }
    return value;
}
function parseDiscordUserIds({ bruto }) {
    if (!bruto) {
        return [];
    }
    return bruto
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
}
exports.env = {
    token: getEnvValue({ chave: "DISCORD_TOKEN" }),
    clientId: getEnvValue({ chave: "CLIENT_ID" }),
    guildId: getEnvValue({ chave: "GUILD_ID" }),
    textChannelId: getOptionalEnvValue({ nome: "TEXT_CHANNEL_ID" }),
    allowedUserIds: parseDiscordUserIds({
        bruto: getOptionalEnvValue({ nome: "ALLOWED_USER_IDS" })
    })
};
