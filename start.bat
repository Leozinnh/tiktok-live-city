@echo off
cd /d "%~dp0"
title NPC WORLD - TikTok LIVE 3D Interactive City
echo =======================================================
echo          NPC WORLD - CIDADE 3D PARA TIKTOK LIVE
echo =======================================================
echo.
echo [1/2] Iniciando Servidor Backend (Node.js + SQLite + WebSocket)...
start "NPC World - Backend" cmd /k "node server/index.js"

timeout /t 2 >nul

echo [2/2] Iniciando Engine 3D Frontend (Vite + Three.js PBR)...
start "NPC World - Client" cmd /k "npx vite client --port 5173"

timeout /t 3 >nul

echo Abrindo o jogo no navegador...
start http://localhost:5173

echo.
echo =======================================================
echo Tudo pronto!
echo - Acesse no navegador: http://localhost:5173
echo - Para modo OBS limpo: http://localhost:5173?mode=stream
echo - Para abrir painel de testes/admin, pressione F2 no jogo!
echo =======================================================
