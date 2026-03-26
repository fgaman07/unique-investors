import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { Download, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';

interface Column {
  header: string;
  field: string;
}

interface LegacyTableProps {
  title: string;
  dateRange?: boolean;
  columns: Column[];
  data: any[];
  rowHighlight?: (row: any) => string;
  onDateFilter?: (from: string, to: string) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const LegacyTable: FC<LegacyTableProps> = ({ title, dateRange, columns, data, rowHighlight, onDateFilter }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter data by search term across all visible columns
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.field];
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.toLowerCase().includes(lower);
        if (typeof value === 'number') return value.toString().includes(lower);
        return false;
      })
    );
  }, [data, searchTerm, columns]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Reset to page 1 when data or search changes
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // CSV Export
  const handleExport = () => {
    const csvRows: string[] = [];
    // Header row
    csvRows.push(columns.map((col) => `"${col.header}"`).join(','));
    // Data rows
    for (const row of filteredData) {
      const rowData = columns.map((col) => {
        const val = row[col.field];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'object') return '""'; // Skip React elements
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(rowData.join(','));
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDateGenerate = () => {
    if (onDateFilter) {
      onDateFilter(fromDate, toDate);
    }
  };

  return (
    <div className="w-full bg-white flex flex-col space-y-1">
      {/* Top Title Bar */}
      <div className="bg-[#f5f6f8] border border-gray-300 px-3 py-1 text-[13px] font-semibold text-gray-700 flex justify-between items-center">
        <span>{title}</span>
        <div className="flex items-center space-x-3 text-gray-500">
          <button title="Export to CSV" onClick={handleExport} className="hover:text-green-600 transition-colors">
            <Download size={14} />
          </button>
          <button title="Refresh" onClick={() => window.location.reload()} className="hover:text-blue-600 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Optional Date Range Search Bar */}
      {dateRange && (
        <div className="flex flex-row items-center border border-brand-primary w-full">
          <div className="bg-brand-sidebarHover text-white px-2 py-0.5 text-xs font-semibold w-24 border-r border-brand-primary">From</div>
          <input
            type="date"
            className="border-none px-2 text-xs h-6 flex-1 outline-none bg-[#eefcfd]"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <div className="bg-brand-sidebarHover text-white px-2 py-0.5 text-xs font-semibold w-24 border-l border-r border-brand-primary">To</div>
          <input
            type="date"
            className="border-none px-2 text-xs h-6 flex-1 outline-none bg-[#eefcfd]"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      )}

      {dateRange && (
        <div className="flex justify-center my-1">
          <button
            onClick={handleDateGenerate}
            className="bg-white border border-[#4d3283] px-4 py-0 text-xs font-bold text-[#4d3283] w-24 hover:bg-[#4d3283] hover:text-white transition-colors"
          >
            Generate
          </button>
        </div>
      )}

      {/* Pagination & Search Controls */}
      <div className="bg-[#e9ecee] border border-gray-300 px-2 py-1 flex items-center justify-between text-xs flex-wrap gap-1">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safePage <= 1}
            className="px-1 text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
            title="First page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="px-1 text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-gray-600">
            Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="px-1 text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safePage >= totalPages}
            className="px-1 text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
            title="Last page"
          >
            <ChevronsRight size={14} />
          </button>

          <div className="h-4 border-r border-gray-400 mx-2"></div>
          <span className="text-gray-500">Show</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border border-gray-400 px-1 text-xs bg-white"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-gray-500">per page</span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-gray-500">{filteredData.length} records</span>
          <div className="h-4 border-r border-gray-400 mx-2"></div>
          <Search size={12} className="text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border px-2 py-0.5 w-40 border-gray-400 text-xs"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* The Actual Data Table */}
      <div className="overflow-x-auto border border-brand-primary w-full">
        <table className="legacy-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowHighlight ? rowHighlight(row) : ''}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>{row[col.field] !== undefined ? row[col.field] : '-'}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center text-gray-400 py-4">
                  {data.length === 0 ? 'No data available' : 'No matching records found'}
                </td>
              </tr>
            )}
            
            {/* Empty rows to maintain minimum height */}
            {Array.from({ length: Math.max(0, Math.min(5, pageSize) - paginatedData.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                {columns.map((_, idx) => <td key={`empty-td-${idx}`}>&nbsp;</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LegacyTable;
