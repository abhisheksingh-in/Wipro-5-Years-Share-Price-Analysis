import { StockRow } from '../types';

export type RawRecord = [
  date: string,          // e.g. "01-Oct-2026"
  series: string,        // "EQ", "BL", "T0"
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number,
  trades: number,
  deliverableQty: number,
  deliveryPercent: number,
  prevClose: number,
  turnover?: number
];

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

export function parseDateString(dateStr: string): { timestamp: number; isoDate: string } {
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = MONTHS[parts[1]] ?? 0;
    const year = parseInt(parts[2], 10);
    const d = new Date(Date.UTC(year, month, day));
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { timestamp: d.getTime(), isoDate };
  }
  const fallback = new Date(dateStr);
  return { timestamp: fallback.getTime(), isoDate: dateStr };
}

export function rawRecordToStockRow(raw: RawRecord): StockRow {
  const [date, series, open, high, low, close, volume, trades, deliverableQty, deliveryPercent, prevClose, turnover] = raw;
  const { timestamp, isoDate } = parseDateString(date);

  return {
    symbol: 'WIPRO',
    series,
    date: isoDate,
    displayDate: date,
    timestamp,
    prevClose,
    open,
    high,
    low,
    close,
    lastPrice: close,
    averagePrice: Number(((open + high + low + close) / 4).toFixed(2)),
    volume,
    turnover: turnover ?? volume * close,
    trades,
    deliverableQty,
    deliveryPercent
  };
}
