import React from 'react';
import { StockRow } from '../types';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  ArrowRightLeft,
  PieChart,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface KeyStatsGridProps {
  latestRow: StockRow | null;
}

export const KeyStatsGrid: React.FC<KeyStatsGridProps> = ({ latestRow }) => {
  if (!latestRow) return null;

  // Format turnover (Turnover ₹ is in Indian format, e.g. ₹294 Crores)
  const turnoverCrores =
    latestRow.turnover > 0 ? (latestRow.turnover / 10000000).toFixed(2) : 'N/A';

  const stats = [
    {
      label: 'Day Open',
      value: `₹${latestRow.open.toFixed(2)}`,
      icon: Calendar,
      color: 'text-slate-300',
    },
    {
      label: 'Day High',
      value: `₹${latestRow.high.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      label: 'Day Low',
      value: `₹${latestRow.low.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-rose-400',
    },
    {
      label: 'Prev. Close',
      value: `₹${latestRow.prevClose.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-slate-300',
    },
    {
      label: 'Average Price (VWAP)',
      value: `₹${(latestRow.average ?? latestRow.averagePrice ?? latestRow.close).toFixed(2)}`,
      icon: PieChart,
      color: 'text-cyan-400',
    },
    {
      label: 'Traded Volume',
      value: `${(latestRow.volume / 100000).toFixed(2)} Lakhs`,
      icon: Layers,
      color: 'text-blue-400',
    },
    {
      label: 'Turnover',
      value: `₹${turnoverCrores} Cr`,
      icon: ArrowRightLeft,
      color: 'text-amber-400',
    },
    {
      label: 'Delivery %',
      value: `${latestRow.deliveryPercent.toFixed(1)}%`,
      icon: ShieldCheck,
      color: latestRow.deliveryPercent >= 50 ? 'text-emerald-400' : 'text-slate-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 shadow-md backdrop-blur flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>{stat.label}</span>
              <Icon className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className={`font-mono text-sm sm:text-base font-bold ${stat.color} truncate`}>
              {stat.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
