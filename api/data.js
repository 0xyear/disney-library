export default async function handler(req, res) {
  const SHEET_ID = "1-bkxKUS6MV2yWkZ2O6k3g0yDUoEZl371TnnV9ttagjw";
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Disney%E4%BA%BA%E7%89%A9%E7%B4%A2%E5%BC%95&headers=1&t=${Date.now()}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    const text = await response.text();
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);
    const cols = json.table.cols.map(c => c.label).filter(Boolean);
    const rows = json.table.rows
      .filter(r => r.c && r.c[0]?.v)
      .map(r => Object.fromEntries(cols.map((c, i) => [c, r.c[i]?.v ?? ""])));
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
