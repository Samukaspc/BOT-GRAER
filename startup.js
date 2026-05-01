const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const distMain = path.join(__dirname, "dist", "index.js");

if (!fs.existsSync(distMain)) {
  let ok = false;
  const bunRes = spawnSync("bun", ["run", "build"], {
    cwd: __dirname,
    stdio: "inherit",
    env: process.env
  });
  if (!bunRes.error && bunRes.status === 0) {
    ok = true;
  }
  if (!ok) {
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    const npmRes = spawnSync(npmCmd, ["run", "build"], {
      cwd: __dirname,
      stdio: "inherit",
      env: process.env
    });
    if (!npmRes.error && npmRes.status === 0) {
      ok = true;
    }
  }
  if (!fs.existsSync(distMain)) {
    throw new Error(
      `Nao foi possivel gerar dist/index.js. No painel use instalacao: bun install (ou npm install). Depois teste: bun run build`
    );
  }
}

require(distMain);
