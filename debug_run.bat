@echo off
echo Starting MVP TFOA in DEBUG MODE...
set DEBUG_SINGLE_NPC=true

echo Starting AI Service...
start "AI Service (Debug)" cmd /c "cd ai-service && python main.py || (echo AI SERVICE CRASHED & pause)"

echo Starting Simulation Core...
start "Simulation Core (Debug)" cmd /c "cd simulation-core && npm start || (echo SIMULATION CORE CRASHED & pause)"

echo Starting Client...
start "Client (Debug)" cmd /c "cd client && npm run dev || (echo CLIENT CRASHED & pause)"

echo All services started.
