
export default function handler(req, res) {
  // Set CORS headers for every response
  res.setHeader("Access-Control-Allow-Origin", "https://openstead.webflow.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Must return here with headers already set
  }

  // Only allow POST beyond this point
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { value } = req.body;

  // Your secure logic
  const result = value * 42;

  return res.status(200).json({ result });
}