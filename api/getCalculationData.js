import path from 'path';
import { promises as fs } from 'fs';

// ===== In-memory data cache =====
let cachedData = null;
async function loadData() {
  if (!cachedData) {
    const filePath = path.resolve(process.cwd(), './data/data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    cachedData = JSON.parse(fileContents);
  }
  return cachedData;
}

// ===== Main API handler =====
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "https://openstead.webflow.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  try {
    const { surface, location } = req.body;

    // Manual validation
    if (
       isNaN(surface) || surface <= 0 || location.trim() === ''
    ) {
      return res.status(400).json({ error: "Invalid input. 'surface' must be a positive number and 'location' must be a non-empty string." });
    }

    const data = await loadData();
    const entry = data.find(item => item.location === location);
    if (!entry) {
      return res.status(404).json({ error: `Location '${location}' not found.` });
    }

    // Perform calculations
    const floodingVolume = calculateFloodingVolume(surface, entry);
    const oneTimeImpact = calculateOneTimeImpact(floodingVolume, entry);
    const underusedLand = calculateUnderusedLand(surface);

    // Return result
    return res.status(200).json({
      floodingVolume,
      oneTimeImpact,
      underusedLand
    });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ===== Calculation Functions =====

function calculateFloodingVolume(surface, entry) {
  const { baselineFloodRisk, projected2050Increase } = entry;
  return baselineFloodRisk * surface * (1 + projected2050Increase);
}

function calculateOneTimeImpact(floodingVolume, entry) {
  const { damageCostFactor, disruptionCostFactor } = entry;
  return floodingVolume * (damageCostFactor + disruptionCostFactor);
}

function calculateUnderusedLand(surface) {
  return ((surface * 0.4047) * 0.05) * 1000;
}