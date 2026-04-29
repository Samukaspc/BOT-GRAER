import type { ParametrosLogTexto } from "./types";

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

function hora(): string {
  return new Date().toLocaleTimeString("pt-BR", { hour12: false });
}

export function logTitulo({ texto }: ParametrosLogTexto): void {
  const linha = "━".repeat(42);
  console.log("");
  console.log(`${c.cyan}${c.bold}${linha}${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ${texto}${c.reset}`);
  console.log(`${c.cyan}${c.bold}${linha}${c.reset}`);
}

export function logOk({ texto }: ParametrosLogTexto): void {
  console.log(`${c.gray}${hora()}${c.reset} ${c.green}${c.bold} OK ${c.reset} ${texto}`);
}

export function logInfo({ texto }: ParametrosLogTexto): void {
  console.log(`${c.gray}${hora()}${c.reset} ${c.cyan}INF${c.reset} ${texto}`);
}

export function logAviso({ texto }: ParametrosLogTexto): void {
  console.log(`${c.gray}${hora()}${c.reset} ${c.yellow}AVS${c.reset} ${texto}`);
}

export function logErro({ texto }: ParametrosLogTexto): void {
  console.log(`${c.gray}${hora()}${c.reset} ${c.red}${c.bold}ERR${c.reset} ${texto}`);
}

export function logRodape({ texto }: ParametrosLogTexto): void {
  console.log(`${c.gray}${hora()}${c.reset} ${c.dim}${texto}${c.reset}`);
}
