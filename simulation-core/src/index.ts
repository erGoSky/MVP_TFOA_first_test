import express from "express";
import dotenv from "dotenv";
import path from "path";
import { WorldManager } from "./world";
import { WorldGenerator } from "./world-generator";
import {
  RESOURCE_TYPES,
  RESOURCE_METADATA,
  BIOME_METADATA,
  CONTAINER_TYPES,
  WORKSTATION_TYPES,
  WORKSTATION_METADATA,
} from "./constants/entities";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Fail-fast on errors
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION:", reason);
  process.exit(1);
});

const world = new WorldManager();

// Initialize the world
const generator = new WorldGenerator(world);
generator.generate();

// Start the simulation
world.start();

app.use(express.json());
// Use path.join to correctly resolve the public directory
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/map", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/map.html"));
});

app.get("/state", (req, res) => {
  res.json(world.getState());
});

app.get("/meta/entities", (req, res) => {
  res.json({
    resourceTypes: RESOURCE_TYPES,
    resourceMetadata: RESOURCE_METADATA,
    biomeMetadata: BIOME_METADATA,
    containerTypes: CONTAINER_TYPES,
    workstationTypes: WORKSTATION_TYPES,
    workstationMetadata: WORKSTATION_METADATA,
  });
});

// Simulation control endpoints
app.post("/simulation/pause", (req, res) => {
  world.pause();
  res.json(world.getStatus());
});

app.post("/simulation/play", (req, res) => {
  world.resume();
  res.json(world.getStatus());
});

app.post("/simulation/speed", (req, res) => {
  const { speed } = req.body;
  try {
    world.setSpeed(speed);
    res.json(world.getStatus());
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/simulation/status", (req, res) => {
  res.json(world.getStatus());
});

// Save/Load endpoints
app.post("/save", async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }
    await world.saveState(filename);
    res.json({ success: true, message: `World saved as ${filename}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/load", async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }
    await world.loadState(filename);
    res.json({ success: true, message: `World loaded from ${filename}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/saves", async (req, res) => {
  try {
    const saves = await world.getSavesList();
    res.json({ saves });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/save/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    await world.deleteSave(filename);
    res.json({ success: true, message: `Save ${filename} deleted` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// World Management Endpoints
app.post("/world/generate", (req, res) => {
  try {
    const params = req.body;
    generator.generate(params);
    res.json({ success: true, message: "World generated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/world/reset", (req, res) => {
  try {
    world.reset();
    res.json({ success: true, message: "World reset" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/entity", (req, res) => {
  try {
    const { type, ...data } = req.body;

    if (type === "npc") {
      world.createNPC(data.id, data.name, data.position, data.skills);
    } else if (type === "resource") {
      world.createResource(data.id, data.resourceType, data.position, data.amount, data.properties);
    } else if (type === "building") {
      world.createBuilding(data.id, data.buildingType, data.position);
    } else {
      return res.status(400).json({ error: "Invalid entity type" });
    }

    res.json({ success: true, message: "Entity created" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/entity/:id", (req, res) => {
  try {
    const { id } = req.params;
    world.removeEntity(id);
    res.json({ success: true, message: `Entity ${id} removed` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/entity/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    world.updateEntity(id, updates);
    res.json({ success: true, message: `Entity ${id} updated` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
