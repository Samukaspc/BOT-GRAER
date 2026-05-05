const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const tscJs = path.join(raiz, "node_modules", "typescript", "lib", "tsc.js");

if (!fs.existsSync(tscJs)) {
  process.exit(0);
}

const resultado = spawnSync(process.execPath, [tscJs, "-p", "tsconfig.json"], {
  cwd: raiz,
  stdio: "inherit",
  env: process.env
});

const codigo =
  resultado.status === null || resultado.signal !== null ? 1 : resultado.status;
process.exit(codigo);
