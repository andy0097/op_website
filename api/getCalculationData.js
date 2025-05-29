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
  res.setHeader("Access-Control-Allow-Origin", "https://openstead.co");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  if (!req.body || typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

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
    const surfaceNum = parseFloat(surface);
    if (!isNaN(surfaceNum) && surfaceNum > 0) {
      const calculations = calculateAll(surfaceNum, entry);
      
      const floodingVolume = calculations.surfaceWaterFloodingVolume;
      const oneTimeImpact = calculations.oneTimeImpact;
      const underusedLand = calculations.underusedLand;
      const npv = calculations.netPresentValue30;
      const annualisedReturn = calculations.annualisedReturn;


      // Return result
      return res.status(200).json({
        floodingVolume,
        oneTimeImpact,
        underusedLand,
        npv,
        annualisedReturn
      });
    } else {
      return res.status(400).json({ error: "Invalid surface value" });
    }
  } 
  catch (err) {
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
  return ((surface * 0.4047) * 0.05) * 10000;
}




// Single all-in-one calculator
function calculateAll(surface, entry ) {
  
  //Define all variables
  const vars = {
    // Section 1: Portfolio Calculations
    conversionToHectares: null,

    // Section 2: Climate Exposure Calculations
    baselineSurfaceWaterFlooding: null,
    projectedIncrease: null,
    surfaceWaterFloodingVolume: null,
    damageCostFactor: null,
    disruptionCostFactor: null,
    oneTimeImpact: null,
    expectedAnnualImpact: null,

    // Section 3: Opportunity
    landRequiredPerM3: null,
    requiredLandForFullImpact: null,
    underusedLand: null,
    implementationArea: null,
    implementationCost: null,
    annualMaintenanceCost: null,
    surfaceWaterReduction: null,
    actualVolumeReduced: null,

    // Section 4: Business Case
    annualFloodProbability: null,
    effectiveFloodReduction: null,
    annualAvoidedDamage: null,
    annualAvoidedDisruption: null,
    totalAnnualSavings: null,

    // Net Present Value (30 years)
    year1: null,
    year2Plus: null,
    discountRate: null,
    netPresentValue30: null,
    roi30: null,
    annualisedReturn: null,
    years: null,
    annualCashFlow: null
  };

  // Make Calculations
  vars.conversionToHectares = surface*0.4047;
  vars.baselineSurfaceWaterFlooding = entry.baselineFloodRisk;
  vars.projectedIncrease = entry.projected2050Increase;
  vars.surfaceWaterFloodingVolume = surface*vars.baselineSurfaceWaterFlooding*(1+vars.projectedIncrease);
  vars.damageCostFactor = entry.damageCostFactor;
  vars.disruptionCostFactor = entry.disruptionCostFactor;
  vars.oneTimeImpact = vars.surfaceWaterFloodingVolume*(vars.damageCostFactor+vars.disruptionCostFactor);
  vars.annualFloodProbability = 0.033;
  vars.expectedAnnualImpact = vars.oneTimeImpact*vars.annualFloodProbability;
  vars.landRequiredPerM3 = 0.1;
  vars.requiredLandForFullImpact = vars.landRequiredPerM3*vars.surfaceWaterFloodingVolume;
  vars.underusedLand = (vars.conversionToHectares*0.05)*10000;
  vars.implementationArea = Math.min(vars.requiredLandForFullImpact, vars.underusedLand);
  vars.implementationCost = vars.implementationArea*150;
  vars.annualMaintenanceCost = vars.implementationArea*4;
  vars.surfaceWaterReduction = vars.surfaceWaterFloodingVolume > 0 ? Math.min(0.75, vars.underusedLand / vars.surfaceWaterFloodingVolume): 0;
  vars.actualVolumeReduced = vars.surfaceWaterFloodingVolume*vars.surfaceWaterReduction;
  vars.effectiveFloodReduction = vars.surfaceWaterFloodingVolume*0.75;
  vars.annualAvoidedDamage = (vars.effectiveFloodReduction*vars.damageCostFactor)*vars.annualFloodProbability;
  vars.annualAvoidedDisruption = vars.effectiveFloodReduction*vars.disruptionCostFactor*vars.annualFloodProbability;
  vars.totalAnnualSavings = vars.annualAvoidedDamage+vars.annualAvoidedDisruption;
  vars.year1 = -vars.implementationCost+vars.totalAnnualSavings;
  vars.discountRate = 0.03;
  vars.years = 30;
  vars.annualCashFlow = vars.totalAnnualSavings-vars.annualMaintenanceCost; 
  vars.netPresentValue30 = vars.year1 + (vars.annualCashFlow * (1 - Math.pow(1 + vars.discountRate, -(vars.years - 1))) / vars.discountRate) / (1 + vars.discountRate);
  vars.roi30 = vars.netPresentValue30/vars.implementationCost;
  vars.annualisedReturn = Math.pow(vars.netPresentValue30 / vars.implementationCost, 1 / 30) - 1;


  return vars;
}