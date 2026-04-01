export default async function handler(req, res) {
  const SHEET_ID = "1-bkxKUS6MV2yWkZ2O6k3g0yDUoEZl371TnnV9ttagjw";
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Disney%E4%BA%BA%E7%89%A9%E7%B4%A2%E5%BC%95`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    // まず生テキストをそのまま返して確認
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(text.slice(0, 500)); // 最初の500文字だけ
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
