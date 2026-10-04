import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { StockRow, ChartMode, WidgetSettings } from '../types';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, TrendingUp, BarChart2, Layers } from 'lucide-react';

interface InteractiveChartProps {
  data: StockRow[];
  hoveredIndex: number | null;
  onHoverIndex: (index: number | null) => void;
  widgetSettings: WidgetSettings;
  onUpdateWidgetSettings: (settings: Partial<WidgetSettings>) => void;
  chartMode: ChartMode;
  setChartMode: (mode: ChartMode) => void;
  onPan?: (deltaIndices: number) => void;
  onZoom?: (zoomFactor: number, focusRatio: number) => void;
  onResetZoom?: () => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  hoveredIndex,
  onHoverIndex,
  widgetSettings,
  onUpdateWidgetSettings,
  chartMode,
  setChartMode,
  onPan,
  onZoom,
  onResetZoom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  // Resize observer for responsive layout
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

  // Compute price bounds
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (data.length === 0) return { minPrice: 0, maxPrice: 100, priceRange: 100 };

    let min = Infinity;
    let max = -Infinity;

    for (const d of data) {
      min = Math.min(min, d.low);
      max = Math.max(max, d.high);

      if (widgetSettings.showMA10 && d.ma10 !== undefined) {
        min = Math.min(min, d.ma10);
        max = Math.max(max, d.ma10);
      }
      if (widgetSettings.showMA50 && d.ma50 !== undefined) {
        min = Math.min(min, d.ma50);
        max = Math.max(max, d.ma50);
      }
      if (widgetSettings.showMA100 && d.ma100 !== undefined) {
        min = Math.min(min, d.ma100);
        max = Math.max(max, d.ma100);
      }
      if (widgetSettings.showMA200 && d.ma200 !== undefined) {
        min = Math.min(min, d.ma200);
        max = Math.max(max, d.ma200);
      }
    }

    if (!isFinite(min) || !isFinite(max) || min === max) {
      min = 100;
      max = 200;
    }

