import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://openstead.webflow.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  try {
    // Resolve file path to data.json
    const filePath = path.resolve(process.cwd(), './data/data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    // Extract only locations
    const locations = data.map(entry => entry.location);

    return res.status(200).json({ locations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to read data" });
  }
}