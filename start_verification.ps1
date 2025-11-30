$root = "d:\prj\godot\MVP_TFOA_first_test"

Write-Host "Starting TFOA Verification Environment"

# Start AI Service (Python)
Write-Host "Launching AI Service (Port 8000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\ai-service'; python -m uvicorn main:app --port 8000 --reload"

# Wait for AI service to initialize
Start-Sleep -Seconds 3

# Start Simulation Core (Node.js)
Write-Host "Launching Simulation Core..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\simulation-core'; npx tsc; node dist/index.js"

Write-Host "Both services launched."
