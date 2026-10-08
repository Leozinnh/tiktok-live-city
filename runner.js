import { spawn } from 'node:child_process';

console.log('=======================================================');
echoHeader();
console.log('Iniciando Servidor Backend (Porta 3000) e Vite Frontend (Porta 5173)...');
console.log('=======================================================\n');

function echoHeader() {
  console.log('🌆 NPC WORLD - TikTok LIVE 3D Interactive Simulation');
}

const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';
const nodeCmd = isWin ? 'node.exe' : 'node';

// 1. Iniciar Servidor Backend
const serverProc = spawn(nodeCmd, ['server/index.js'], {
  stdio: 'inherit',
  shell: isWin
});

// 2. Iniciar Vite Frontend
const clientProc = spawn(npxCmd, ['vite', 'client', '--port', '5173'], {
  stdio: 'inherit',
  shell: isWin
});

function cleanup() {
  console.log('\n[NPC WORLD] Encerrando processos...');
  try {
    serverProc.kill();
    clientProc.kill();
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
