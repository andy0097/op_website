
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { value } = req.body;

  // Do your secret logic here
  const result = value * 42; // replace with your real logic

  res.status(200).json({ result });
}