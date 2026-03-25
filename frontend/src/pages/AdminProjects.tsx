import { useEffect, useMemo, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api } from '../context/AuthContext';

interface ProjectRecord {
  id: string;
  projectNo: string;
  name: string;
  blocks: { id: string; name: string }[];
}

interface PropertyRecord {
  id: string;
  propertyNo: string;
  type: 'PLOT' | 'SHOP';
  sizeSqYards: number;
  ratePerSqYard: number;
  plc: number;
  totalAmount: number;
  status: 'PENDING' | 'BOOKED';
  block?: {
    id: string;
    name: string;
    project?: {
      id: string;
      projectNo: string;
      name: string;
    };
  };
  sales?: Array<{
    agent?: {
      name: string;
      userId: string;
    };
  }>;
}

const emptyProjectForm = { projectNo: '', name: '', blocks: 'A,B,C' };
const emptyBlockForm = { projectId: '', name: '' };
const emptyPropertyForm = {
  propertyNo: '',
  type: 'PLOT',
  sizeSqYards: '',
  ratePerSqYard: '',
  plc: '0',
  dimension: '',
  blockId: '',
};

const AdminProjects = () => {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [blockForm, setBlockForm] = useState(emptyBlockForm);
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const blocks = useMemo(
    () => projects.flatMap((project) => project.blocks.map((block) => ({ ...block, projectName: project.name }))),
    [projects],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectResponse, propertyResponse] = await Promise.all([
        api.get<ProjectRecord[]>('/inventory/projects'),
        api.get<PropertyRecord[]>('/inventory/properties'),
      ]);
      setProjects(projectResponse.data);
      setProperties(propertyResponse.data);
    } catch (error) {
      console.error('Error loading inventory data', error);
      setMessage('Failed to load project inventory from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/inventory/projects', {
        projectNo: projectForm.projectNo,
        name: projectForm.name,
        blocks: projectForm.blocks.split(',').map((value) => value.trim()).filter(Boolean),
      });
      setProjectForm(emptyProjectForm);
      setMessage('Project created successfully.');
      await loadData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to create project.');
    }
  };

  const handleCreateBlock = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/inventory/blocks', blockForm);
      setBlockForm(emptyBlockForm);
      setMessage('Block added successfully.');
      await loadData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to add block.');
    }
  };

  const handleCreateProperty = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/inventory/properties', {
        ...propertyForm,
        sizeSqYards: Number(propertyForm.sizeSqYards),
        ratePerSqYard: Number(propertyForm.ratePerSqYard),
        plc: Number(propertyForm.plc || 0),
      });
      setPropertyForm(emptyPropertyForm);
      setMessage('Property created successfully.');
      await loadData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to create property.');
    }
  };

  const columns = [
    { header: 'Project Ref', field: 'projectNo' },
    { header: 'Block', field: 'block' },
    { header: 'Property No', field: 'propertyNo' },
    { header: 'Type', field: 'type' },
    { header: 'Size (SqYd)', field: 'sizeSqYards' },
    { header: 'Base Rate / SqYd', field: 'ratePerSqYard' },
    { header: 'PLC', field: 'plc' },
    { header: 'Total Value (INR)', field: 'totalAmount' },
    { header: 'Selling Agent', field: 'agentName' },
    { header: 'Status', field: 'statusDisplay' },
  ];

  const tableData = properties.map((property) => ({
    ...property,
    projectNo: property.block?.project?.projectNo || '-',
    block: property.block?.name || '-',
    ratePerSqYard: property.ratePerSqYard.toLocaleString('en-IN'),
    plc: property.plc > 0 ? property.plc.toLocaleString('en-IN') : '0',
    totalAmount: property.totalAmount.toLocaleString('en-IN'),
    agentName: property.sales?.[0]?.agent ? `${property.sales[0].agent.name} (${property.sales[0].agent.userId})` : '-',
    statusDisplay: property.status === 'BOOKED'
      ? <span className="bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Booked</span>
      : <span className="bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">Available</span>,
  }));

  return (
    <div className="space-y-4 p-4">
      {message ? (
        <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <form onSubmit={handleCreateProject} className="space-y-3 border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Create Project</h3>
          <input value={projectForm.projectNo} onChange={(event) => setProjectForm((current) => ({ ...current, projectNo: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="Project number" required />
          <input value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="Project name" required />
          <input value={projectForm.blocks} onChange={(event) => setProjectForm((current) => ({ ...current, blocks: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="Blocks, comma separated" required />
          <button type="submit" className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Add Project</button>
        </form>

        <form onSubmit={handleCreateBlock} className="space-y-3 border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Add Block</h3>
          <select value={blockForm.projectId} onChange={(event) => setBlockForm((current) => ({ ...current, projectId: event.target.value }))} className="w-full border px-3 py-2 text-sm" required>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.projectNo})
              </option>
            ))}
          </select>
          <input value={blockForm.name} onChange={(event) => setBlockForm((current) => ({ ...current, name: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="Block name" required />
          <button type="submit" className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Add Block</button>
        </form>

        <form onSubmit={handleCreateProperty} className="grid gap-3 border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Create Property</h3>
          <select value={propertyForm.blockId} onChange={(event) => setPropertyForm((current) => ({ ...current, blockId: event.target.value }))} className="w-full border px-3 py-2 text-sm" required>
            <option value="">Select block</option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.projectName} / Block {block.name}
              </option>
            ))}
          </select>
          <input value={propertyForm.propertyNo} onChange={(event) => setPropertyForm((current) => ({ ...current, propertyNo: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="Property number" required />
          <select value={propertyForm.type} onChange={(event) => setPropertyForm((current) => ({ ...current, type: event.target.value }))} className="w-full border px-3 py-2 text-sm">
            <option value="PLOT">Plot</option>
            <option value="SHOP">Shop</option>
          </select>
          <input value={propertyForm.sizeSqYards} onChange={(event) => setPropertyForm((current) => ({ ...current, sizeSqYards: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="Size in sq yd" required />
          <input value={propertyForm.ratePerSqYard} onChange={(event) => setPropertyForm((current) => ({ ...current, ratePerSqYard: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="Rate per sq yd" required />
          <input value={propertyForm.plc} onChange={(event) => setPropertyForm((current) => ({ ...current, plc: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="PLC" />
          <input value={propertyForm.dimension} onChange={(event) => setPropertyForm((current) => ({ ...current, dimension: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="Dimension" />
          <button type="submit" className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Add Property</button>
        </form>
      </div>

      <LegacyTable title="Full Property & Units Master" dateRange={false} columns={columns} data={loading ? [] : tableData} />
    </div>
  );
};

export default AdminProjects;
