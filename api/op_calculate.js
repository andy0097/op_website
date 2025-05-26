
export default function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "https://openstead.webflow.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Explicitly handle preflight (OPTIONS) requests
  if (req.method === "OPTIONS") {
    return res.status(200).json({ message: "CORS preflight success" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { value } = req.body;
  const result = value * 42;

  return res.status(200).json({ result });
}