    // Add 4% padding top and bottom for visual comfort
    const pad = (max - min) * 0.05 || 10;
    return {
      minPrice: min - pad,
      maxPrice: max + pad,
      priceRange: max - min + pad * 2,
    };
  }, [data, widgetSettings]);

  // Main canvas render
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

    // Padding
    const padLeft = 10;
    const padRight = 65; // Y-axis price label area
    const padTop = 15;
    const padBottom = 28; // X-axis date labels

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0d131f');
    bgGrad.addColorStop(1, '#090d15');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Coordinate mapping functions
    const getX = (index: number) => {
      if (data.length <= 1) return padLeft + plotW / 2;
      return padLeft + (index / (data.length - 1)) * plotW;
    };

    const getY = (price: number) => {
      const normalized = (price - minPrice) / priceRange;
      return padTop + plotH * (1 - normalized);
    };

    // Draw grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';

    // Horizontal Price Grids (5 levels)
    const priceSteps = 6;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= priceSteps; i++) {
      const p = minPrice + (priceRange * i) / priceSteps;
      const y = getY(p);

      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      // Right-hand price tag
      ctx.fillStyle = '#64748b';
      ctx.fillText(`₹${p.toFixed(1)}`, w - padRight + 8, y);
    }

    // Vertical Time Grids (approx 6-8 intervals)
    const timeSteps = Math.min(8, Math.max(3, Math.floor(plotW / 100)));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i <= timeSteps; i++) {
      const idx = Math.min(data.length - 1, Math.round((i / timeSteps) * (data.length - 1)));
      const x = getX(idx);

      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, h - padBottom);
      ctx.stroke();

      const item = data[idx];
      if (item) {
        ctx.fillStyle = '#64748b';
        ctx.fillText(item.displayDate || item.date, x, h - padBottom + 8);
      }
    }

    // Draw Price Series (Line or Candlestick)
    if (chartMode === 'line' || widgetSettings.showClosingLine) {
      // Area fill gradient
      const areaGrad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
      const isOverallUp = data[data.length - 1].close >= data[0].close;
      if (isOverallUp) {
        areaGrad.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        areaGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      } else {
        areaGrad.addColorStop(0, 'rgba(244, 63, 94, 0.22)');
        areaGrad.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
      }

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(data[0].close));
      for (let i = 1; i < data.length; i++) {
        ctx.lineTo(getX(i), getY(data[i].close));
      }
      ctx.lineTo(getX(data.length - 1), h - padBottom);
      ctx.lineTo(getX(0), h - padBottom);
      ctx.closePath();
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Main Closing Line
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(data[0].close));
      for (let i = 1; i < data.length; i++) {
        ctx.lineTo(getX(i), getY(data[i].close));
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = isOverallUp ? '#10b981' : '#f43f5e';
      ctx.stroke();
    }

    if (chartMode === 'candlestick') {
      const candleW = Math.max(1.5, Math.min(16, (plotW / data.length) * 0.72));

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const x = getX(i);
        const yOpen = getY(item.open);
        const yClose = getY(item.close);
        const yHigh = getY(item.high);
        const yLow = getY(item.low);

        const isUp = item.close >= item.open;
        const color = isUp ? '#10b981' : '#f43f5e';

        // Wick
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Body
        const topY = Math.min(yOpen, yClose);
        const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));
        ctx.fillStyle = color;
        ctx.fillRect(x - candleW / 2, topY, candleW, bodyH);
      }
    }

    // Helper to draw smooth Moving Average lines
    const drawMALine = (
      getValue: (row: StockRow) => number | undefined,
      strokeColor: string,
      lineWidth: number = 1.6
    ) => {
      ctx.beginPath();
      let started = false;

      for (let i = 0; i < data.length; i++) {
        const val = getValue(data[i]);
        if (val !== undefined && isFinite(val)) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }

      if (started) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    };

    // Draw Moving Averages
    if (widgetSettings.showMA200) {
      drawMALine((r) => r.ma200, '#a855f7', 2); // Purple 200-day
    }
    if (widgetSettings.showMA100) {
      drawMALine((r) => r.ma100, '#f97316', 1.8); // Orange 100-day
    }
    if (widgetSettings.showMA50) {
      drawMALine((r) => r.ma50, '#eab308', 1.8); // Yellow 50-day
    }
    if (widgetSettings.showMA10) {
      drawMALine((r) => r.ma10, '#06b6d4', 2.0); // Cyan 10-day
    }

    // Draw Crosshair if hovered
    if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < data.length) {
      const active = data[hoveredIndex];
      const hX = getX(hoveredIndex);
      const hY = getY(active.close);

      // Vertical line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hX, padTop);
      ctx.lineTo(hX, h - padBottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padLeft, hY);
      ctx.lineTo(w - padRight, hY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Highlight point
      ctx.beginPath();
      ctx.arc(hX, hY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw active price badge on Y-axis
      ctx.fillStyle = '#0284c7';
      const badgeH = 18;
      const badgeW = 60;
      ctx.fillRect(w - padRight + 2, hY - badgeH / 2, badgeW, badgeH);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`₹${active.close.toFixed(2)}`, w - padRight + 6, hY);

      // Draw active date badge on X-axis
      const dateText = active.displayDate || active.date;
      ctx.font = '10px "JetBrains Mono", monospace';
      const dateW = ctx.measureText(dateText).width + 12;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(Math.max(padLeft, Math.min(w - padRight - dateW, hX - dateW / 2)), h - padBottom + 2, dateW, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dateText, Math.max(padLeft + dateW / 2, Math.min(w - padRight - dateW / 2, hX)), h - padBottom + 10);
    }
  }, [dimensions, data, minPrice, maxPrice, priceRange, chartMode, widgetSettings, hoveredIndex]);

  // Mouse event handlers for crosshair & panning
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
      const clamped = Math.max(0, Math.min(data.length - 1, index));
      onHoverIndex(clamped);
    } else {
      onHoverIndex(null);
    }

    // Panning logic
    if (isDragging && onPan) {
      const deltaX = e.clientX - dragStartX;
      const deltaIndices = -Math.round((deltaX / plotW) * data.length * 0.4);
      if (deltaIndices !== 0) {
        onPan(deltaIndices);
        setDragStartX(e.clientX);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    onHoverIndex(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!onZoom) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const padLeft = 10;
    const padRight = 65;
    const plotW = dimensions.width - padLeft - padRight;
    const focusRatio = Math.max(0, Math.min(1, (x - padLeft) / plotW));

    // zoom in (deltaY < 0) or zoom out (deltaY > 0)
    const zoomFactor = e.deltaY < 0 ? 0.85 : 1.18;
    onZoom(zoomFactor, focusRatio);
  };

  // Selected or latest row for HUD display
  const activeRow = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : data[data.length - 1];

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur">
      {/* Top Chart Header & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Mode Toggle */}
          <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60">
            <button
              onClick={() => setChartMode('candlestick')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                chartMode === 'candlestick'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Candlestick chart view"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Candles
            </button>
            <button
              onClick={() => setChartMode('line')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                chartMode === 'line'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Line chart view"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Line
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Indicator Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => onUpdateWidgetSettings({ showMA10: !widgetSettings.showMA10 })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all ${
                widgetSettings.showMA10
                  ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800/80'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              MA 10
              {activeRow?.ma10 !== undefined && (
                <span className="font-mono ml-0.5 text-cyan-300">₹{activeRow.ma10.toFixed(1)}</span>
              )}
            </button>

            <button
              onClick={() => onUpdateWidgetSettings({ showMA50: !widgetSettings.showMA50 })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all ${
                widgetSettings.showMA50
                  ? 'bg-yellow-950/60 text-yellow-400 border-yellow-800/80'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              MA 50
              {activeRow?.ma50 !== undefined && (
                <span className="font-mono ml-0.5 text-yellow-300">₹{activeRow.ma50.toFixed(1)}</span>
              )}
            </button>

            <button
              onClick={() => onUpdateWidgetSettings({ showMA100: !widgetSettings.showMA100 })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all ${
                widgetSettings.showMA100
                  ? 'bg-orange-950/60 text-orange-400 border-orange-800/80'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              MA 100
              {activeRow?.ma100 !== undefined && (
                <span className="font-mono ml-0.5 text-orange-300">₹{activeRow.ma100.toFixed(1)}</span>
              )}
            </button>

            <button
              onClick={() => onUpdateWidgetSettings({ showMA200: !widgetSettings.showMA200 })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all ${
                widgetSettings.showMA200
                  ? 'bg-purple-950/60 text-purple-400 border-purple-800/80'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              MA 200
              {activeRow?.ma200 !== undefined && (
                <span className="font-mono ml-0.5 text-purple-300">₹{activeRow.ma200.toFixed(1)}</span>
              )}
            </button>
          </div>
        </div>

        {/* Zoom & Reset Tools */}
        <div className="flex items-center gap-1">
          {onResetZoom && (
            <button
              onClick={onResetZoom}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Reset Zoom to full range"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {onZoom && (
            <>
              <button
                onClick={() => onZoom(0.75, 0.5)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onZoom(1.33, 0.5)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating HUD info bar */}
      {activeRow && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 bg-slate-950/40 text-xs border-b border-slate-800/40 font-mono">
          <div className="text-slate-300">
            <span className="text-slate-500 font-sans mr-1">Date:</span>
            {activeRow.displayDate || activeRow.date}
          </div>
          <div className="text-slate-300">
            <span className="text-slate-500 font-sans mr-1">O:</span>
            ₹{activeRow.open.toFixed(2)}
          </div>
          <div className="text-emerald-400">
            <span className="text-slate-500 font-sans mr-1">H:</span>
            ₹{activeRow.high.toFixed(2)}
          </div>
          <div className="text-rose-400">
            <span className="text-slate-500 font-sans mr-1">L:</span>
            ₹{activeRow.low.toFixed(2)}
          </div>
          <div className="font-semibold text-white">
            <span className="text-slate-500 font-sans mr-1">C:</span>
            ₹{activeRow.close.toFixed(2)}
          </div>
          {activeRow.change !== undefined && (
            <div
              className={`font-semibold ${
                activeRow.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {activeRow.change >= 0 ? '+' : ''}
              {activeRow.change.toFixed(2)} ({activeRow.changePercent?.toFixed(2)}%)
            </div>
          )}
          <div className="text-slate-400">
            <span className="text-slate-500 font-sans mr-1">Vol:</span>
            {(activeRow.volume / 100000).toFixed(2)}L
          </div>
          <div className="text-slate-400">
            <span className="text-slate-500 font-sans mr-1">Dly%:</span>
            {activeRow.deliveryPercent?.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full h-[380px] sm:h-[440px] cursor-crosshair select-none"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className="absolute inset-0 w-full h-full"
        />
        {/* Helper hint */}
        <div className="absolute bottom-2 left-3 text-[10px] text-slate-500/70 pointer-events-none font-sans">
          Drag horizontally to pan · Mouse wheel to zoom
        </div>
      </div>
    </div>
  );
};
