import { createServer } from "node:http";
import type { GuildTextBasedChannel } from "discord.js";
import {
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  Events,
  GatewayIntentBits,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits
} from "discord.js";
import { GatewayRateLimitError } from "@discordjs/util";
import { env } from "./env";
import {
  apagarListaAnterior,
  limparRegistroCanal,
  publicarOuEditarLista
} from "./hierarquia/mensagens";
import { CANAL_APROVADOS, HIERARCHY_HEADER } from "./hierarquia/config";
import {
  coletarLinhasAprovadosInteracao,
  montarComunicadoAprovados
} from "./hierarquia/aprovados";
import { buildHierarchyLines, hasAdminPermission } from "./hierarquia";
import { logErro, logInfo, logOk, logRodape, logTitulo } from "./logger";
import type {
  ErroComCampoCodigo,
  ErroComCampoStatus,
  ParametrosChunkLines,
  ParametrosCodigoErroDiscord,
  ParametrosComTempoLimite,
  ParametrosEditarRespostaSegura,
  ParametrosIniciarDefer,
  ParametrosMensagemErroUsuario,
  ParametrosMensagemPermissaoLista
} from "./types";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const rawPort = process.env.PORT;
if (rawPort !== undefined && rawPort.trim().length > 0) {
  const n = Number.parseInt(rawPort, 10);
  if (!Number.isNaN(n) && n > 0) {
    createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");
    }).listen(n, "0.0.0.0");
  }
}

const TEMPO_LIMITE_MS = 360_000;

