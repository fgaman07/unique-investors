import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Building, Map, Square, Activity } from 'lucide-react';

const ProjectDetails = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get('/inventory/projects');
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Inventory...</div>;

  return (
    <div className="p-4 bg-gray-50 min-h-full space-y-6">
      <div className="bg-[#f5f6f8] border border-gray-300 px-4 py-2 text-[14px] font-bold text-gray-700 drop-shadow-sm flex items-center">
        <Building size={18} className="mr-2 text-brand-primary" />
        Live Real Estate Inventory Details
      </div>

      {projects.map((project: any) => (
        <div key={project.id} className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden mb-8">
          {/* Project Header */}
          <div className="bg-brand-sidebar text-white px-6 py-4 flex justify-between items-center border-b border-brand-sidebarHover cursor-pointer">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide">{project.name}</h2>
              <p className="text-sm opacity-90 mt-1 flex items-center"><Map size={14} className="mr-1"/> Project Ref: {project.projectNo}</p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-sm border border-white/30 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80 block">Status</span>
              <span className="font-bold flex items-center"><Activity size={14} className="mr-1 text-green-300"/> ACTIVE PHASES: {project.blocks.length}</span>
            </div>
          </div>

          <div className="p-6">
            {project.blocks.map((block: any) => {
              const totalProps = block.properties.length;
              const bookedProps = block.properties.filter((p: any) => p.status === 'BOOKED').length;
              const availableProps = totalProps - bookedProps;
              const progress = totalProps === 0 ? 0 : Math.round((bookedProps / totalProps) * 100);

              return (
                <div key={block.id} className="mb-6 border border-gray-200 shadow-sm rounded-sm">
                  {/* Block Header */}
                  <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-200">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center">
                      <Square size={16} className="text-brand-primary mr-2" />
                      Block {block.name}
                    </h3>
                    <div className="flex space-x-4 text-xs font-medium">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Available: {availableProps}</span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Booked: {bookedProps}</span>
                    </div>
                  </div>

                  {/* Property Grid Grid */}
                  <div className="p-4 bg-white grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {block.properties.map((prop: any) => (
                      <div 
                        key={prop.id} 
                        className={`border rounded-sm p-3 relative flex flex-col items-center justify-center transition-transform hover:scale-[1.02] cursor-default
                          ${prop.status === 'BOOKED' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
                      >
                        {/* Status Strip */}
                        <div className={`absolute top-0 w-full h-1 left-0 rounded-t-sm
                          ${prop.status === 'BOOKED' ? 'bg-red-400' : 'bg-green-400'}`}>
                        </div>

                        <span className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-wider">{prop.type}</span>
                        <span className={`text-xl font-black ${prop.status === 'BOOKED' ? 'text-red-700' : 'text-green-700'}`}>
                          {prop.propertyNo}
                        </span>
                        <div className="text-[10px] text-gray-600 mt-2 text-center w-full border-t border-gray-200/50 pt-2">
                          <p>{prop.sizeSqYards} Sq.Yd</p>
                          <p className="font-semibold">₹{(prop.totalAmount/100000).toFixed(2)} Lakhs</p>
                        </div>

                        {prop.status === 'BOOKED' && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-sm border border-red-300">
                            <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-sm rotate-[-15deg] shadow-sm transform scale-110">
                              SOLD OUT
                            </span>
                            {prop.sales?.[0] && (
                              <span className="text-[9px] font-bold text-red-800 mt-2 text-center bg-white/80 px-1 rounded-sm">
                                Ref: {prop.sales[0].agent?.userId}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Block Progress Bar */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center">
                    <span className="w-24">Sold out {progress}%</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full mx-2 overflow-hidden">
                      <div className="h-full bg-brand-primary" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectDetails;
