import { StockRow, IndicatorConfig, TechnicalSignals } from '../types';

export const DEFAULT_INDICATOR_CONFIG: IndicatorConfig = {
  ma10Period: 10,
  ma50Period: 50,
  ma100Period: 100,
  ma200Period: 200,
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
};

/**
 * Computes Moving Averages and RSI for an array of StockRow sorted chronologically (oldest to newest).
 */
export function calculateIndicators(
  data: StockRow[],
  config: IndicatorConfig = DEFAULT_INDICATOR_CONFIG
): StockRow[] {
  if (!data || data.length === 0) return [];

  // Ensure sorted ascending by timestamp
  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);

  const { ma10Period, ma50Period, ma100Period, ma200Period, rsiPeriod } = config;

  const closes = sorted.map((d) => d.close);
  const volumes = sorted.map((d) => d.volume);
  const n = sorted.length;

  function computeSMA(source: number[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = new Array(n).fill(undefined);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += source[i];
      if (i >= period) {
        sum -= source[i - period];
      }
      if (i >= period - 1) {
        result[i] = Number((sum / period).toFixed(2));
      }
    }
    return result;
  }

  const ma10Values = computeSMA(closes, ma10Period);
  const ma50Values = computeSMA(closes, ma50Period);
  const ma100Values = computeSMA(closes, ma100Period);
  const ma200Values = computeSMA(closes, ma200Period);
  const volumeMA20Values = computeSMA(volumes, 20);

  // Compute Wilder's RSI (Standard 14 periods)
  const rsiValues: (number | undefined)[] = new Array(n).fill(undefined);
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < n; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    if (i <= rsiPeriod) {
      avgGain += gain;
      avgLoss += loss;
      if (i === rsiPeriod) {
        avgGain /= rsiPeriod;
        avgLoss /= rsiPeriod;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsiValues[i] = Number((100 - 100 / (1 + rs)).toFixed(2));
      }
    } else {
      // Wilder smoothing
      avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
      avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiValues[i] = Number((100 - 100 / (1 + rs)).toFixed(2));
    }
  }

  return sorted.map((row, idx) => {
    const prev = idx > 0 ? sorted[idx - 1].close : row.prevClose || row.open;
    const change = Number((row.close - prev).toFixed(2));
    const changePercent = prev > 0 ? Number(((change / prev) * 100).toFixed(2)) : 0;

    return {
      ...row,
      change,
      changePercent,
      ma10: ma10Values[idx],
      ma50: ma50Values[idx],
      ma100: ma100Values[idx],
      ma200: ma200Values[idx],
      volumeMA20: volumeMA20Values[idx],
      rsi: rsiValues[idx],
    };
  });
}

/**
 * Computes live technical signals from the latest stock rows
 */
export function computeTechnicalSignals(
  rows: StockRow[],
  config: IndicatorConfig = DEFAULT_INDICATOR_CONFIG
): TechnicalSignals {
  if (!rows || rows.length === 0) {
    return {
      rsiStatus: 'Neutral',
      rsiValue: 50,
      goldenCross: false,
      deathCross: false,
      priceVsMA200: 0,
      priceVsMA50: 0,
      shortTermTrend: 'Neutral',
      overallSignal: 'Neutral',
      high52Week: 0,
      low52Week: 0,
      avgVolume20: 0,
      volatility: 0,
    };
  }

  const latest = rows[rows.length - 1];
  const rsi = latest.rsi ?? 50;

  let rsiStatus: 'Oversold' | 'Overbought' | 'Neutral' = 'Neutral';
  if (rsi <= config.rsiOversold) rsiStatus = 'Oversold';
  else if (rsi >= config.rsiOverbought) rsiStatus = 'Overbought';

  // 52-week (approx 250 trading days) High / Low
  const recent250 = rows.slice(-250);
  const high52Week = Math.max(...recent250.map((r) => r.high));
  const low52Week = Math.min(...recent250.map((r) => r.low));

  // Golden cross / Death cross (MA 50 vs MA 200)
  const goldenCross = (latest.ma50 ?? 0) > (latest.ma200 ?? 0);
  const deathCross = (latest.ma50 ?? 0) < (latest.ma200 ?? 0) && (latest.ma200 ?? 0) > 0;

  const priceVsMA200 = latest.ma200 ? Number((((latest.close - latest.ma200) / latest.ma200) * 100).toFixed(2)) : 0;
  const priceVsMA50 = latest.ma50 ? Number((((latest.close - latest.ma50) / latest.ma50) * 100).toFixed(2)) : 0;

  // Short term trend: price vs MA10 and MA10 vs MA50
  let shortTermTrend: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (latest.ma10 && latest.close > latest.ma10 && (!latest.ma50 || latest.ma10 > latest.ma50)) {
    shortTermTrend = 'Bullish';
  } else if (latest.ma10 && latest.close < latest.ma10 && (!latest.ma50 || latest.ma10 < latest.ma50)) {
    shortTermTrend = 'Bearish';
  }

  // Composite signal scoring
  let score = 0;
  if (rsi < 30) score += 2; // oversold bounce potential
  else if (rsi < 45) score += 1;
  else if (rsi > 70) score -= 2; // overbought pullback risk
  else if (rsi > 60) score -= 1;

  if (priceVsMA50 > 0) score += 1;
  else score -= 1;

  if (priceVsMA200 > 0) score += 1;
  else score -= 1;

  if (latest.ma10 && latest.ma50 && latest.ma10 > latest.ma50) score += 1;
  else score -= 1;

  let overallSignal: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell' = 'Neutral';
  if (score >= 3) overallSignal = 'Strong Buy';
  else if (score >= 1) overallSignal = 'Buy';
  else if (score <= -3) overallSignal = 'Strong Sell';
  else if (score <= -1) overallSignal = 'Sell';

  // 20-day Average Volume & Average daily volatility %
  const recent20 = rows.slice(-20);
  const avgVolume20 = Math.round(recent20.reduce((acc, r) => acc + r.volume, 0) / (recent20.length || 1));
  const avgRangePct = recent20.reduce((acc, r) => acc + ((r.high - r.low) / (r.low || 1)) * 100, 0) / (recent20.length || 1);

  return {
    rsiStatus,
    rsiValue: rsi,
    goldenCross,
    deathCross,
    priceVsMA200,
    priceVsMA50,
    shortTermTrend,
    overallSignal,
    high52Week,
    low52Week,
    avgVolume20,
    volatility: Number(avgRangePct.toFixed(2)),
  };
}
