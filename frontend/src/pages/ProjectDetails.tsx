import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../context/AuthContext';

interface Project { id: string; projectNo: string; name: string; blocks: Block[]; }
interface Block { id: string; name: string; properties: Property[]; }
interface Property { id: string; propertyNo: string; type: string; sizeSqYards: number; ratePerSqYard: number; totalAmount: number; status: string; dimension?: string; }

const ProjectDetails = () => {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projectsList'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/projects?include=blocks');
      return data;
    },
  });
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const currentProject = projects.find(p => p.id === selectedProject);
  const blocks = currentProject?.blocks ?? [];
  const propertyTypes = ['PLOT', 'SHOP'];

  const handleShow = () => {
    if (!selectedProject) return;
    setLoading(true);
    api.get(`/inventory/properties?projectId=${selectedProject}${selectedBlock ? `&blockId=${selectedBlock}` : ''}${selectedType ? `&type=${selectedType}` : ''}`)
      .then(r => setResults(r.data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="inline-block px-4 py-1.5 bg-white border border-gray-200 border-b-0 rounded-t-sm shadow-sm ml-2">
        <span className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">Project Details</span>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        {/* Filter Row - Labels */}
        <div className="grid grid-cols-1 md:grid-cols-3 bg-[#E0F7FA] border-b border-cyan-100">
          {['Project Name', 'Type', 'Block'].map(label => (
            <div key={label} className="p-2 px-4 border-b md:border-b-0 md:border-r border-cyan-100 last:border-0">
              <span className="text-[13px] font-bold text-blue-900">{label}</span>
            </div>
          ))}
        </div>

        {/* Filter Row - Selects */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100">
          <div className="p-2 border-b md:border-b-0 md:border-r border-gray-100">
            <select value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setSelectedBlock(''); }} className="w-full border border-gray-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400">
              <option value="">-- Select Project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.projectNo})</option>)}
            </select>
          </div>
          <div className="p-2 border-b md:border-b-0 md:border-r border-gray-100">
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400">
              <option value="">-- All Types --</option>
              {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="p-2">
            <select value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)} disabled={!selectedProject} className="w-full border border-gray-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400">
              <option value="">-- All Blocks --</option>
              {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {/* Show Button */}
        <div className="p-3 flex justify-center border-b border-gray-100 bg-[#E0F7FA]/30">
          <button onClick={handleShow} className="bg-[#247BA0] hover:bg-[#1D6381] text-white px-10 py-1.5 text-[13px] font-medium transition-colors shadow-sm">
            Show
          </button>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto min-h-[200px]">
          {loading ? (
            <div className="p-10 text-center text-gray-500 italic">Loading properties...</div>
          ) : results.length > 0 ? (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#D1D1D1] border-b border-gray-400">
                  {['Property No.', 'Type', 'Size (Sq.Yd)', 'Rate/Sq.Yd', 'Total Amount', 'Dimension', 'Status'].map(h => (
                    <th key={h} className="p-2 border-r border-white text-[11px] font-bold text-gray-800 uppercase text-center">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((prop, idx) => (
                  <tr key={idx} className={`hover:bg-gray-50 border-b border-gray-100 text-center ${prop.status === 'BOOKED' ? 'bg-red-50' : ''}`}>
                    <td className="p-2 border-r border-gray-200 font-semibold">{prop.propertyNo}</td>
                    <td className="p-2 border-r border-gray-200">{prop.type}</td>
                    <td className="p-2 border-r border-gray-200">{prop.sizeSqYards}</td>
                    <td className="p-2 border-r border-gray-200">₹ {prop.ratePerSqYard?.toLocaleString('en-IN')}</td>
                    <td className="p-2 border-r border-gray-200 font-semibold text-blue-700">₹ {prop.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-2 border-r border-gray-200 text-gray-500">{prop.dimension || '-'}</td>
                    <td className={`p-2 font-semibold ${prop.status === 'BOOKED' ? 'text-red-500' : 'text-green-600'}`}>{prop.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-gray-400 italic">
              {selectedProject ? 'No properties found for selected filters.' : 'Select a project to view its properties.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
