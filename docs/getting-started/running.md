# Running the Application

## Start All Services

To run the full simulation, you need to start **3 services** in separate terminal windows.

### 1. AI Service (Python)
The "Brain" of the simulation. Handles decision making and planning.

```bash
cd ai-service
# Activate virtual environment if needed
# .\.venv\Scripts\Activate.ps1
python main.py
```
*Should see: `Uvicorn running on http://0.0.0.0:8000`*

### 2. Simulation Core (Node.js)
The "Engine" of the simulation. Manages the world state and NPCs.

```bash
cd simulation-core
npm start
```
*Should see: NPCs pursuing goals (e.g., "Gatherer 1 pursuing goal...")*

### 3. Client UI (Vite)
The "Interface" for visualization.

```bash
cd client
npm run dev
```
*Should see: `Local: http://localhost:5173/`*

---

## Access the Application
Open your browser to: **http://localhost:5173**

## Troubleshooting

### Service Communication Issues
**"Failed to connect to AI service"**
- Ensure AI service is running on port 8000.
- Check firewall settings.
- Verify `AI_SERVICE_URL` in `simulation-core/.env` file.

### Port Conflicts
If ports are in use:
- **AI Service**: Modify `main.py` or `.env`.
- **Simulation Core**: Modify `.env` (`PORT=3001`).
- **Client**: Vite usually auto-selects the next available port, but check console output.
