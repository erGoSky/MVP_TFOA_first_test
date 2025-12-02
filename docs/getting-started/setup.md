# Project Setup Guide

## System Requirements

### Required Software
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)

### Optional
- **VSCode** - Recommended IDE with extensions:
  - `charliermarsh.ruff` - Python linting
  - `dbaeumer.vscode-eslint` - TypeScript linting
  - `esbenp.prettier-vscode` - Code formatting

---

## Installation Steps

### 1. Clone Repository
```bash
git clone <repository-url>
cd MVP_TFOA_first_test
```

### 2. Python Setup (ai-service/)

#### Create Virtual Environment
```bash
cd ai-service
python -m venv .venv
```

#### Activate Virtual Environment
**Windows (PowerShell):**
```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
.venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source .venv/bin/activate
```

#### Install Dependencies
```bash
pip install fastapi uvicorn requests ruff pytest
```

**Required Packages:**
- `fastapi>=0.104.0` - Web framework for API
- `uvicorn>=0.24.0` - ASGI server
- `requests>=2.31.0` - HTTP client
- `ruff>=0.1.0` - Linter and formatter (dev)
- `pytest>=7.4.0` - Testing framework (dev)

---

### 3. Simulation Core Setup (simulation-core/)

```bash
cd ../simulation-core
npm install
```

**Required Packages:**
- `express` - Web server
- `axios` - HTTP client
- `dotenv` - Environment variables
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `@types/node` - Node.js type definitions
- `@types/express` - Express type definitions

---

### 4. Client Setup (client/)

```bash
cd ../client
npm install
```

**Required Packages:**
- `react` - UI framework
- `react-dom` - React DOM renderer
- `react-router-dom` - Routing
- `vite` - Build tool
- `typescript` - TypeScript compiler
- `axios` - HTTP client (for debug panel)
- `@vitejs/plugin-react` - Vite React plugin
- `sass` - CSS preprocessor

**Dev Dependencies:**
- `eslint` - Linter
- `prettier` - Code formatter
- `@typescript-eslint/eslint-plugin` - TypeScript linting rules
- `@typescript-eslint/parser` - TypeScript parser for ESLint

---

## Running the Application

See [Running the Application](running.md) for detailed instructions on starting the services.

---

## Verification

### Check Python Setup
```bash
cd ai-service
python --version  # Should be 3.8+
pip list  # Should show fastapi, uvicorn, requests
ruff --version  # Should show ruff version
```

### Check Node.js Setup
```bash
node --version  # Should be 16+
npm --version
```

### Run Tests
```bash
# Python tests
cd ai-service
python -m unittest discover . "test_*.py"

# Integration tests
python test_integration_e2e.py
```

---

## Troubleshooting

### Python Issues

**"python not found"**
- Ensure Python is added to PATH during installation
- Try `python3` instead of `python`

**"Module not found"**
- Ensure virtual environment is activated (you should see `(.venv)` in terminal)
- Run `pip install -r requirements.txt` if available

### Node.js Issues

**"npm ERR! ENOENT"**
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again

**"Port already in use"**
- Kill the process using the port or change port in configuration

### Service Communication Issues

**"Failed to connect to AI service"**
- Ensure AI service is running on port 8000
- Check firewall settings
- Verify `AI_SERVICE_URL` in simulation-core `.env` file

---

## Development Workflow

### Code Quality
```bash
# Python linting
cd ai-service
ruff check .
ruff format .

# TypeScript linting (once configured)
cd client
npm run lint
npm run format
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, then commit
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature
```

---

## Environment Variables

### simulation-core/.env
```
AI_SERVICE_URL=http://localhost:8000
PORT=3001
```

### Optional Configuration
- Adjust ports if conflicts occur
- Configure database connections (if using PostgreSQL/Redis)
- Set log levels for debugging

---

## Next Steps

1. ✅ Verify all services start without errors
2. ✅ Open http://localhost:5173 and see the UI
3. ✅ Check that NPCs are making decisions (watch AI service logs)
4. 📖 Read Phase 4 documentation for GOAP system details
5. 🔧 Configure VSCode with recommended extensions
