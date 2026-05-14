import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
  ParametrosApagarListaAnterior,
  ParametrosLimparRegistroCanal,
  ParametrosPublicarOuEditarLista,
  ParametrosSalvarIdsNovos,
  RegistroMensagensPorCanal
} from "./types";

const arquivo = join(process.cwd(), "data", "hierarchy-messages.json");

async function ler(): Promise<RegistroMensagensPorCanal> {
  try {
    const texto = await readFile(arquivo, "utf-8");
    const dados = JSON.parse(texto) as RegistroMensagensPorCanal;
    return dados;
  } catch {
    return {};
  }
}

async function gravar(dados: RegistroMensagensPorCanal): Promise<void> {
  await mkdir(dirname(arquivo), { recursive: true });
  await writeFile(arquivo, JSON.stringify(dados), "utf-8");
}

export async function apagarListaAnterior({
  client,
  canal,
  idCanal
}: ParametrosApagarListaAnterior): Promise<void> {
  const dados = await ler();
  const ids = dados[idCanal];
  if (!ids?.length) {
    return;
  }
  for (const idMensagem of ids) {
    try {
      const mensagem = await canal.messages.fetch(idMensagem);
      if (mensagem.author.id === client.user?.id) {
        await mensagem.delete();
      }
    } catch {
    }
  }
}

export async function salvarIdsNovos({
  idCanal,
  idsMensagens
}: ParametrosSalvarIdsNovos): Promise<void> {
  const dados = await ler();
  dados[idCanal] = idsMensagens;
  await gravar(dados);
}

export async function publicarOuEditarLista({
  client,
  canal,
  idCanal,
  partes
}: ParametrosPublicarOuEditarLista): Promise<void> {
  const dados = await ler();
  const idsAntigos = dados[idCanal] ?? [];
  const idsNovos: string[] = [];

  for (let indice = 0; indice < partes.length; indice += 1) {
    let alterado = false;
    const idAntigo = idsAntigos[indice];
    if (idAntigo) {
      try {
        const mensagem = await canal.messages.fetch(idAntigo);
        if (mensagem.author.id === client.user?.id) {
          await mensagem.edit({ content: partes[indice] });
          idsNovos.push(mensagem.id);
          alterado = true;
        }
      } catch {
      }
    }
    if (!alterado) {
      const enviada = await canal.send({ content: partes[indice] });
      idsNovos.push(enviada.id);
    }
  }

  for (
    let indice = partes.length;
    indice < idsAntigos.length;
    indice += 1
  ) {
    const idAntigo = idsAntigos[indice];
    try {
      const mensagem = await canal.messages.fetch(idAntigo);
      if (mensagem.author.id === client.user?.id) {
        await mensagem.delete();
      }
    } catch {
    }
  }

  dados[idCanal] = idsNovos;
  await gravar(dados);
}

export async function limparRegistroCanal({
  idCanal
}: ParametrosLimparRegistroCanal): Promise<void> {
  const dados = await ler();
  delete dados[idCanal];
  await gravar(dados);
}
