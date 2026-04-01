export default async function handler(req, res) {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzuQ1JVabLW4uQLqU4DJQ3cvLXA4xqxNaOVDFTlTosTyMIklYuWg8l63iay9zoBxwH9/exec";
  const response = await fetch(GAS_URL);
  const data = await response.json();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(data);
}
