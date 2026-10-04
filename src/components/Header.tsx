import React from 'react';
import { StockRow, TimeRange } from '../types';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Sliders,
  Settings,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  latestRow: StockRow | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  selectedSeries: string;
  setSelectedSeries: (series: string) => void;
  isSimulating: boolean;
  toggleSimulation: () => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  stepSimulation: () => void;
  resetToLatestOriginal: () => void;
  onOpenWidgetModal: () => void;
  onOpenIndicatorModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  latestRow,
  timeRange,
  setTimeRange,
  selectedSeries,
  setSelectedSeries,
  isSimulating,
  toggleSimulation,
  simulationSpeed,
  setSimulationSpeed,
  stepSimulation,
  resetToLatestOriginal,
  onOpenWidgetModal,
  onOpenIndicatorModal,
}) => {
  const timeRanges: TimeRange[] = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'ALL'];
  const seriesList = ['ALL', 'EQ', 'BL', 'T0'];

  const isUp = (latestRow?.change ?? 0) >= 0;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/90 px-4 py-3">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Stock Ticker Brand & Live Price */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black tracking-wider text-cyan-400 text-sm">
                WIP
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  WIPRO LIMITED
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-medium">
                    NSE: WIPRO
                  </span>
                </h1>
                {/* Live simulation indicator beacon */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    isSimulating
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSimulating ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                    }`}
                  />
                  {isSimulating ? 'STREAMING REAL-TIME' : 'HISTORICAL FEED'}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>IT Services & Consulting</span>
                <span>•</span>
                <span className="font-mono text-slate-300">
                  {latestRow ? latestRow.displayDate || latestRow.date : 'Oct 2026'}
                </span>
                <span>•</span>
                <span className="text-slate-500">Series: {selectedSeries}</span>
              </div>
            </div>
          </div>

          {/* Price & Change Block */}
          {latestRow && (
            <div className="flex items-baseline gap-3 pl-2 sm:pl-4 sm:border-l border-slate-800">
              <div className="font-mono text-2xl font-black tracking-tight text-white">
                ₹{latestRow.close.toFixed(2)}
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold font-mono ${
                  isUp
                    ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-800/60'
                    : 'text-rose-400 bg-rose-950/50 border border-rose-800/60'
                }`}
              >
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>
                  {isUp ? '+' : ''}
                  {latestRow.change?.toFixed(2) ?? '0.00'} (
                  {latestRow.changePercent?.toFixed(2) ?? '0.00'}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center / Right: Filters & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Presets */}
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Series Filter */}
          <div className="flex items-center gap-1 text-xs bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
            <span className="text-slate-500 font-medium">Series:</span>
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono font-medium focus:outline-none cursor-pointer"
            >
              {seriesList.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-slate-200">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Real-time simulation bar */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg">
            <button
              onClick={toggleSimulation}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                isSimulating
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
              title={isSimulating ? 'Pause live stream' : 'Start live simulation'}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Live Tick
                </>
              )}
            </button>

            {/* Step 1 tick */}
            <button
              onClick={stepSimulation}
              disabled={isSimulating}
              className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 hover:bg-slate-800 rounded transition-colors"
              title="Generate single simulated tick"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            {/* Speed selector */}
            <div className="flex items-center gap-0.5 ml-1">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimulationSpeed(speed)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                    simulationSpeed === speed
                      ? 'bg-slate-700 text-cyan-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <button
              onClick={resetToLatestOriginal}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors ml-1"
              title="Reset simulation to real data"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Action Modals Triggers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenIndicatorModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
              title="Configure MA periods and RSI parameters"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Indicators</span>
            </button>

            <button
              onClick={onOpenWidgetModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
              title="Customize dashboard widgets"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Widgets</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
