import React, { useRef, useEffect, useState, useMemo } from 'react';
import { StockRow, WidgetSettings } from '../types';
import { BarChart3 } from 'lucide-react';

interface VolumeChartProps {
  data: StockRow[];
  hoveredIndex: number | null;
  onHoverIndex: (index: number | null) => void;
  widgetSettings: WidgetSettings;
}

export const VolumeChart: React.FC<VolumeChartProps> = ({
  data,
  hoveredIndex,
  onHoverIndex,
  widgetSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 130 });

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

  const maxVolume = useMemo(() => {
    if (data.length === 0) return 1000000;
    let max = 0;
    for (const d of data) {
      max = Math.max(max, d.volume);
      if (d.volumeMA20) max = Math.max(max, d.volumeMA20);
    }
    return max * 1.15 || 1000000;
  }, [data]);

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
    const padRight = 65;
    const padTop = 10;
    const padBottom = 16;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    ctx.fillStyle = '#0a0f18';
    ctx.fillRect(0, 0, w, h);

    const getX = (index: number) => {
      if (data.length <= 1) return padLeft + plotW / 2;
      return padLeft + (index / (data.length - 1)) * plotW;
    };

    const getY = (vol: number) => {
      return padTop + plotH * (1 - vol / maxVolume);
    };

    // Grid lines for volume
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#64748b';

    const steps = 3;
    for (let i = 1; i <= steps; i++) {
      const v = (maxVolume * i) / steps;
      const y = getY(v);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      const label = v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : `${(v / 100000).toFixed(0)}L`;
      ctx.fillText(label, w - padRight + 8, y);
    }

    // Volume Bars
    const barW = Math.max(1.5, Math.min(16, (plotW / data.length) * 0.72));

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const x = getX(i);
      const y = getY(item.volume);
      const isUp = item.close >= item.open;

      // Base bar
      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.65)' : 'rgba(244, 63, 94, 0.65)';
      ctx.fillRect(x - barW / 2, y, barW, h - padBottom - y);

      // Deliverable qty sub-fill if available
      if (item.deliverableQty && item.volume > 0) {
        const deliverableRatio = Math.min(1, item.deliverableQty / item.volume);
        const delivHeight = (h - padBottom - y) * deliverableRatio;
        ctx.fillStyle = isUp ? 'rgba(52, 211, 153, 0.95)' : 'rgba(251, 113, 133, 0.95)';
        ctx.fillRect(x - barW / 2, h - padBottom - delivHeight, barW, delivHeight);
      }
    }

    // Volume 20 MA Line
    if (widgetSettings.showVolumeMA) {
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < data.length; i++) {
        const vma = data[i].volumeMA20;
        if (vma !== undefined && isFinite(vma)) {
          const x = getX(i);
          const y = getY(vma);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      if (started) {
        ctx.strokeStyle = '#f59e0b'; // Amber
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Hover crosshair
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

      const hY = getY(active.volume);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(hX, hY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Right tag
      const volText =
        active.volume >= 10000000
          ? `${(active.volume / 10000000).toFixed(2)}Cr`
          : `${(active.volume / 100000).toFixed(1)}L`;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w - padRight + 2, hY - 9, 60, 18);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(volText, w - padRight + 6, hY);
    }
  }, [dimensions, data, maxVolume, hoveredIndex, widgetSettings.showVolumeMA]);

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

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">Volume & Delivery Analytics</span>
          {activeRow && (
            <span className="text-xs font-mono text-slate-300 ml-2">
              Vol:{' '}
              <strong className="text-white">
                {activeRow.volume.toLocaleString('en-IN')}
              </strong>
              {activeRow.deliveryPercent > 0 && (
                <span className="text-emerald-400 ml-2">
                  (Delivery: {activeRow.deliveryPercent}%)
                </span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-500/80 rounded-sm" /> Up
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-rose-500/80 rounded-sm" /> Down
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-amber-400" /> MA 20
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[110px] cursor-crosshair select-none"
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
