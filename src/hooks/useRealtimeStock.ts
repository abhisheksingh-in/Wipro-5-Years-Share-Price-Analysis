import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { StockRow, TimeRange, IndicatorConfig, TechnicalSignals } from '../types';
import { loadWiproStockData } from '../data/stockDataLoader';
import { calculateIndicators, computeTechnicalSignals, DEFAULT_INDICATOR_CONFIG } from '../utils/indicators';

export interface UseRealtimeStockReturn {
  allData: StockRow[];
  filteredData: StockRow[];
  visibleData: StockRow[];
  loading: boolean;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  selectedSeries: string;
  setSelectedSeries: (series: string) => void;
  indicatorConfig: IndicatorConfig;
  setIndicatorConfig: React.Dispatch<React.SetStateAction<IndicatorConfig>>;
  technicalSignals: TechnicalSignals;
  latestRow: StockRow | null;
  // Simulation controls
  isSimulating: boolean;
  simulationSpeed: number;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  stepSimulation: () => void;
  resetToLatestOriginal: () => void;
  // Viewport / Zoom
  viewWindow: [number, number]; // [startIndex, endIndex]
  setViewWindow: (window: [number, number]) => void;
  resetZoom: () => void;
}

export function useRealtimeStock(): UseRealtimeStockReturn {
  const [rawData, setRawData] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [selectedSeries, setSelectedSeries] = useState<string>('ALL');
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(DEFAULT_INDICATOR_CONFIG);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [simulatedData, setSimulatedData] = useState<StockRow[]>([]);

  // Viewport window
  const [viewWindow, setViewWindow] = useState<[number, number]>([0, 0]);

  // Initial load
  useEffect(() => {
    let mounted = true;
    loadWiproStockData().then((rows) => {
      if (mounted) {
        setRawData(rows);
        setSimulatedData(rows);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Filter by series if chosen
  const seriesFiltered = useMemo(() => {
    if (selectedSeries === 'ALL') return simulatedData;
    return simulatedData.filter((r) => r.series === selectedSeries);
  }, [simulatedData, selectedSeries]);

  // Recalculate indicators whenever config or data changes
  const computedData = useMemo(() => {
    return calculateIndicators(seriesFiltered, indicatorConfig);
  }, [seriesFiltered, indicatorConfig]);

  // Filter by timeframe
  const filteredData = useMemo(() => {
    if (computedData.length === 0) return [];
    if (timeRange === 'ALL') return computedData;

    const latestTimestamp = computedData[computedData.length - 1].timestamp;
    let daysToSubtract = 365;

    switch (timeRange) {
      case '1M':
        daysToSubtract = 30;
        break;
      case '3M':
        daysToSubtract = 90;
        break;
      case '6M':
        daysToSubtract = 180;
        break;
      case '1Y':
        daysToSubtract = 365;
        break;
      case '3Y':
        daysToSubtract = 365 * 3;
        break;
      case '5Y':
        daysToSubtract = 365 * 5;
        break;
    }

    const cutoff = latestTimestamp - daysToSubtract * 24 * 60 * 60 * 1000;
    const res = computedData.filter((r) => r.timestamp >= cutoff);
    return res.length > 0 ? res : computedData.slice(-60);
  }, [computedData, timeRange]);

  // Reset viewport window whenever filteredData length changes significantly
  useEffect(() => {
    if (filteredData.length > 0) {
      setViewWindow([0, filteredData.length - 1]);
    }
  }, [timeRange, selectedSeries, filteredData.length === 0]);

  // Visible sliced data according to zoom/pan window
  const visibleData = useMemo(() => {
    if (filteredData.length === 0) return [];
    const start = Math.max(0, Math.min(viewWindow[0], filteredData.length - 2));
    const end = Math.max(start + 2, Math.min(viewWindow[1], filteredData.length - 1));
    return filteredData.slice(start, end + 1);
  }, [filteredData, viewWindow]);

  const latestRow = useMemo(() => {
    if (computedData.length === 0) return null;
    return computedData[computedData.length - 1];
  }, [computedData]);

  const technicalSignals = useMemo(() => {
    return computeTechnicalSignals(computedData, indicatorConfig);
  }, [computedData, indicatorConfig]);

  // Single simulation tick step
  const stepSimulation = useCallback(() => {
    setSimulatedData((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      // Random walk price delta (-0.8% to +0.8%)
      const deltaPercent = (Math.random() - 0.49) * 0.016;
      const newClose = Number(Math.max(10, last.close * (1 + deltaPercent)).toFixed(2));
      const newHigh = Number(Math.max(last.high, newClose).toFixed(2));
      const newLow = Number(Math.min(last.low, newClose).toFixed(2));
      const addedVolume = Math.floor(Math.random() * 25000 + 5000);
      const newVolume = last.volume + addedVolume;

      // Update the current latest bar in real time
      const updatedLast: StockRow = {
        ...last,
        close: newClose,
        high: newHigh,
        low: newLow,
        lastPrice: newClose,
        last: newClose,
        volume: newVolume,
        trades: last.trades + Math.floor(Math.random() * 80 + 10),
      };

      return [...prev.slice(0, -1), updatedLast];
    });
  }, []);

  // Simulation timer loop
  useEffect(() => {
    if (!isSimulating) return;

    // Interval inversely proportional to speed (1x = 1000ms, 2x = 500ms, 5x = 200ms, 10x = 100ms)
    const intervalMs = Math.max(50, Math.round(1000 / simulationSpeed));
    const timer = setInterval(() => {
      stepSimulation();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed, stepSimulation]);

  const toggleSimulation = () => setIsSimulating((prev) => !prev);

  const resetToLatestOriginal = () => {
    setIsSimulating(false);
    setSimulatedData(rawData);
  };

  const resetZoom = () => {
    if (filteredData.length > 0) {
      setViewWindow([0, filteredData.length - 1]);
    }
  };

  return {
    allData: computedData,
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
  };
}
