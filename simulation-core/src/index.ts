import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { WorldManager } from './world';
import { initializeTestWorld } from './world-initializer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const world = new WorldManager();

// Initialize the world
initializeTestWorld(world);

// Simulation control state
let simulationPaused = false;
let tickRateMultiplier = 1; // 1x, 2x, 4x, 8x, 16x
const BASE_TICK_RATE = 1000; // 1 second
let simulationInterval: NodeJS.Timeout | null = null;

function startSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }
  
  const tickRate = BASE_TICK_RATE / tickRateMultiplier;
  simulationInterval = setInterval(() => {
    if (!simulationPaused) {
      world.tick();
    }
  }, tickRate);
}

// Start the simulation loop
startSimulation();

app.use(express.json());
// Use path.join to correctly resolve the public directory
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/map.html'));
});

app.get('/state', (req, res) => {
  res.json(world.getState());
});

// Simulation control endpoints
app.post('/simulation/pause', (req, res) => {
  simulationPaused = true;
  res.json({ paused: simulationPaused, speed: tickRateMultiplier });
});

app.post('/simulation/play', (req, res) => {
  simulationPaused = false;
  res.json({ paused: simulationPaused, speed: tickRateMultiplier });
});

app.post('/simulation/speed', (req, res) => {
  const { speed } = req.body;
  if ([1, 2, 4, 8, 16].includes(speed)) {
    tickRateMultiplier = speed;
    startSimulation(); // Restart with new tick rate
    res.json({ paused: simulationPaused, speed: tickRateMultiplier });
  } else {
    res.status(400).json({ error: 'Invalid speed. Must be 1, 2, 4, 8, or 16' });
  }
});

app.get('/simulation/status', (req, res) => {
  res.json({ paused: simulationPaused, speed: tickRateMultiplier });
});

// Save/Load endpoints
app.post('/save', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    await world.saveState(filename);
    res.json({ success: true, message: `World saved as ${filename}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/load', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    await world.loadState(filename);
    res.json({ success: true, message: `World loaded from ${filename}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/saves', async (req, res) => {
  try {
    const saves = await world.getSavesList();
    res.json({ saves });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/save/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    await world.deleteSave(filename);
    res.json({ success: true, message: `Save ${filename} deleted` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
