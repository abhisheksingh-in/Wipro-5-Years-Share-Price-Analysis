import React, { useMemo } from 'react';
import { StockRow } from '../types';
import { BookOpen, Layers } from 'lucide-react';

interface LiveOrderBookProps {
  latestRow: StockRow | null;
  isSimulating: boolean;
}

export const LiveOrderBook: React.FC<LiveOrderBookProps> = ({ latestRow, isSimulating }) => {
  const currentPrice = latestRow?.close ?? 159.35;

  // Generate simulated 5-level DOM (Depth of Market) around current price
  const { bids, asks, spread } = useMemo(() => {
    const tick = 0.05;
    const baseBid = Math.floor(currentPrice / tick) * tick;
    const baseAsk = Number((baseBid + tick).toFixed(2));

    const b = [];
    const a = [];

    let cumBid = 0;
    let cumAsk = 0;

    for (let i = 0; i < 5; i++) {
      const bPrice = Number((baseBid - i * tick).toFixed(2));
      const bQty = Math.floor(Math.random() * 20000 + 4000);
      cumBid += bQty;
      b.push({ price: bPrice, qty: bQty, total: cumBid, orders: Math.floor(Math.random() * 25 + 5) });

      const aPrice = Number((baseAsk + i * tick).toFixed(2));
      const aQty = Math.floor(Math.random() * 20000 + 4000);
      cumAsk += aQty;
      a.push({ price: aPrice, qty: aQty, total: cumAsk, orders: Math.floor(Math.random() * 25 + 5) });
    }

    const spreadVal = Number((baseAsk - baseBid).toFixed(2));

    return { bids: b, asks: a, spread: spreadVal };
  }, [currentPrice, isSimulating]);

  const maxTotal = Math.max(
    bids[bids.length - 1]?.total || 1,
    asks[asks.length - 1]?.total || 1
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Order Book & Market Depth (L2)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span>Spread: ₹{spread.toFixed(2)}</span>
          {isSimulating && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>
      </div>

      {/* Depth Grid */}
      <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
        {/* Bid Side */}
        <div>
          <div className="grid grid-cols-3 text-[10px] font-semibold text-slate-400 pb-1 border-b border-slate-800 font-mono text-right">
            <span className="text-left">Orders</span>
            <span>Qty</span>
            <span className="text-emerald-400">Bid (₹)</span>
          </div>

          <div className="space-y-1 mt-1 font-mono text-[11px]">
            {bids.map((bid, idx) => {
              const widthPct = Math.min(100, (bid.total / maxTotal) * 100);
              return (
                <div key={idx} className="relative grid grid-cols-3 py-0.5 text-right items-center">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none rounded"
                    style={{ width: `${widthPct}%` }}
                  />
                  <span className="text-left text-slate-500 text-[10px]">{bid.orders}</span>
                  <span className="text-slate-300">{bid.qty.toLocaleString('en-IN')}</span>
                  <span className="text-emerald-400 font-semibold">{bid.price.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ask Side */}
        <div>
          <div className="grid grid-cols-3 text-[10px] font-semibold text-slate-400 pb-1 border-b border-slate-800 font-mono text-left">
            <span className="text-rose-400">Ask (₹)</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Orders</span>
          </div>

          <div className="space-y-1 mt-1 font-mono text-[11px]">
            {asks.map((ask, idx) => {
              const widthPct = Math.min(100, (ask.total / maxTotal) * 100);
              return (
                <div key={idx} className="relative grid grid-cols-3 py-0.5 items-center">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none rounded"
                    style={{ width: `${widthPct}%` }}
                  />
                  <span className="text-rose-400 font-semibold">{ask.price.toFixed(2)}</span>
                  <span className="text-right text-slate-300">{ask.qty.toLocaleString('en-IN')}</span>
                  <span className="text-right text-slate-500 text-[10px]">{ask.orders}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="text-emerald-400 font-bold">
          Total Bids: {bids[bids.length - 1]?.total.toLocaleString('en-IN')}
        </span>
        <span className="text-rose-400 font-bold">
          Total Asks: {asks[asks.length - 1]?.total.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
};
