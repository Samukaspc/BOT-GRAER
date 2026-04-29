"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logTitulo = logTitulo;
exports.logOk = logOk;
exports.logInfo = logInfo;
exports.logAviso = logAviso;
exports.logErro = logErro;
exports.logRodape = logRodape;
const c = {
    reset: "\u001b[0m",
    bold: "\u001b[1m",
    dim: "\u001b[2m",
    gray: "\u001b[90m",
    green: "\u001b[32m",
    cyan: "\u001b[36m",
    yellow: "\u001b[33m",
    red: "\u001b[31m"
};
function hora() {
    return new Date().toLocaleTimeString("pt-BR", { hour12: false });
}
function logTitulo({ texto }) {
    const linha = "━".repeat(42);
    console.log("");
    console.log(`${c.cyan}${c.bold}${linha}${c.reset}`);
    console.log(`${c.cyan}${c.bold}  ${texto}${c.reset}`);
    console.log(`${c.cyan}${c.bold}${linha}${c.reset}`);
}
function logOk({ texto }) {
    console.log(`${c.gray}${hora()}${c.reset} ${c.green}${c.bold} OK ${c.reset} ${texto}`);
}
function logInfo({ texto }) {
    console.log(`${c.gray}${hora()}${c.reset} ${c.cyan}INF${c.reset} ${texto}`);
}
function logAviso({ texto }) {
    console.log(`${c.gray}${hora()}${c.reset} ${c.yellow}AVS${c.reset} ${texto}`);
}
function logErro({ texto }) {
    console.log(`${c.gray}${hora()}${c.reset} ${c.red}${c.bold}ERR${c.reset} ${texto}`);
}
function logRodape({ texto }) {
    console.log(`${c.gray}${hora()}${c.reset} ${c.dim}${texto}${c.reset}`);
}
