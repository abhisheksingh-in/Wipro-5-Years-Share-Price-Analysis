export interface StockRow {
  symbol: string;
  series: string;
  date: string; // ISO string YYYY-MM-DD
  displayDate: string; // e.g. "01-Oct-2026"
  timestamp: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  close: number;
  last?: number;
  lastPrice?: number;
  average?: number;
  averagePrice?: number;
  volume: number; // Total Traded Quantity
  turnover: number;
  trades: number;
  deliverableQty: number;
  deliveryPercent: number;
  // Computed technical indicators
  ma10?: number;
  ma50?: number;
  ma100?: number;
  ma200?: number;
  rsi?: number;
  volumeMA20?: number;
  change?: number;
  changePercent?: number;
}

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';
export type ChartMode = 'line' | 'candlestick';

export interface WidgetSettings {
  showPriceChart: boolean;
  showRSI: boolean;
  showVolume: boolean;
  showTechnicalSignals: boolean;
  showStatsCards: boolean;
  showOrderBook: boolean;
  showDataTable: boolean;
  // Indicator visibility inside chart
  showMA10: boolean;
  showMA50: boolean;
  showMA100: boolean;
  showMA200: boolean;
  showClosingLine: boolean;
  showVolumeMA: boolean;
}

export interface IndicatorConfig {
  ma10Period: number;
  ma50Period: number;
  ma100Period: number;
  ma200Period: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
}

export interface TechnicalSignals {
  rsiStatus: 'Oversold' | 'Overbought' | 'Neutral';
  rsiValue: number;
  goldenCross: boolean; // MA50 > MA200 and previously was below or just crossed
  deathCross: boolean;
  priceVsMA200: number; // % above or below
  priceVsMA50: number;
  shortTermTrend: 'Bullish' | 'Bearish' | 'Neutral';
  overallSignal: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  high52Week: number;
  low52Week: number;
  avgVolume20: number;
  volatility: number;
}