function comTempoLimite<T>({
  promessa,
  ms
}: ParametrosComTempoLimite<T>): Promise<T> {
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

async function editarRespostaSegura({
  interaction,
  conteudo
}: ParametrosEditarRespostaSegura): Promise<void> {
  try {
    await interaction.editReply({ content: conteudo });
  } catch {
    try {
      await interaction.followUp({
        content: conteudo,
        flags: MessageFlags.Ephemeral
      });
    } catch {
    }
  }
}

function codigoErroDiscord({ erro }: ParametrosCodigoErroDiscord): number | undefined {
  if (typeof erro !== "object" || erro === null || !("code" in erro)) {
    return undefined;
  }
  const codigo = (erro as ErroComCampoCodigo).code;
  return typeof codigo === "number" ? codigo : undefined;
}

function mensagemErroParaUsuario({ erro }: ParametrosMensagemErroUsuario): string {
  if (erro instanceof GatewayRateLimitError) {
    return "Discord limitou a busca de membros varias vezes. Espere um minuto e use /atualizar de novo.";
  }
  if (typeof erro === "object" && erro !== null && "status" in erro) {
    const st = (erro as ErroComCampoStatus).status;
    if (st === 429) {
      return "Discord limitou por excesso de pedidos (429). Espere um minuto e tente de novo.";
    }
  }
  const cod = codigoErroDiscord({ erro });
  if (cod === 50013) {
    return (
      "Discord negou permissao (50013). No canal, para o cargo do bot ative: Ver canal, Enviar mensagens, Ler historico de mensagens. Em threads ative Enviar mensagens em threads."
    );
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

function mensagemSeFaltaPermissaoLista({
  guild,
  idCanal
}: ParametrosMensagemPermissaoLista): string | null {
  const bot = guild.members.me;
  if (!bot) {
    return "O bot nao aparece no servidor. Use o link de convite com permissoes de novo.";
  }
  const perms = bot.permissionsIn(idCanal);
  const falta: string[] = [];
  if (!perms.has(PermissionFlagsBits.ViewChannel)) {
    falta.push("Ver canal");
  }
  if (!perms.has(PermissionFlagsBits.SendMessages)) {
    falta.push("Enviar mensagens");
  }
  if (!perms.has(PermissionFlagsBits.ReadMessageHistory)) {
    falta.push("Ler historico de mensagens");
  }
  const ref = guild.channels.cache.get(idCanal);
  const ehThread =
    ref?.type === ChannelType.PublicThread ||
    ref?.type === ChannelType.PrivateThread ||
    ref?.type === ChannelType.AnnouncementThread;
  if (ehThread && !perms.has(PermissionFlagsBits.SendMessagesInThreads)) {
    falta.push("Enviar mensagens em threads");
  }
  if (falta.length > 0) {
    return (
      "Falta permissao para o bot neste canal: " +
      falta.join(", ") +
      ". Servidor > canal > Permissoes > cargo do bot. Use /parar se quiser remover a lista do canal (ai precisa Gerenciar mensagens para apagar varias mensagens de uma vez)."
    );
  }
  return null;
}

function chunkLines({ linhas, tamanhoMaximo }: ParametrosChunkLines): string[] {
  const chunks: string[] = [];
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

async function iniciarDeferOuResponderErro({
  interaction
}: ParametrosIniciarDefer): Promise<boolean> {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    return true;
  } catch {
    try {
      await interaction.reply({
        content:
          "Nao foi possivel abrir o comando (Discord). Tente de novo ou verifique se o bot esta online.",
        flags: MessageFlags.Ephemeral
      });
    } catch {
    }
    return false;
  }
}

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    if (!interaction.guild || !(interaction.member instanceof GuildMember)) {
      await interaction.reply({
        content: "Comando disponivel apenas no servidor.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const canalComandoRestrito =
      env.textChannelIds.length > 0 &&
      interaction.commandName !== "aprovados" &&
      !env.textChannelIds.includes(interaction.channelId);
    if (canalComandoRestrito) {
      await interaction.reply({
        content: "Esse comando so pode ser usado no canal configurado.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (
      !hasAdminPermission({
        membro: interaction.member,
        idsUsuariosPermitidos: env.allowedUserIds
      })
    ) {
      await interaction.reply({
        content: "Voce nao tem permissao para esse comando.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (interaction.commandName === "atualizar") {
      const canal = interaction.channel;
      if (!canal?.isTextBased() || canal.isDMBased()) {
        await interaction.reply({
          content: "Use o comando em um canal de texto do servidor.",
          flags: MessageFlags.Ephemeral
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
        conteudo:
          "Montando a lista (buscando membros). Isso pode levar um minuto em servidores grandes."
      });

      let chunks: string[];
      try {
        const lines = await comTempoLimite({
          promessa: buildHierarchyLines({ servidor: interaction.guild }),
          ms: TEMPO_LIMITE_MS
        });
        chunks = chunkLines({ linhas: lines, tamanhoMaximo: 1900 });
      } catch (erro: unknown) {
        logErro({
          texto: `atualizar montagem: ${erro instanceof Error ? erro.stack ?? erro.message : String(erro)}`
        });
        const msgMontagem =
          erro instanceof Error && erro.message === "tempo_esgotado"
            ? "Demorou demais ao buscar membros (tempo limite). Tente de novo."
            : `Erro ao montar a lista: ${mensagemErroParaUsuario({ erro })}`;
        await editarRespostaSegura({ interaction, conteudo: msgMontagem });
        return;
      }

      if (chunks.length === 0) {
        chunks = [
          `${HIERARCHY_HEADER}\n\n_Lista vazia. Sem membros com os cargos configurados ou dados ainda indisponiveis._`
        ];
      }

      await editarRespostaSegura({
        interaction,
        conteudo: "Publicando ou editando as mensagens da lista neste canal..."
      });

      try {
        await publicarOuEditarLista({
          client: interaction.client,
          canal: canal as GuildTextBasedChannel,
          idCanal: canal.id,
          partes: chunks
        });

        await editarRespostaSegura({
          interaction,
          conteudo: "Lista da hierarquia atualizada neste canal."
        });
      } catch (erro: unknown) {
        logErro({
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

      let canalPublicacao: GuildTextBasedChannel;
      try {
        const ref = await interaction.guild.channels.fetch(CANAL_APROVADOS);
        if (!ref?.isTextBased() || ref.isDMBased()) {
          await editarRespostaSegura({
            interaction,
            conteudo: "Canal de comunicados de aprovados nao encontrado ou invalido."
          });
          return;
        }
        canalPublicacao = ref as GuildTextBasedChannel;
      } catch (erro: unknown) {
        logErro({
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

      const linhasAprovados = coletarLinhasAprovadosInteracao(interaction);
      if (linhasAprovados.length === 0) {
        await editarRespostaSegura({
          interaction,
          conteudo: "Informe ao menos um aprovado (aprovado_1)."
        });
        return;
      }
      const comunicado = montarComunicadoAprovados({ linhas: linhasAprovados });

      if (comunicado.length > 2000) {
        await editarRespostaSegura({
          interaction,
          conteudo:
            "O comunicado ficou longo demais para uma mensagem do Discord (limite 2000 caracteres). Use menos aprovados por vez."
        });
        return;
      }

      try {
        await canalPublicacao.send({ content: comunicado });
        await editarRespostaSegura({
          interaction,
          conteudo: `Comunicado oficial publicado em <#${CANAL_APROVADOS}>.`
        });
      } catch (erro: unknown) {
        logErro({
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
          flags: MessageFlags.Ephemeral
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
        await apagarListaAnterior({
          client: interaction.client,
          canal,
          idCanal: canal.id
        });
        await limparRegistroCanal({ idCanal: canal.id });
        await editarRespostaSegura({
          interaction,
          conteudo: "Mensagens da lista foram removidas deste canal."
        });
      } catch (erro: unknown) {
        logErro({
          texto: `parar: ${erro instanceof Error ? erro.stack ?? erro.message : String(erro)}`
        });
        await editarRespostaSegura({
          interaction,
          conteudo: `Erro ao remover lista: ${mensagemErroParaUsuario({ erro })}`
        });
      }
    }
  } catch {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.deferred || interaction.replied) {
          await interaction
            .editReply({
              content: "Erro interno ao processar o comando. Tente de novo."
            })
            .catch(() => {});
        } else {
          await interaction
            .reply({
              content: "Erro interno ao processar o comando. Tente de novo.",
              flags: MessageFlags.Ephemeral
            })
            .catch(() => {});
        }
      }
    } catch {
    }
  }
});

client.once(Events.ClientReady, (readyClient) => {
  logTitulo({ texto: "Bot Hierarquia · Discord" });
  logOk({ texto: `Conectado como ${readyClient.user.tag}` });
  logInfo({ texto: `Servidor configurado: ${env.guildId}` });
  if (env.textChannelIds.length > 0) {
    logInfo({
      texto: `Canais de comandos (/atualizar, /parar): ${env.textChannelIds.join(", ")}`
    });
  }
  logRodape({ texto: "Use /atualizar no Discord ou Ctrl+C aqui para encerrar." });
  console.log("");
});

void client.login(env.token);
