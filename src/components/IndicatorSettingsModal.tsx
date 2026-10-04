import React, { useState } from 'react';
import { IndicatorConfig } from '../types';
import { DEFAULT_INDICATOR_CONFIG } from '../utils/indicators';
import { X, Sliders, RotateCcw, Check } from 'lucide-react';

interface IndicatorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: IndicatorConfig;
  onSave: (config: IndicatorConfig) => void;
}

export const IndicatorSettingsModal: React.FC<IndicatorSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [localConfig, setLocalConfig] = useState<IndicatorConfig>(config);

  if (!isOpen) return null;

  const handleReset = () => {
    setLocalConfig(DEFAULT_INDICATOR_CONFIG);
  };

  const handleApply = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Indicator Parameters</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div>
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2.5">
              Moving Average Periods
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">MA Fast (Cyan)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={localConfig.ma10Period}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, ma10Period: Number(e.target.value) || 10 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-slate-500">days</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">MA Mid (Yellow)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={localConfig.ma50Period}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, ma50Period: Number(e.target.value) || 50 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
                  />
                  <span className="text-slate-500">days</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">MA Intermediate (Orange)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={localConfig.ma100Period}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, ma100Period: Number(e.target.value) || 100 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-orange-400 font-bold focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-slate-500">days</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">MA Institutional (Purple)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="20"
                    max="500"
                    value={localConfig.ma200Period}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, ma200Period: Number(e.target.value) || 200 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-purple-400 font-bold focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-slate-500">days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2.5">
              RSI (Relative Strength Index)
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-slate-400 block mb-1">Period (Days)</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={localConfig.rsiPeriod}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, rsiPeriod: Number(e.target.value) || 14 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-sky-400 font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Overbought (OB)</label>
                <input
                  type="number"
                  min="55"
                  max="95"
                  value={localConfig.rsiOverbought}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, rsiOverbought: Number(e.target.value) || 70 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Oversold (OS)</label>
                <input
                  type="number"
                  min="5"
                  max="45"
                  value={localConfig.rsiOversold}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, rsiOversold: Number(e.target.value) || 30 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
