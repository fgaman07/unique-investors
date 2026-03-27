import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import LegacyTable from '../components/common/LegacyTable';
import { api } from '../context/AuthContext';

interface ProjectRecord {
  id: string;
  projectNo: string;
  name: string;
  directCommission: number | null;
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
      directCommission: number | null;
    };
  };
  sales?: Array<{
    agent?: {
      name: string;
      userId: string;
    };
  }>;
}

const emptyProjectForm = { projectNo: '', name: '', directCommission: '', blocks: 'A,B,C' };
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

const emptyBookingForm = {
  agentId: '',
  receiptNo: '',
  paidAmount: '',
  saleDate: new Date().toISOString().split('T')[0],
};

const AdminProjects = () => {
  const { data, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['adminInventory'],
    queryFn: async () => {
      const [projectResponse, propertyResponse, usersResponse] = await Promise.all([
        api.get<ProjectRecord[]>('/inventory/projects'),
        api.get<PropertyRecord[]>('/inventory/properties'),
        api.get('/auth/users?limit=1000')
      ]);
      const usersData = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.users;
      return {
        projects: projectResponse.data,
        properties: propertyResponse.data,
        agents: (usersData || []).filter((u: any) => u.role !== 'ADMIN')
      };
    }
  });

  const projects = data?.projects || [];
  const properties = data?.properties || [];
  const agents = data?.agents || [];

  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [blockForm, setBlockForm] = useState(emptyBlockForm);
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);
  
  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyRecord | null>(null);
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);
  const [message, setMessage] = useState('');

  const blocks = useMemo(
    () => projects.flatMap((project) => (project.blocks || []).map((block) => ({ ...block, projectName: project.name }))),
    [projects]
  );

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/inventory/projects', {
        projectNo: projectForm.projectNo,
        name: projectForm.name,
        directCommission: projectForm.directCommission ? Number(projectForm.directCommission) : undefined,
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
    { header: 'Direct Comm (%)', field: 'directCommissionDisplay' },
    { header: 'Block', field: 'block' },
    { header: 'Property No', field: 'propertyNo' },
    { header: 'Type', field: 'type' },
    { header: 'Size (SqYd)', field: 'sizeSqYards' },
    { header: 'Base Rate / SqYd', field: 'ratePerSqYard' },
    { header: 'PLC', field: 'plc' },
    { header: 'Total Value (INR)', field: 'totalAmount' },
    { header: 'Selling Agent', field: 'agentName' },
    { header: 'Status', field: 'statusDisplay' },
    { header: 'Actions', field: 'actions' },
  ];

  const openBookingModal = (property: PropertyRecord) => {
    setSelectedProperty(property);
    setBookingForm(emptyBookingForm);
    setIsBookingModalOpen(true);
    setMessage('');
  };

  const handleBookProperty = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProperty) return;

    try {
      await api.post('/sales', {
        ...bookingForm,
        propertyId: selectedProperty.id,
        paidAmount: Number(bookingForm.paidAmount),
        saleDate: bookingForm.saleDate || undefined,
      });
      setIsBookingModalOpen(false);
      setMessage('Property booked and sale recorded successfully!');
      await loadData(); // Refresh table view to show Booked status
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to book property.');
    }
  };

  const tableData = properties.map((property) => ({
    ...property,
    projectNo: property.block?.project?.projectNo || '-',
    directCommissionDisplay: property.block?.project?.directCommission ? `${property.block.project.directCommission}%` : 'Standard (10%)',
    block: property.block?.name || '-',
    ratePerSqYard: `₹ ${property.ratePerSqYard.toLocaleString('en-IN')}`,
    plc: property.plc > 0 ? `₹ ${property.plc.toLocaleString('en-IN')}` : '0',
    totalAmount: `₹ ${property.totalAmount.toLocaleString('en-IN')}`,
    agentName: property.sales?.[0]?.agent ? `${property.sales[0].agent.name} (${property.sales[0].agent.userId})` : '-',
    statusDisplay: property.status === 'BOOKED'
      ? <span className="bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Booked</span>
      : <span className="bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">Available</span>,
    actions: property.status === 'PENDING'
      ? <button onClick={() => openBookingModal(property)} className="bg-brand-primary text-white text-[10px] px-3 py-1 font-bold rounded shadow hover:bg-brand-sidebarHover transition-all">BOOK PROPERTY</button>
      : <span className="text-gray-400 text-[10px] italic">No Action</span>,
  }));

  return (
    <div className="space-y-4 p-4 relative">
      {/* Booking Modal Overlay */}
      {isBookingModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-800 border-b pb-2">
              Book Property: {selectedProperty.block?.project?.projectNo} - {selectedProperty.block?.name} - {selectedProperty.propertyNo}
            </h2>
            
            <form onSubmit={handleBookProperty} className="space-y-4">
              <div>
                <label className="mb-1 text-xs font-semibold text-slate-600 block">Total Value (₹)</label>
                <input type="text" readOnly disabled value={selectedProperty.totalAmount.toLocaleString('en-IN')} className="w-full border px-3 py-2 text-sm bg-slate-100" />
              </div>

              <div>
                <label className="mb-1 text-xs font-semibold text-slate-600 block">Select Selling Agent *</label>
                <select value={bookingForm.agentId} onChange={(e) => setBookingForm(c => ({...c, agentId: e.target.value}))} className="w-full border px-3 py-2 text-sm" required>
                  <option value="">-- Choose Agent --</option>
                  {agents.map((agent: { id: string; name: string; userId: string }) => (
                    <option key={agent.id} value={agent.id}>{agent.name} ({agent.userId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 text-xs font-semibold text-slate-600 block">Receipt No *</label>
                <input value={bookingForm.receiptNo} onChange={(e) => setBookingForm(c => ({...c, receiptNo: e.target.value}))} className="w-full border px-3 py-2 text-sm" placeholder="e.g. REC-1001" required />
              </div>

              <div>
                <label className="mb-1 text-xs font-semibold text-slate-600 block">Initial Paid Amount (₹) *</label>
                <input value={bookingForm.paidAmount} onChange={(e) => setBookingForm(c => ({...c, paidAmount: e.target.value}))} type="number" min="0" max={selectedProperty.totalAmount} className="w-full border px-3 py-2 text-sm" placeholder="Enter amount" required />
              </div>

              <div>
                <label className="mb-1 text-xs font-semibold text-slate-600 block">Booking Date</label>
                <input value={bookingForm.saleDate} onChange={(e) => setBookingForm(c => ({...c, saleDate: e.target.value}))} type="date" className="w-full border px-3 py-2 text-sm" />
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsBookingModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="bg-green-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-green-700 rounded">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message || error ? (
        <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {message || (error as Error).message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <form onSubmit={handleCreateProject} className="space-y-3 border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Create Project</h3>
          <input value={projectForm.projectNo} onChange={(event) => setProjectForm((current) => ({ ...current, projectNo: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="Project number" required />
          <input value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} className="w-full border px-3 py-2 text-sm" placeholder="Project name" required />
          <input value={projectForm.directCommission} onChange={(event) => setProjectForm((current) => ({ ...current, directCommission: event.target.value }))} type="number" step="0.1" className="w-full border px-3 py-2 text-sm" placeholder="Custom Direct Comm % (Leave empty for 10%)" />
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
            {blocks.map((block: { id: string; name: string; projectName: string }) => (
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
