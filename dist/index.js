"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const discord_js_1 = require("discord.js");
const util_1 = require("@discordjs/util");
const env_1 = require("./env");
const mensagens_1 = require("./hierarquia/mensagens");
const config_1 = require("./hierarquia/config");
const aprovados_1 = require("./hierarquia/aprovados");
const hierarquia_1 = require("./hierarquia");
const logger_1 = require("./logger");
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMembers]
});
const rawPort = process.env.PORT;
if (rawPort !== undefined && rawPort.trim().length > 0) {
    const n = Number.parseInt(rawPort, 10);
    if (!Number.isNaN(n) && n > 0) {
        (0, node_http_1.createServer)((_req, res) => {
            res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("ok");
        }).listen(n, "0.0.0.0");
    }
}
const TEMPO_LIMITE_MS = 360_000;
function comTempoLimite({ promessa, ms }) {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("tempo_esgotado")), ms);
        promessa
            .then((v) => {
            clearTimeout(t);
            resolve(v);
        })
            .catch((e) => {
            clearTimeout(t);
            reject(e);
        });
    });
}
async function editarRespostaSegura({ interaction, conteudo }) {
    try {
        await interaction.editReply({ content: conteudo });
    }
    catch {
        try {
            await interaction.followUp({
                content: conteudo,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        }
        catch {
        }
    }
}
function codigoErroDiscord({ erro }) {
    if (typeof erro !== "object" || erro === null || !("code" in erro)) {
        return undefined;
    }
    const codigo = erro.code;
    return typeof codigo === "number" ? codigo : undefined;
}
function mensagemErroParaUsuario({ erro }) {
    if (erro instanceof util_1.GatewayRateLimitError) {
        return "Discord limitou a busca de membros varias vezes. Espere um minuto e use /atualizar de novo.";
    }
    if (typeof erro === "object" && erro !== null && "status" in erro) {
        const st = erro.status;
        if (st === 429) {
            return "Discord limitou por excesso de pedidos (429). Espere um minuto e tente de novo.";
        }
    }
    const cod = codigoErroDiscord({ erro });
    if (cod === 50013) {
        return ("Discord negou permissao (50013). No canal, para o cargo do bot ative: Ver canal, Enviar mensagens, Ler historico de mensagens. Em threads ative Enviar mensagens em threads.");
    }
    if (cod === 50001) {
        return "Discord: sem acesso a este canal (50001). Verifique visibilidade do canal e do bot.";
    }
    if (cod === 50035) {
        return "Discord: conteudo invalido ou parte da mensagem muito longa (50035).";
    }
    if (cod === 30007) {
        return "Discord: limite de mensagens no canal (30007). Apague mensagens antigas ou use outro canal.";
    }
    if (cod === 429 || cod === 40062) {
        return "Discord: muitas acoes seguidas (rate limit). Espere um minuto e tente de novo.";
    }
    if (erro instanceof Error && erro.message.length > 0 && erro.message.length < 400) {
        return `Erro: ${erro.message}`;
    }
    return "Erro ao falar com o Discord. Veja o terminal onde o bot esta rodando para o log completo.";
}
function mensagemSeFaltaPermissaoLista({ guild, idCanal }) {
    const bot = guild.members.me;
    if (!bot) {
        return "O bot nao aparece no servidor. Use o link de convite com permissoes de novo.";
    }
    const perms = bot.permissionsIn(idCanal);
    const falta = [];
    if (!perms.has(discord_js_1.PermissionFlagsBits.ViewChannel)) {
        falta.push("Ver canal");
    }
    if (!perms.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
        falta.push("Enviar mensagens");
    }
    if (!perms.has(discord_js_1.PermissionFlagsBits.ReadMessageHistory)) {
        falta.push("Ler historico de mensagens");
    }
    const ref = guild.channels.cache.get(idCanal);
    const ehThread = ref?.type === discord_js_1.ChannelType.PublicThread ||
        ref?.type === discord_js_1.ChannelType.PrivateThread ||
        ref?.type === discord_js_1.ChannelType.AnnouncementThread;
    if (ehThread && !perms.has(discord_js_1.PermissionFlagsBits.SendMessagesInThreads)) {
        falta.push("Enviar mensagens em threads");
    }
    if (falta.length > 0) {
        return ("Falta permissao para o bot neste canal: " +
            falta.join(", ") +
            ". Servidor > canal > Permissoes > cargo do bot. Use /parar se quiser remover a lista do canal (ai precisa Gerenciar mensagens para apagar varias mensagens de uma vez).");
    }
    return null;
}
function chunkLines({ linhas, tamanhoMaximo }) {
    const chunks = [];
    let current = "";
    for (const line of linhas) {
        const next = current.length === 0 ? line : `${current}\n${line}`;
        if (next.length > tamanhoMaximo && current.length > 0) {
            chunks.push(current);
            current = line;
            continue;
        }
        current = next;
    }
    if (current.length > 0) {
        chunks.push(current);
    }
    return chunks;
}
async function iniciarDeferOuResponderErro({ interaction }) {
    try {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        return true;
    }
    catch {
        try {
            await interaction.reply({
                content: "Nao foi possivel abrir o comando (Discord). Tente de novo ou verifique se o bot esta online.",
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        }
        catch {
        }
        return false;
    }
}
client.on("interactionCreate", async (interaction) => {
    try {
        if (!interaction.isChatInputCommand()) {
            return;
        }
        if (!interaction.guild || !(interaction.member instanceof discord_js_1.GuildMember)) {
            await interaction.reply({
                content: "Comando disponivel apenas no servidor.",
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        const canalComandoRestrito = env_1.env.textChannelIds.length > 0 &&
            interaction.commandName !== "aprovados" &&
            !env_1.env.textChannelIds.includes(interaction.channelId);
        if (canalComandoRestrito) {
            await interaction.reply({
                content: "Esse comando so pode ser usado no canal configurado.",
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        if (!(0, hierarquia_1.hasAdminPermission)({
            membro: interaction.member,
            idsUsuariosPermitidos: env_1.env.allowedUserIds
        })) {
            await interaction.reply({
                content: "Voce nao tem permissao para esse comando.",
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        if (interaction.commandName === "atualizar") {
            const canal = interaction.channel;
            if (!canal?.isTextBased() || canal.isDMBased()) {
                await interaction.reply({
                    content: "Use o comando em um canal de texto do servidor.",
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const okDefer = await iniciarDeferOuResponderErro({ interaction });
            if (!okDefer) {
                return;
            }
            const semPerm = mensagemSeFaltaPermissaoLista({
                guild: interaction.guild,
                idCanal: canal.id
            });
            if (semPerm) {
                await editarRespostaSegura({ interaction, conteudo: semPerm });
                return;
            }
            await editarRespostaSegura({
                interaction,
                conteudo: "Montando a lista (buscando membros). Isso pode levar um minuto em servidores grandes."
            });
            let chunks;
            try {
                const lines = await comTempoLimite({
                    promessa: (0, hierarquia_1.buildHierarchyLines)({ servidor: interaction.guild }),
                    ms: TEMPO_LIMITE_MS
                });
                chunks = chunkLines({ linhas: lines, tamanhoMaximo: 1900 });
            }
            catch (erro) {
                (0, logger_1.logErro)({
                    texto: `atualizar montagem: ${erro instanceof Error ? erro.stack ?? erro.message : String(erro)}`
                });
                const msgMontagem = erro instanceof Error && erro.message === "tempo_esgotado"
                    ? "Demorou demais ao buscar membros (tempo limite). Tente de novo."
                    : `Erro ao montar a lista: ${mensagemErroParaUsuario({ erro })}`;
                await editarRespostaSegura({ interaction, conteudo: msgMontagem });
                return;
            }
            if (chunks.length === 0) {
                chunks = [
                    `${config_1.HIERARCHY_HEADER}\n\n_Lista vazia. Sem membros com os cargos configurados ou dados ainda indisponiveis._`
                ];
            }
            await editarRespostaSegura({
                interaction,
                conteudo: "Publicando ou editando as mensagens da lista neste canal..."
            });
            try {
                await (0, mensagens_1.publicarOuEditarLista)({
                    client: interaction.client,
                    canal: canal,
                    idCanal: canal.id,
                    partes: chunks
                });
                await editarRespostaSegura({
                    interaction,
                    conteudo: "Lista da hierarquia atualizada neste canal."
                });
            }
            catch (erro) {
                (0, logger_1.logErro)({
                    texto: `atualizar canal: ${erro instanceof Error ? erro.stack ?? erro.message : String(erro)}`
                });
                await editarRespostaSegura({
                    interaction,
                    conteudo: `Erro ao enviar ou editar no canal: ${mensagemErroParaUsuario({ erro })}`
                });
            }
            return;
        }
        if (interaction.commandName === "aprovados") {
            const okDeferAprovados = await iniciarDeferOuResponderErro({ interaction });
            if (!okDeferAprovados) {
                return;
            }
            let canalPublicacao;
            try {
                const ref = await interaction.guild.channels.fetch(config_1.CANAL_APROVADOS);
                if (!ref?.isTextBased() || ref.isDMBased()) {
                    await editarRespostaSegura({
                        interaction,
                        conteudo: "Canal de comunicados de aprovados nao encontrado ou invalido."
                    });
                    return;
                }
                canalPublicacao = ref;
            }
            catch (erro) {
                (0, logger_1.logErro)({
                    texto: `aprovados canal: ${erro instanceof Error ? erro.stack ?? erro.message : String(erro)}`
                });
                await editarRespostaSegura({
                    interaction,
                    conteudo: "Nao foi possivel acessar o canal de comunicados de aprovados."
                });
                return;
            }
            const semPermAprovados = mensagemSeFaltaPermissaoLista({
                guild: interaction.guild,
                idCanal: canalPublicacao.id
            });
            if (semPermAprovados) {
                await editarRespostaSegura({ interaction, conteudo: semPermAprovados });
                return;
            }
            const linhasAprovados = (0, aprovados_1.coletarLinhasAprovadosInteracao)(interaction);
            if (linhasAprovados.length === 0) {
                await editarRespostaSegura({
                    interaction,
                    conteudo: "Informe ao menos um aprovado (aprovado_1)."
                });
                return;
            }
            const comunicado = (0, aprovados_1.montarComunicadoAprovados)({ linhas: linhasAprovados });
            if (comunicado.length > 2000) {
                await editarRespostaSegura({
                    interaction,
                    conteudo: "O comunicado ficou longo demais para uma mensagem do Discord (limite 2000 caracteres). Use menos aprovados por vez."
                });
                return;
            }
            try {
                await canalPublicacao.send({ content: comunicado });
                await editarRespostaSegura({
                    interaction,
                    conteudo: `Comunicado oficial publicado em <#${config_1.CANAL_APROVADOS}>.`
                });
            }
            catch (erro) {
                (0, logger_1.logErro)({
                    texto: `aprovados: ${erro instanceof Error ? erro.stack ?? erro.message : String(erro)}`
                });
                await editarRespostaSegura({
                    interaction,
                    conteudo: `Erro ao publicar comunicado: ${mensagemErroParaUsuario({ erro })}`
                });
            }
            return;
        }
        if (interaction.commandName === "parar") {
            const canal = interaction.channel;
            if (!canal?.isTextBased() || canal.isDMBased()) {
                await interaction.reply({
                    content: "Use o comando em um canal de texto do servidor.",
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const okDeferParar = await iniciarDeferOuResponderErro({ interaction });
            if (!okDeferParar) {
                return;
            }
            const semPermParar = mensagemSeFaltaPermissaoLista({
                guild: interaction.guild,
                idCanal: canal.id
            });
            if (semPermParar) {
                await editarRespostaSegura({ interaction, conteudo: semPermParar });
                return;
            }
            try {
                await (0, mensagens_1.apagarListaAnterior)({
                    client: interaction.client,
                    canal,
                    idCanal: canal.id
                });
                await (0, mensagens_1.limparRegistroCanal)({ idCanal: canal.id });
                await editarRespostaSegura({
                    interaction,
                    conteudo: "Mensagens da lista foram removidas deste canal."
                });
            }
            catch (erro) {
                (0, logger_1.logErro)({
                    texto: `parar: ${erro instanceof Error ? erro.stack ?? erro.message : String(erro)}`
                });
                await editarRespostaSegura({
                    interaction,
                    conteudo: `Erro ao remover lista: ${mensagemErroParaUsuario({ erro })}`
                });
            }
        }
    }
    catch {
        try {
            if (interaction.isChatInputCommand()) {
                if (interaction.deferred || interaction.replied) {
                    await interaction
                        .editReply({
                        content: "Erro interno ao processar o comando. Tente de novo."
                    })
                        .catch(() => { });
                }
                else {
                    await interaction
                        .reply({
                        content: "Erro interno ao processar o comando. Tente de novo.",
                        flags: discord_js_1.MessageFlags.Ephemeral
                    })
                        .catch(() => { });
                }
            }
        }
        catch {
        }
    }
});
client.once(discord_js_1.Events.ClientReady, (readyClient) => {
    (0, logger_1.logTitulo)({ texto: "Bot Hierarquia · Discord" });
    (0, logger_1.logOk)({ texto: `Conectado como ${readyClient.user.tag}` });
    (0, logger_1.logInfo)({ texto: `Servidor configurado: ${env_1.env.guildId}` });
    if (env_1.env.textChannelIds.length > 0) {
        (0, logger_1.logInfo)({
            texto: `Canais de comandos (/atualizar, /parar): ${env_1.env.textChannelIds.join(", ")}`
        });
    }
    (0, logger_1.logRodape)({ texto: "Use /atualizar no Discord ou Ctrl+C aqui para encerrar." });
    console.log("");
});
void client.login(env_1.env.token);
