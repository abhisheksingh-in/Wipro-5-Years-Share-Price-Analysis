import React from 'react';
import { StockRow, TechnicalSignals } from '../types';
import {
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface TechnicalSignalsCardProps {
  signals: TechnicalSignals;
  latestRow: StockRow | null;
}

export const TechnicalSignalsCard: React.FC<TechnicalSignalsCardProps> = ({
  signals,
  latestRow,
}) => {
  if (!latestRow) return null;

  // Signal color styling
  const signalBadgeConfig: Record<string, { bg: string; text: string; border: string }> = {
    'Strong Buy': { bg: 'bg-emerald-950/80', text: 'text-emerald-400', border: 'border-emerald-500/50' },
    Buy: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-700/50' },
    Neutral: { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-700' },
    Sell: { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-700/50' },
    'Strong Sell': { bg: 'bg-rose-950/80', text: 'text-rose-400', border: 'border-rose-500/50' },
  };

  const currentBadge = signalBadgeConfig[signals.overallSignal] || signalBadgeConfig['Neutral'];

  // 52W range calculation
  const range52 = signals.high52Week - signals.low52Week;
  const pos52 = range52 > 0 ? Math.max(0, Math.min(100, ((latestRow.close - signals.low52Week) / range52) * 100)) : 50;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Technical Sentiment & Moving Averages
          </h3>
        </div>
        <div
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}
        >
          {signals.overallSignal}
        </div>
      </div>

      {/* Signal Matrix Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
        {/* RSI Meter */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400 font-medium">RSI (14) Status</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-base font-bold text-white">
              {signals.rsiValue.toFixed(1)}
            </span>
            <span
              className={`text-[10px] font-bold ${
                signals.rsiStatus === 'Oversold'
                  ? 'text-emerald-400'
                  : signals.rsiStatus === 'Overbought'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {signals.rsiStatus}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
            <div className="w-[30%] bg-emerald-500/70 h-full" title="Oversold zone (0-30)" />
            <div className="w-[40%] bg-sky-500/50 h-full" title="Neutral zone (30-70)" />
            <div className="w-[30%] bg-rose-500/70 h-full" title="Overbought zone (70-100)" />
          </div>
        </div>

        {/* MA 50 vs MA 200 Cross */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400 font-medium">MA50 / MA200 Trend</div>
          <div className="flex items-center gap-1.5 mt-1">
            {signals.goldenCross ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bullish Setup
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Bearish / Lag
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            MA50: ₹{latestRow.ma50?.toFixed(1) ?? 'N/A'} · MA200: ₹{latestRow.ma200?.toFixed(1) ?? 'N/A'}
          </div>
        </div>

        {/* Price vs MA 200 */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400 font-medium">Distance from MA200</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`font-mono text-base font-bold ${
                signals.priceVsMA200 >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {signals.priceVsMA200 >= 0 ? '+' : ''}
              {signals.priceVsMA200.toFixed(1)}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {signals.priceVsMA200 >= 0 ? 'Above 200D avg' : 'Below 200D avg'}
          </div>
        </div>

        {/* Short-Term Momentum */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400 font-medium">Short-Term Momentum</div>
          <div className="flex items-center gap-1.5 mt-1">
            {signals.shortTermTrend === 'Bullish' ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Bullish
              </span>
            ) : signals.shortTermTrend === 'Bearish' ? (
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Bearish
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400">Neutral</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            MA10: ₹{latestRow.ma10?.toFixed(1) ?? 'N/A'}
          </div>
        </div>
      </div>

      {/* 52-Week Range Bar */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span>
            52W Low: <strong className="font-mono text-slate-300">₹{signals.low52Week.toFixed(2)}</strong>
          </span>
          <span className="text-slate-400 font-medium">52-Week Range</span>
          <span>
            52W High: <strong className="font-mono text-slate-300">₹{signals.high52Week.toFixed(2)}</strong>
          </span>
        </div>
        <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full opacity-80"
            style={{ width: '100%' }}
          />
          {/* Position marker */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff] -ml-0.5 rounded-full z-10"
            style={{ left: `${pos52}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
          <span>Current ₹{latestRow.close.toFixed(2)} ({pos52.toFixed(0)}% of 52W range)</span>
          <span>Daily Volatility: {signals.volatility}%</span>
        </div>
      </div>
    </div>
  );
};
