import { StockRow } from '../types';
import { calculateIndicators } from '../utils/indicators';

let cachedStockData: StockRow[] | null = null;

export async function loadWiproStockData(): Promise<StockRow[]> {
  if (cachedStockData && cachedStockData.length > 0) {
    return cachedStockData;
  }

  try {
    const res = await fetch('/wipro_data.json');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const rawList: StockRow[] = await res.json();
    const withIndicators = calculateIndicators(rawList);
    cachedStockData = withIndicators;
    return withIndicators;
  } catch (err) {
    console.error('Failed to load JSON, attempting CSV fallback', err);
    try {
      const csvRes = await fetch('/wipro.csv');
      const text = await csvRes.text();
      const rows = parseWiproCsv(text);
      const withIndicators = calculateIndicators(rows);
      cachedStockData = withIndicators;
      return withIndicators;
    } catch (csvErr) {
      console.error('Failed to parse CSV fallback', csvErr);
      return [];
    }
  }
}

export function parseWiproCsv(csvText: string): StockRow[] {
  const lines = csvText.split('\n');
  const rows: StockRow[] = [];

  const MONTHS: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  function parseNum(val: string): number {
    if (!val) return 0;
    return parseFloat(val.replace(/[",]/g, '').trim()) || 0;
  }

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Regex to parse comma-separated fields with quotes
    const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
    if (!matches || matches.length < 9) continue;
    const cols = matches.map((m) => m.replace(/^,/, '').replace(/^"|"$/g, '').trim());

    const symbol = cols[0] || 'WIPRO';
    const series = cols[1] || 'EQ';
    const displayDate = cols[2];
    const prevClose = parseNum(cols[3]);
    const open = parseNum(cols[4]);
    const high = parseNum(cols[5]);
    const low = parseNum(cols[6]);
    const last = parseNum(cols[7]);
    const close = parseNum(cols[8]);
    const average = parseNum(cols[9]);
    const volume = parseNum(cols[10]);
    const turnover = parseNum(cols[11]);
    const trades = parseNum(cols[12]);
    const deliverableQty = parseNum(cols[13]);
    const deliveryPercent = parseNum(cols[14]);

    const parts = displayDate.split('-');
    let timestamp = 0;
    let isoDate = displayDate;
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const mIdx = MONTHS[parts[1]] ?? 0;
      const yr = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(yr, mIdx, day));
      timestamp = d.getTime();
      isoDate = `${yr}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    rows.push({
      symbol,
      series,
      date: isoDate,
      displayDate,
      timestamp,
      prevClose,
      open,
      high,
      low,
      close,
      last,
      lastPrice: last || close,
      average,
      averagePrice: average,
      volume,
      turnover,
      trades,
      deliverableQty,
      deliveryPercent
    });
  }

  return rows.sort((a, b) => a.timestamp - b.timestamp);
}
