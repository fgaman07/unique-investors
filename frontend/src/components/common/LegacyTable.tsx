import type { FC } from 'react';
import { Download, RefreshCw } from 'lucide-react';

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
}

const LegacyTable: FC<LegacyTableProps> = ({ title, dateRange, columns, data, rowHighlight }) => {
  return (
    <div className="w-full bg-white flex flex-col space-y-1">
      {/* Top Title Bar */}
      <div className="bg-[#f5f6f8] border border-gray-300 px-3 py-1 text-[13px] font-semibold text-gray-700 flex justify-between items-center">
        <span>{title}</span>
        <div className="flex items-center space-x-3 text-gray-500">
          <button title="Export to Excel" className="hover:text-green-600 transition-colors">
            <Download size={14} />
          </button>
          <button title="Refresh" onClick={() => window.location.reload()} className="hover:text-blue-600 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Optional Date Range Search Bar exactly matching Image 1 & 4 */}
      {dateRange && (
        <div className="flex flex-row items-center border border-brand-primary w-full">
          <div className="bg-brand-sidebarHover text-white px-2 py-0.5 text-xs font-semibold w-24 border-r border-brand-primary">From</div>
          <input type="date" className="border-none px-2 text-xs h-6 flex-1 outline-none bg-[#eefcfd]" defaultValue="2013-01-12" />
          
          <div className="bg-brand-sidebarHover text-white px-2 py-0.5 text-xs font-semibold w-24 border-l border-r border-brand-primary">To</div>
          <input type="date" className="border-none px-2 text-xs h-6 flex-1 outline-none bg-[#eefcfd]" defaultValue="2026-03-20" />
        </div>
      )}

      {dateRange && (
         <div className="flex justify-center my-1">
           <button className="bg-white border border-[#4d3283] px-4 py-0 text-xs font-bold text-[#4d3283] w-24">
             Generate
           </button>
         </div>
      )}

      {/* Pagination & Search Controls */}
      <div className="bg-[#e9ecee] border border-gray-300 px-2 py-1 flex items-center space-x-2 text-xs">
        <button className="px-1 text-gray-500 hover:text-black">|&lt;</button>
        <button className="px-1 text-gray-500 hover:text-black">&lt;</button>
        <span className="text-gray-600">
          <input type="text" className="w-8 border border-gray-400 px-1 mx-1 text-center" defaultValue="1" /> 
          of 1
        </span>
        <button className="px-1 text-gray-500 hover:text-black">&gt;</button>
        <button className="px-1 text-gray-500 hover:text-black">&gt;|</button>
        
        <div className="h-4 border-r border-gray-400 mx-2"></div>
        <input type="text" className="border px-1 w-32 border-gray-400" />
        <span className="text-gray-600 text-[11px] cursor-pointer hover:underline mx-1">Find</span> | 
        <span className="text-gray-600 text-[11px] cursor-pointer hover:underline mx-1">Next</span>
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
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowHighlight ? rowHighlight(row) : ''}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>{row[col.field] !== undefined ? row[col.field] : '-'}</td>
                  ))}
                </tr>
              ))
            ) : null}
            
            {/* Empty rows to mimic legacy system full-height grid */}
            {Array.from({ length: Math.max(0, 10 - data.length) }).map((_, i) => (
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
