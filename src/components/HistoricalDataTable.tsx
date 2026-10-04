import React, { useState, useMemo } from 'react';
import { StockRow } from '../types';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from 'lucide-react';

interface HistoricalDataTableProps {
  data: StockRow[];
}

export const HistoricalDataTable: React.FC<HistoricalDataTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof StockRow>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleSort = (field: keyof StockRow) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.displayDate.toLowerCase().includes(q) ||
          r.date.includes(q) ||
          r.series.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchTerm, sortField, sortOrder]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Export current filtered rows to CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Date',
      'Series',
      'Open',
      'High',
      'Low',
      'Close',
      'MA 10',
      'MA 50',
      'MA 100',
      'MA 200',
      'RSI (14)',
      'Volume',
      'Turnover (₹)',
      'Delivery %',
    ];

    const csvRows = [
      headers.join(','),
      ...filtered.map((r) =>
        [
          r.displayDate || r.date,
          r.series,
          r.open,
          r.high,
          r.low,
          r.close,
          r.ma10 ?? '',
          r.ma50 ?? '',
          r.ma100 ?? '',
          r.ma200 ?? '',
          r.rsi ?? '',
          r.volume,
          r.turnover,
          r.deliveryPercent,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WIPRO_Technical_Data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by date (e.g. Sep-2026, 2024)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 w-56 sm:w-72"
            />
          </div>
          <span className="text-xs text-slate-500">
            {filtered.length} {filtered.length === 1 ? 'row' : 'rows'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs font-mono">
          <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800 select-none">
            <tr>
              <th
                onClick={() => handleSort('timestamp')}
                className="py-2.5 px-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Date <ArrowUpDown className="w-3 h-3 text-slate-600" />
                </div>
              </th>
              <th className="py-2.5 px-2">Series</th>
              <th
                onClick={() => handleSort('open')}
                className="py-2.5 px-2 cursor-pointer hover:text-white text-right"
              >
                Open (₹)
              </th>
              <th
                onClick={() => handleSort('high')}
                className="py-2.5 px-2 cursor-pointer hover:text-white text-right"
              >
                High (₹)
              </th>
              <th
                onClick={() => handleSort('low')}
                className="py-2.5 px-2 cursor-pointer hover:text-white text-right"
              >
                Low (₹)
              </th>
              <th
                onClick={() => handleSort('close')}
                className="py-2.5 px-2 cursor-pointer hover:text-white text-right"
              >
                Close (₹)
              </th>
              <th
                onClick={() => handleSort('ma10')}
                className="py-2.5 px-2 cursor-pointer hover:text-white text-right text-cyan-400"
              >
                MA 10
              </th>
              <th
                onClick={() => handleSort('ma50')}
                className="py-2.5 px-2 cursor-pointer hover:text-white text-right text-yellow-400"
              >
                MA 50
              </th>
              <th
                onClick={() => handleSort('ma100')}
                className="py-2.5 px-2 cursor-pointer hover:text-white text-right text-orange-400"
              >
                MA 100
              </th>
              <th
                onClick={() => handleSort('ma200')}
                className="py-2.5 px-2 cursor-pointer hover:text-white text-right text-purple-400"
              >
                MA 200
              </th>
              <th
                onClick={() => handleSort('rsi')}
                className="py-2.5 px-2 cursor-pointer hover:text-white text-center text-sky-400"
              >
                RSI (14)
              </th>
              <th
                onClick={() => handleSort('volume')}
                className="py-2.5 px-3 cursor-pointer hover:text-white text-right"
              >
                Volume
              </th>
              <th
                onClick={() => handleSort('deliveryPercent')}
                className="py-2.5 px-3 cursor-pointer hover:text-white text-right"
              >
                Dly %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {pageRows.map((row, idx) => {
              const isUp = (row.change ?? 0) >= 0;
              return (
                <tr
                  key={idx}
                  className="hover:bg-slate-800/40 transition-colors text-slate-300"
                >
                  <td className="py-2 px-3 text-slate-200 font-semibold whitespace-nowrap">
                    {row.displayDate || row.date}
                  </td>
                  <td className="py-2 px-2 text-slate-500">{row.series}</td>
                  <td className="py-2 px-2 text-right">₹{row.open.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right text-emerald-400">₹{row.high.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right text-rose-400">₹{row.low.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right font-bold text-white">
                    ₹{row.close.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right text-cyan-300">
                    {row.ma10 ? `₹${row.ma10.toFixed(1)}` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-yellow-300">
                    {row.ma50 ? `₹${row.ma50.toFixed(1)}` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-orange-300">
                    {row.ma100 ? `₹${row.ma100.toFixed(1)}` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-purple-300">
                    {row.ma200 ? `₹${row.ma200.toFixed(1)}` : '—'}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {row.rsi ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          row.rsi >= 70
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                            : row.rsi <= 30
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-sky-300'
                        }`}
                      >
                        {row.rsi.toFixed(1)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {row.volume.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {row.deliveryPercent > 0 ? `${row.deliveryPercent.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 mt-2">
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
