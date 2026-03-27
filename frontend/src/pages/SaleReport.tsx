import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LegacyTable from '../components/common/LegacyTable';
import { api, useAuth } from '../context/AuthContext';
import { AdminUserSelector } from '../components/common/AdminUserSelector';

interface SaleRecord {
  id: string;
  receiptNo: string;
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  property: {
    propertyNo: string;
    type: string;
    block: {
      name: string;
      project: {
        projectNo: string;
        name: string;
      };
    };
  };
  agent: {
    name: string;
    userId: string;
  };
  emis: Array<{ amount: number }>;
}

interface AgentOption {
  id: string;
  name: string;
  userId: string;
  role: string;
}

interface PropertyOption {
  id: string;
  propertyNo: string;
  type: string;
  totalAmount: number;
  block?: {
    name: string;
    project?: {
      projectNo: string;
    };
  };
}

const emptySaleForm = {
  receiptNo: '',
  propertyId: '',
  agentId: '',
  paidAmount: '',
  saleDate: '',
};

const SaleReport = () => {
  const { user, targetUserId } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  
  const [saleForm, setSaleForm] = useState(emptySaleForm);
  const [message, setMessage] = useState('');

  // Queries
  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales', targetUserId || 'all'],
    queryFn: async () => {
      const query = targetUserId ? `?agentId=${targetUserId}` : '';
      const response = await api.get<SaleRecord[]>(`/sales${query}`);
      return response.data;
    }
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agentsDropdown'],
    queryFn: async () => {
      const res = await api.get('/auth/users?limit=1000');
      const data = Array.isArray(res.data) ? res.data : res.data.users;
      return (data || []).filter((record: AgentOption) => record.role !== 'ADMIN');
    },
    enabled: isAdmin
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['propertiesPending'],
    queryFn: async () => {
      const res = await api.get<PropertyOption[]>('/inventory/properties?status=PENDING');
      return res.data;
    },
    enabled: isAdmin
  });

  // Mutation
  const createSaleMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/sales', payload);
      return res.data;
    },
    onSuccess: () => {
      setMessage('Sale created successfully.');
      setSaleForm(emptySaleForm);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['propertiesPending'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
    onError: (error: any) => {
      setMessage(error.response?.data?.message || 'Unable to create sale.');
    }
  });

  const handleCreateSale = (event: React.FormEvent) => {
    event.preventDefault();
    createSaleMutation.mutate({
      ...saleForm,
      paidAmount: Number(saleForm.paidAmount),
      saleDate: saleForm.saleDate || undefined,
    });
  };

  const columns = [
    { header: 'Receipt No', field: 'receiptNo' },
    { header: 'Receipt Date', field: 'receiptDate' },
    { header: 'Project No', field: 'projectNo' },
    { header: 'Project Name', field: 'projectName' },
    { header: 'Block', field: 'block' },
    { header: 'Plot/Shop No', field: 'plotNo' },
    { header: 'Type', field: 'plotType' },
    { header: 'Agent', field: 'agentName' },
    { header: 'Total Amount', field: 'totalAmountDisplay' },
    { header: 'Collected', field: 'paidAmountDisplay' },
    { header: 'Outstanding', field: 'outstandingAmountDisplay' },
  ];

  const tableData = sales.map((sale) => {
    const outstanding = sale.totalAmount - sale.paidAmount;
    return {
      ...sale,
      receiptDate: new Date(sale.saleDate).toLocaleDateString('en-GB'),
      projectNo: sale.property.block.project.projectNo,
      projectName: sale.property.block.project.name,
      block: sale.property.block.name,
      plotNo: sale.property.propertyNo,
      plotType: sale.property.type,
      agentName: `${sale.agent.name} (${sale.agent.userId})`,
      totalAmountDisplay: sale.totalAmount.toLocaleString('en-IN'),
      paidAmountDisplay: sale.paidAmount.toLocaleString('en-IN'),
      outstandingAmountDisplay: outstanding.toLocaleString('en-IN'),
    };
  });

  return (
    <div className="space-y-4 p-4">
      <AdminUserSelector />
      {message ? (
        <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {isAdmin ? (
        <form onSubmit={handleCreateSale} className="grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
          <input value={saleForm.receiptNo} onChange={(event) => setSaleForm((current) => ({ ...current, receiptNo: event.target.value }))} className="border px-3 py-2 text-sm" placeholder="Receipt number" required />
          <select value={saleForm.propertyId} onChange={(event) => setSaleForm((current) => ({ ...current, propertyId: event.target.value }))} className="border px-3 py-2 text-sm" required>
            <option value="">Select property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.block?.project?.projectNo} / {property.block?.name} / {property.propertyNo}
              </option>
            ))}
          </select>
          <select value={saleForm.agentId} onChange={(event) => setSaleForm((current) => ({ ...current, agentId: event.target.value }))} className="border px-3 py-2 text-sm" required>
            <option value="">Select agent</option>
            {agents.map((agent: AgentOption) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.userId})
              </option>
            ))}
          </select>
          <input value={saleForm.paidAmount} onChange={(event) => setSaleForm((current) => ({ ...current, paidAmount: event.target.value }))} className="border px-3 py-2 text-sm" placeholder="Initial paid amount" required />
          <input type="date" value={saleForm.saleDate} onChange={(event) => setSaleForm((current) => ({ ...current, saleDate: event.target.value }))} className="border px-3 py-2 text-sm" />
          <div className="md:col-span-2 xl:col-span-5">
            <button type="submit" className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Create Sale
            </button>
          </div>
        </form>
      ) : null}

      <LegacyTable title="Sale Report" dateRange={true} columns={columns} data={salesLoading ? [] : tableData} />
    </div>
  );
};

export default SaleReport;
