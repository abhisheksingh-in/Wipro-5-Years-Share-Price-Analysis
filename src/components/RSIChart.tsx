import React, { useRef, useEffect, useState } from 'react';
import { StockRow, IndicatorConfig } from '../types';
import { Activity, AlertCircle } from 'lucide-react';

interface RSIChartProps {
  data: StockRow[];
  hoveredIndex: number | null;
  onHoverIndex: (index: number | null) => void;
  config: IndicatorConfig;
}

export const RSIChart: React.FC<RSIChartProps> = ({
  data,
  hoveredIndex,
  onHoverIndex,
  config,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 160 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = dimensions.width;
    const h = dimensions.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const padLeft = 10;
    const padRight = 65; // Matches Price Chart
    const padTop = 12;
    const padBottom = 16;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Background
    ctx.fillStyle = '#0a0f18';
    ctx.fillRect(0, 0, w, h);

    const getX = (index: number) => {
      if (data.length <= 1) return padLeft + plotW / 2;
      return padLeft + (index / (data.length - 1)) * plotW;
    };

    const getY = (rsiVal: number) => {
      // Clamped between 0 and 100
      const clamped = Math.max(0, Math.min(100, rsiVal));
      return padTop + plotH * (1 - clamped / 100);
    };

    const yOverbought = getY(config.rsiOverbought);
    const yOversold = getY(config.rsiOversold);
    const yMid = getY(50);

    // Overbought zone shading (> 70)
    ctx.fillStyle = 'rgba(244, 63, 94, 0.08)';
    ctx.fillRect(padLeft, padTop, plotW, yOverbought - padTop);

    // Oversold zone shading (< 30)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(padLeft, yOversold, plotW, h - padBottom - yOversold);

    // Guidelines
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 70 line (Overbought)
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padLeft, yOverbought);
    ctx.lineTo(w - padRight, yOverbought);
    ctx.stroke();
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`${config.rsiOverbought} (OB)`, w - padRight + 8, yOverbought);

    // 50 Mid line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, yMid);
    ctx.lineTo(w - padRight, yMid);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.fillText('50', w - padRight + 8, yMid);

    // 30 line (Oversold)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padLeft, yOversold);
    ctx.lineTo(w - padRight, yOversold);
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.fillText(`${config.rsiOversold} (OS)`, w - padRight + 8, yOversold);

    ctx.setLineDash([]);

    // Draw RSI Line
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < data.length; i++) {
      const rsi = data[i].rsi;
      if (rsi !== undefined && !isNaN(rsi)) {
        const x = getX(i);
        const y = getY(rsi);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }

    if (started) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38bdf8'; // Vibrant Sky Blue
      ctx.stroke();
    }

    // Crosshair line if hovered
    if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < data.length) {
      const active = data[hoveredIndex];
      const hX = getX(hoveredIndex);

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hX, padTop);
      ctx.lineTo(hX, h - padBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      if (active.rsi !== undefined && !isNaN(active.rsi)) {
        const hY = getY(active.rsi);

        // Highlight circle
        ctx.beginPath();
        ctx.arc(hX, hY, 4, 0, Math.PI * 2);
        ctx.fillStyle = active.rsi >= config.rsiOverbought ? '#f43f5e' : active.rsi <= config.rsiOversold ? '#10b981' : '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Right value tag
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(w - padRight + 2, hY - 9, 58, 18);
        ctx.fillStyle = active.rsi >= config.rsiOverbought ? '#f43f5e' : active.rsi <= config.rsiOversold ? '#10b981' : '#38bdf8';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(active.rsi.toFixed(1), w - padRight + 6, hY);
      }
    }
  }, [dimensions, data, hoveredIndex, config]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || data.length === 0) return;
    const x = e.clientX - rect.left;
    const padLeft = 10;
    const padRight = 65;
    const plotW = dimensions.width - padLeft - padRight;

    if (x >= padLeft && x <= dimensions.width - padRight) {
      const ratio = (x - padLeft) / plotW;
      const index = Math.round(ratio * (data.length - 1));
      onHoverIndex(Math.max(0, Math.min(data.length - 1, index)));
    } else {
      onHoverIndex(null);
    }
  };

  const handleMouseLeave = () => {
    onHoverIndex(null);
  };

  const activeRow = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : data[data.length - 1];
  const activeRSI = activeRow?.rsi;

  let rsiBadge = { text: 'NEUTRAL', color: 'text-slate-300 bg-slate-800/80 border-slate-700' };
  if (activeRSI !== undefined) {
    if (activeRSI >= config.rsiOverbought) {
      rsiBadge = { text: 'OVERBOUGHT (Watch Pullback)', color: 'text-rose-400 bg-rose-950/60 border-rose-800' };
    } else if (activeRSI <= config.rsiOversold) {
      rsiBadge = { text: 'OVERSOLD (Reversal Opportunity)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
    }
  }

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200">
            RSI Indicator ({config.rsiPeriod} Wilder's SMA)
          </span>
          {activeRSI !== undefined && (
            <span className="text-xs font-mono font-bold text-sky-400 ml-1">
              {activeRSI.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded border ${rsiBadge.color}`}
          >
            {rsiBadge.text}
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[140px] cursor-crosshair select-none"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};
