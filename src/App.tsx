import React, { useState, useCallback } from 'react';
import { useRealtimeStock } from './hooks/useRealtimeStock';
import { ChartMode, WidgetSettings } from './types';
import { Header } from './components/Header';
import { InteractiveChart } from './components/InteractiveChart';
import { RSIChart } from './components/RSIChart';
import { VolumeChart } from './components/VolumeChart';
import { TechnicalSignalsCard } from './components/TechnicalSignalsCard';
import { KeyStatsGrid } from './components/KeyStatsGrid';
import { LiveOrderBook } from './components/LiveOrderBook';
import { HistoricalDataTable } from './components/HistoricalDataTable';
import { IndicatorSettingsModal } from './components/IndicatorSettingsModal';
import { WidgetCustomizerModal } from './components/WidgetCustomizerModal';
import { Loader2, AlertCircle } from 'lucide-react';

const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  showPriceChart: true,
  showRSI: true,
  showVolume: true,
  showTechnicalSignals: true,
  showStatsCards: true,
  showOrderBook: true,
  showDataTable: true,
  showMA10: true,
  showMA50: true,
  showMA100: true,
  showMA200: true,
  showClosingLine: true,
  showVolumeMA: true,
};

export default function App() {
  const {
    allData,
    filteredData,
    visibleData,
    loading,
    timeRange,
    setTimeRange,
    selectedSeries,
    setSelectedSeries,
    indicatorConfig,
    setIndicatorConfig,
    technicalSignals,
    latestRow,
    isSimulating,
    simulationSpeed,
    toggleSimulation,
    setSimulationSpeed,
    stepSimulation,
    resetToLatestOriginal,
    viewWindow,
    setViewWindow,
    resetZoom,
  } = useRealtimeStock();

  const [chartMode, setChartMode] = useState<ChartMode>('candlestick');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>(DEFAULT_WIDGET_SETTINGS);

  // Modals state
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  const handleUpdateWidgetSettings = (partial: Partial<WidgetSettings>) => {
    setWidgetSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleResetWidgetSettings = () => {
    setWidgetSettings(DEFAULT_WIDGET_SETTINGS);
  };

  // Zoom handler
  const handleZoom = useCallback(
    (zoomFactor: number, focusRatio: number) => {
      if (filteredData.length <= 5) return;
      const currentSpan = viewWindow[1] - viewWindow[0];
      const newSpan = Math.max(10, Math.min(filteredData.length - 1, Math.round(currentSpan * zoomFactor)));
      const deltaSpan = newSpan - currentSpan;

      const newStart = Math.max(0, Math.round(viewWindow[0] - deltaSpan * focusRatio));
      const newEnd = Math.min(filteredData.length - 1, newStart + newSpan);

      setViewWindow([newStart, newEnd]);
    },
    [filteredData.length, viewWindow, setViewWindow]
  );

  // Pan handler
  const handlePan = useCallback(
    (deltaIndices: number) => {
      const span = viewWindow[1] - viewWindow[0];
      let newStart = viewWindow[0] + deltaIndices;
      let newEnd = viewWindow[1] + deltaIndices;

      if (newStart < 0) {
        newStart = 0;
        newEnd = Math.min(filteredData.length - 1, span);
      } else if (newEnd >= filteredData.length) {
        newEnd = filteredData.length - 1;
        newStart = Math.max(0, newEnd - span);
      }

      setViewWindow([newStart, newEnd]);
    },
    [filteredData.length, viewWindow, setViewWindow]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm font-medium tracking-wide">
          Loading 5-year WIPRO historical data and computing indicators...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Global Terminal Header */}
      <Header
        latestRow={latestRow}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        selectedSeries={selectedSeries}
        setSelectedSeries={setSelectedSeries}
        isSimulating={isSimulating}
        toggleSimulation={toggleSimulation}
        simulationSpeed={simulationSpeed}
        setSimulationSpeed={setSimulationSpeed}
        stepSimulation={stepSimulation}
        resetToLatestOriginal={resetToLatestOriginal}
        onOpenWidgetModal={() => setIsWidgetModalOpen(true)}
        onOpenIndicatorModal={() => setIsIndicatorModalOpen(true)}
      />

      {/* Main Terminal Viewport */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 space-y-4">
        {/* Key Statistics Grid */}
        {widgetSettings.showStatsCards && <KeyStatsGrid latestRow={latestRow} />}

        {/* Primary Analytical Grid (Chart + Technical Signals + Order Book) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Visualizations Column (8 or 12 cols) */}
          <div
            className={`space-y-4 ${
              widgetSettings.showTechnicalSignals || widgetSettings.showOrderBook
                ? 'lg:col-span-8 xl:col-span-9'
                : 'lg:col-span-12'
            }`}
          >
            {/* Primary Price & Moving Averages Chart */}
            {widgetSettings.showPriceChart && (
              <InteractiveChart
                data={visibleData}
                hoveredIndex={hoveredIndex}
                onHoverIndex={setHoveredIndex}
                widgetSettings={widgetSettings}
                onUpdateWidgetSettings={handleUpdateWidgetSettings}
                chartMode={chartMode}
                setChartMode={setChartMode}
                onPan={handlePan}
                onZoom={handleZoom}
                onResetZoom={resetZoom}
              />
            )}

            {/* Synchronized RSI Sub-Chart */}
            {widgetSettings.showRSI && (
              <RSIChart
                data={visibleData}
                hoveredIndex={hoveredIndex}
                onHoverIndex={setHoveredIndex}
                config={indicatorConfig}
              />
            )}

            {/* Synchronized Volume Sub-Chart */}
            {widgetSettings.showVolume && (
              <VolumeChart
                data={visibleData}
                hoveredIndex={hoveredIndex}
                onHoverIndex={setHoveredIndex}
                widgetSettings={widgetSettings}
              />
            )}
          </div>

          {/* Right Sidebar Widgets: Technical Signals & Order Book */}
          {(widgetSettings.showTechnicalSignals || widgetSettings.showOrderBook) && (
            <div className="lg:col-span-4 xl:col-span-3 space-y-4 flex flex-col">
              {widgetSettings.showTechnicalSignals && (
                <TechnicalSignalsCard signals={technicalSignals} latestRow={latestRow} />
              )}

              {widgetSettings.showOrderBook && (
                <LiveOrderBook latestRow={latestRow} isSimulating={isSimulating} />
              )}
            </div>
          )}
        </div>

        {/* Historical Data Table Widget */}
        {widgetSettings.showDataTable && (
          <HistoricalDataTable data={filteredData} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-3 mt-auto text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Wipro Limited Real-Time Terminal · Verified Data (04-Oct-2021 to 01-Oct-2026) · {allData.length} Total Sessions
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Wilder RSI (14)</span>
            <span>•</span>
            <span>SMA 10 / 50 / 100 / 200</span>
            <span>•</span>
            <span className="text-emerald-400">Low-Latency Rendering</span>
          </div>
        </div>
      </footer>

      {/* Indicator Configuration Modal */}
      <IndicatorSettingsModal
        isOpen={isIndicatorModalOpen}
        onClose={() => setIsIndicatorModalOpen(false)}
        config={indicatorConfig}
        onSave={setIndicatorConfig}
      />

      {/* Widget Layout Customizer Modal */}
      <WidgetCustomizerModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        settings={widgetSettings}
        onUpdate={handleUpdateWidgetSettings}
        onReset={handleResetWidgetSettings}
      />
    </div>
  );
}
