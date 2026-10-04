import React from 'react';
import { WidgetSettings } from '../types';
import { X, Layers, RotateCcw, CheckSquare, Square } from 'lucide-react';

interface WidgetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WidgetSettings;
  onUpdate: (settings: Partial<WidgetSettings>) => void;
  onReset: () => void;
}

export const WidgetCustomizerModal: React.FC<WidgetCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdate,
  onReset,
}) => {
  if (!isOpen) return null;

  const widgets: { key: keyof WidgetSettings; title: string; desc: string }[] = [
    {
      key: 'showPriceChart',
      title: 'Price & Moving Averages Chart',
      desc: 'Interactive Candlestick / Line chart with MA 10, 50, 100, 200 overlays',
    },
    {
      key: 'showRSI',
      title: 'RSI Indicator Sub-Chart',
      desc: 'Relative Strength Index with overbought (70) and oversold (30) threshold bands',
    },
    {
      key: 'showVolume',
      title: 'Volume & Liquidity Sub-Chart',
      desc: 'Bar breakdown of traded volume, delivery percentages, and 20-day Volume MA',
    },
    {
      key: 'showTechnicalSignals',
      title: 'Technical Sentiment & Cross Signals',
      desc: 'Composite momentum gauge, Golden/Death crosses, distance to MA200, 52W range',
    },
    {
      key: 'showStatsCards',
      title: 'Key Market Statistics Banner',
      desc: 'Day high/low, open, prev close, VWAP average, turnover, delivery %',
    },
    {
      key: 'showOrderBook',
      title: 'Live Order Book & Market Depth',
      desc: 'Simulated 5-level real-time bids/asks and market depth spread',
    },
    {
      key: 'showDataTable',
      title: 'Historical Records & CSV Export Table',
      desc: 'Searchable historical database with pagination and CSV export',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Customize Dashboard Widgets</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {widgets.map((w) => {
            const isChecked = Boolean(settings[w.key]);
            return (
              <div
                key={w.key}
                onClick={() => onUpdate({ [w.key]: !isChecked })}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-slate-800/60 border-indigo-500/40 text-slate-200'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="mt-0.5 text-indigo-400">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">{w.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{w.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default Layout
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
