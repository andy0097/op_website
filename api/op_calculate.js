
export default function handler(req, res) { 
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or restrict to 'https://openstead.webflow.io'
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
    }

    const { value } = req.body;

    // Do your secret logic here
    const result = value * 42; // replace with your real logic

    res.status(200).json({ result });
}