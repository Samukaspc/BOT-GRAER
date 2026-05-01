const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const distMain = path.join(__dirname, "dist", "index.js");

if (!fs.existsSync(distMain)) {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const resultado = spawnSync(npmCmd, ["run", "build"], {
    cwd: __dirname,
    stdio: "inherit",
    env: process.env
  });
  if (resultado.error) {
    throw resultado.error;
  }
  if (resultado.status !== 0) {
    process.exit(resultado.status ?? 1);
  }
}

if (!fs.existsSync(distMain)) {
  throw new Error(`Compilacao nao gerou: ${distMain}`);
}

require(distMain);
