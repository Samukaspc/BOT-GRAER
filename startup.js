const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function listarPrimeirosNomes(dir, limite) {
  try {
    return fs.readdirSync(dir).slice(0, limite).join(", ");
  } catch {
    return "(nao foi possivel ler)";
  }
}

function encontrarRaizProjeto() {
  const raizStartup = __dirname;
  const tentar = (dir) => {
    const pkg = path.join(dir, "package.json");
    const srcIdx = path.join(dir, "src", "index.ts");
    const distIdx = path.join(dir, "dist", "index.js");
    if (!fs.existsSync(pkg)) {
      return null;
    }
    if (fs.existsSync(distIdx) || fs.existsSync(srcIdx)) {
      return dir;
    }
    return null;
  };

  let atual = tentar(raizStartup);
  if (atual) {
    return atual;
  }

  let subir = raizStartup;
  for (let i = 0; i < 4; i++) {
    const pai = path.dirname(subir);
    if (pai === subir) {
      break;
    }
    atual = tentar(pai);
    if (atual) {
      return atual;
    }
    subir = pai;
  }

  try {
    const nomes = fs.readdirSync(raizStartup);
    for (const nome of nomes) {
      const sub = path.join(raizStartup, nome);
      if (!fs.statSync(sub).isDirectory()) {
        continue;
      }
      atual = tentar(sub);
      if (atual) {
        return atual;
      }
    }
  } catch {
    return raizStartup;
  }

  return raizStartup;
}

const raiz = encontrarRaizProjeto();
process.chdir(raiz);

const distMain = path.join(raiz, "dist", "index.js");
const srcIndex = path.join(raiz, "src", "index.ts");
const tscJs = path.join(raiz, "node_modules", "typescript", "lib", "tsc.js");

function compilar() {
  const bunRes = spawnSync("bun", [tscJs, "-p", "tsconfig.json"], {
    cwd: raiz,
    stdio: "inherit",
    env: process.env
  });
  if (!bunRes.error && bunRes.status === 0 && fs.existsSync(distMain)) {
    return;
  }
  spawnSync("bun", ["x", "tsc", "-p", "tsconfig.json"], {
    cwd: raiz,
    stdio: "inherit",
    env: process.env
  });
  if (fs.existsSync(distMain)) {
    return;
  }
  spawnSync("bun", ["run", "build"], {
    cwd: raiz,
    stdio: "inherit",
    env: process.env
  });
  if (fs.existsSync(distMain)) {
    return;
  }
  if (fs.existsSync(tscJs)) {
    spawnSync(process.execPath, [tscJs, "-p", "tsconfig.json"], {
      cwd: raiz,
      stdio: "inherit",
      env: process.env
    });
  }
  if (fs.existsSync(distMain)) {
    return;
  }
  if (process.platform === "win32") {
    spawnSync("npm.cmd", ["run", "build:node"], {
      cwd: raiz,
      stdio: "inherit",
      env: process.env
    });
  }
}

if (!fs.existsSync(distMain)) {
  if (!fs.existsSync(srcIndex)) {
    const extra = listarPrimeirosNomes(raiz, 40);
    const startupDir = listarPrimeirosNomes(__dirname, 40);
    throw new Error(
      `Deploy incompleto: sem dist/index.js e sem src/index.ts na raiz do projeto. Raiz usada: ${raiz}. Pastas em startup.js (${__dirname}): ${startupDir}. Pastas na raiz: ${extra}. No HidenCloud: confirma Git/ZIP com pasta src completa ou commit de dist/; se o painel extrai o repo para uma subpasta, este startup tenta deteta-la.`
    );
  }
  compilar();
}

if (!fs.existsSync(distMain)) {
  throw new Error(
    `Nao foi possivel gerar dist/index.js em ${raiz}. Corre bun install nessa pasta e verifica src/.`
  );
}

require(distMain);
