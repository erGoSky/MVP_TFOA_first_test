@echo off
echo Starting MVP TFOA in DEBUG MODE...
set DEBUG_SINGLE_NPC=true

cd ai-service && python main.py || echo AI SERVICE CRASHED
