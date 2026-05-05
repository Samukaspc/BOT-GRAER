const fs = require("fs");
const path = require("path");

function listarTs(dir, acc) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const nome of fs.readdirSync(dir)) {
    const p = path.join(dir, nome);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      listarTs(p, acc);
    } else if (p.endsWith(".ts")) {
      acc.push(p);
    }
  }
}

const raiz = path.join(__dirname, "..");
const srcDir = path.join(raiz, "src");
const ficheiros = [];
listarTs(srcDir, ficheiros);

if (ficheiros.length === 0) {
  console.error(
    "verify-deploy: src/ em falta ou sem ficheiros .ts — o deploy para HidenCloud deve incluir a pasta src completa."
  );
  process.exit(1);
}

console.log(`verify-deploy: ok (${ficheiros.length} ficheiros .ts em src/)`);
process.exit(0);
