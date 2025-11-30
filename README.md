# TFOA Simulation Engine

> A complex, persistent RPG world simulation driven by Utility AI and Goal-Oriented Action Planning (GOAP).

## 📖 Overview

**TFOA Simulation Engine** is a modular, full-stack simulation platform designed to model a living, breathing RPG world. Unlike static game environments, TFOA features autonomous NPCs that make decisions based on a hierarchy of needs (hunger, energy, social), economic incentives, and long-term goals.

The project is split into three core components:
1.  **Simulation Core (Node.js/TypeScript):** Manages the world state, entity lifecycle, and time progression.
2.  **AI Service (Python/FastAPI):** A dedicated brain for NPCs, calculating utility scores and generating complex action plans using GOAP.
3.  **Client (React/Vite):** A visual dashboard for observing the world, inspecting entities, and controlling the simulation flow.

## ✨ Features

*   **🧠 Advanced NPC AI:** Characters use Utility Theory to weigh options (e.g., "Should I eat or sleep?") and GOAP to execute complex sequences of actions.
*   **🌍 Persistent World:** Complete save/load functionality allows the world state to be serialized to JSON and persisted.
*   **💰 Dynamic Economy:** NPCs engage in work, trade, and resource gathering based on market value and personal wealth.
*   **🏗️ Entity Management:** Support for diverse entities including NPCs, resources (trees, ores), and buildings.
*   **⚡ Real-time Control:** Pause, play, and adjust simulation speed (up to 16x) on the fly.
*   **🗺️ Interactive Map:** Visual representation of the world grid and entity positions.

## ⚙️ Tech Stack

**Backend & Core**
*   ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white) **TypeScript** - Type-safe logic.
*   ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white) **Node.js & Express** - Server framework.
*   ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white) **PostgreSQL** - Data persistence.
*   ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white) **Redis** - High-performance caching.

**AI Service**
*   ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) **Python 3** - AI logic.
*   ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) **FastAPI** - High-performance API.
*   ![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white) **NumPy & Pandas** - Data analysis and calculation.

**Frontend**
*   ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) **React** - UI Library.
*   ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) **Vite** - Next Generation Frontend Tooling.
*   ![Sass](https://img.shields.io/badge/Sass-CC6699?style=flat-square&logo=sass&logoColor=white) **Sass** - CSS Pre-processor.

**Infrastructure**
*   ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) **Docker Compose** - Container orchestration.

## 📦 Getting Started

### Prerequisites
*   **Node.js** (v18+)
*   **Python** (v3.9+)
*   **Docker Desktop** (running)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/MVP_TFOA.git
    cd MVP_TFOA_first_test
    ```

2.  **Start Infrastructure (DB & Redis):**
    ```bash
    docker-compose up -d
    ```

3.  **Setup Simulation Core:**
    ```bash
    cd simulation-core
    npm install
    ```

4.  **Setup Client:**
    ```bash
    cd client
    npm install
    ```

5.  **Setup AI Service:**
    ```bash
    cd ../../ai-service
    # Recommended: Create a virtual environment
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # Linux/Mac
    source .venv/bin/activate
    
    pip install -r requirements.txt
    ```

### Running the Project

You will need to run these services in separate terminals:

**Terminal 1: Simulation Core**
```bash
cd simulation-core
npm start
```
*Server runs on `http://localhost:3000`*

**Terminal 2: AI Service**
```bash
cd ai-service
# Ensure venv is activated
python main.py
```
*AI Service runs on `http://localhost:8000`*

**Terminal 3: Client**
```bash
cd simulation-core/client
npm run dev
```
*Client runs on `http://localhost:5173` (check console output)*

## 💡 Usage Examples

### Controlling the Simulation via API

You can interact directly with the simulation core using HTTP requests.

**Pause the Simulation:**
```bash
curl -X POST http://localhost:3000/simulation/pause
```

**Set Speed to 4x:**
```bash
curl -X POST http://localhost:3000/simulation/speed \
  -H "Content-Type: application/json" \
  -d '{"speed": 4}'
```

**Generate a New World:**
```bash
curl -X POST http://localhost:3000/world/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

### AI Utility Calculation
The AI service exposes endpoints to calculate the best action for an NPC.

**Request:**
```json
POST http://localhost:8000/calculate_utility
{
  "npc": {
    "id": "npc_1",
    "name": "John",
    "needs": { "hunger": 0.8, "energy": 0.5, "social": 0.2 },
    "stats": { "health": 100, "money": 50 },
    "skills": {},
    "inventory": [],
    "currentAction": null
  },
  "options": [
    { "name": "Eat Apple", "type": "eat", "params": {} },
    { "name": "Sleep", "type": "sleep", "params": {} }
  ]
}
```

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
