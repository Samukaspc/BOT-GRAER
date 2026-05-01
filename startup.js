const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const distMain = path.join(__dirname, "dist", "index.js");

if (!fs.existsSync(distMain)) {
  spawnSync("bun", ["run", "build"], {
    cwd: __dirname,
    stdio: "inherit",
    env: process.env
  });
  if (!fs.existsSync(distMain)) {
    spawnSync("bun", ["x", "tsc", "-p", "tsconfig.json"], {
      cwd: __dirname,
      stdio: "inherit",
      env: process.env
    });
  }
  if (!fs.existsSync(distMain)) {
    const tscJs = path.join(__dirname, "node_modules", "typescript", "lib", "tsc.js");
    if (fs.existsSync(tscJs)) {
      spawnSync(process.execPath, [tscJs, "-p", "tsconfig.json"], {
        cwd: __dirname,
        stdio: "inherit",
        env: process.env
      });
    }
  }
  if (!fs.existsSync(distMain) && process.platform === "win32") {
    spawnSync("npm.cmd", ["run", "build"], {
      cwd: __dirname,
      stdio: "inherit",
      env: process.env
    });
  }
  if (!fs.existsSync(distMain)) {
    throw new Error(
      "Nao foi possivel gerar dist/index.js. No painel corre bun install. Envia o startup.js novo no deploy."
    );
  }
}

require(distMain);
