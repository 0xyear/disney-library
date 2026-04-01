export default async function handler(req, res) {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzuQ1JVabLW4uQLqU4DJQ3cvLXA4xqxNaOVDFTlTosTyMIklYuWg8l63iay9zoBxwH9/exec";
  
  try {
    const response = await fetch(GAS_URL, {
      redirect: 'follow',
      headers: { 'Accept': 'application/json' }
    });
    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
