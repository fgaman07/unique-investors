import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Users, User } from 'lucide-react';

const UserTree = () => {
  const [treeData, setTreeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const { data } = await api.get('/mlm/tree');
        setTreeData(data);
      } catch (error) {
        console.error('Error fetching MLM tree', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  const renderNode = (node: any, level: number = 0) => {
    if (!node) return null;
    
    // Safety check for circular references or extreme depth
    if (level > 6) return <div className="text-xs text-gray-500 mt-2">...max depth reached</div>;

    return (
      <div key={node.id} className="flex flex-col items-center mt-4">
        <div className={`p-3 border-2 rounded shadow-sm w-48 text-center relative z-10 transition-transform hover:scale-105 cursor-pointer
          ${level === 0 ? 'bg-orange-50 border-orange-400' : 'bg-white border-blue-300'}`}>
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 
            ${level === 0 ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
            {level === 0 ? <Users size={16} /> : <User size={16} />}
          </div>
          
          <p className="font-bold text-gray-800 text-sm truncate">{node.name}</p>
          <p className="text-xs text-brand-primary font-medium">{node.userId}</p>
          <div className="mt-1 bg-gray-100 text-gray-600 text-[10px] uppercase py-0.5 rounded">
            {node.rank}
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <>
            <div className="h-6 w-px bg-gray-400 -z-10 relative"></div>
            <div className="relative flex justify-center w-full px-2">
              {/* Horizontal connection line for multiple children */}
              {node.children.length > 1 && (
                <div className="absolute top-0 h-px bg-gray-400" 
                     style={{ 
                       left: `calc(50% / ${node.children.length})`, 
                       right: `calc(50% / ${node.children.length})` 
                     }}>
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                {node.children.map((child: any) => (
                  <div key={child.id} className="relative pt-4">
                    <div className="absolute top-0 left-1/2 w-px h-4 bg-gray-400 -translate-x-1/2"></div>
                    {renderNode(child, level + 1)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Generating Neural Network...</div>;
  if (!treeData) return <div className="p-8 text-center text-red-500">Failed to load tree</div>;

  return (
    <div className="p-4 h-[85vh] flex flex-col">
      <div className="bg-[#f5f6f8] border border-gray-300 px-4 py-2 text-[14px] font-bold text-gray-700 mb-4 drop-shadow-sm flex justify-between items-center">
        <span>Genealogy Tree Structure</span>
        <button onClick={() => window.location.reload()} className="text-xs bg-brand-primary text-white px-3 py-1 rounded shadow hover:bg-brand-sidebarHover focus:outline-none">
          Refresh Tree
        </button>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded shadow-inner overflow-auto relative custom-scrollbar p-8 flex justify-center">
        {/* The Tree */}
        <div className="min-w-max pb-16">
          {renderNode(treeData)}
        </div>
      </div>
    </div>
  );
};

export default UserTree;
