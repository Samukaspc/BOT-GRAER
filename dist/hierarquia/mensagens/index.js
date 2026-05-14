"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apagarListaAnterior = apagarListaAnterior;
exports.salvarIdsNovos = salvarIdsNovos;
exports.publicarOuEditarLista = publicarOuEditarLista;
exports.limparRegistroCanal = limparRegistroCanal;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const arquivo = (0, node_path_1.join)(process.cwd(), "data", "hierarchy-messages.json");
async function ler() {
    try {
        const texto = await (0, promises_1.readFile)(arquivo, "utf-8");
        const dados = JSON.parse(texto);
        return dados;
    }
    catch {
        return {};
    }
}
async function gravar(dados) {
    await (0, promises_1.mkdir)((0, node_path_1.dirname)(arquivo), { recursive: true });
    await (0, promises_1.writeFile)(arquivo, JSON.stringify(dados), "utf-8");
}
async function apagarListaAnterior({ client, canal, idCanal }) {
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
        }
        catch {
        }
    }
}
async function salvarIdsNovos({ idCanal, idsMensagens }) {
    const dados = await ler();
    dados[idCanal] = idsMensagens;
    await gravar(dados);
}
async function publicarOuEditarLista({ client, canal, idCanal, partes }) {
    const dados = await ler();
    const idsAntigos = dados[idCanal] ?? [];
    const idsNovos = [];
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
            }
            catch {
            }
        }
        if (!alterado) {
            const enviada = await canal.send({ content: partes[indice] });
            idsNovos.push(enviada.id);
        }
    }
    for (let indice = partes.length; indice < idsAntigos.length; indice += 1) {
        const idAntigo = idsAntigos[indice];
        try {
            const mensagem = await canal.messages.fetch(idAntigo);
            if (mensagem.author.id === client.user?.id) {
                await mensagem.delete();
            }
        }
        catch {
        }
    }
    dados[idCanal] = idsNovos;
    await gravar(dados);
}
async function limparRegistroCanal({ idCanal }) {
    const dados = await ler();
    delete dados[idCanal];
    await gravar(dados);
}
