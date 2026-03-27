import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LegacyTable from '../components/common/LegacyTable';
import { api, useAuth } from '../context/AuthContext';
import { AdminUserSelector } from '../components/common/AdminUserSelector';

interface EmiRecord {
  id: string;
  paymentDate: string | null;
  amount: number;
  status: string;
  sale: {
    id: string;
    receiptNo: string;
    totalAmount: number;
    paidAmount?: number;
    property: {
      propertyNo: string;
      type: string;
      block: {
        name: string;
        project: { name: string; projectNo: string };
      };
    };
    agent: {
      name: string;
      userId: string;
    };
  };
}

interface SaleOption {
  id: string;
  receiptNo: string;
  totalAmount: number;
  paidAmount: number;
  property: {
    propertyNo: string;
    type: string;
  };
}

const EMIReport = () => {
  const { targetUserId } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ saleId: '', amount: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const emiQuery = targetUserId ? `?agentId=${targetUserId}` : '';

  const { data: emis = [], isLoading: loadingEmis } = useQuery<EmiRecord[]>({
    queryKey: ['emiReport', targetUserId],
    queryFn: async () => {
      const { data } = await api.get<EmiRecord[]>(`/sales/emis${emiQuery}`);
      return data;
    },
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery<SaleOption[]>({
    queryKey: ['emiSales', targetUserId],
    queryFn: async () => {
      const { data } = await api.get<SaleOption[]>(`/sales${emiQuery}`);
      return data;
    },
  });

  const loading = loadingEmis || loadingSales;

  const payableSales = useMemo(
    () => sales.filter((sale) => sale.totalAmount > sale.paidAmount),
    [sales],
  );

  const handlePayEmi = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/sales/emi', {
        saleId: form.saleId,
        amount: Number(form.amount),
      });
      setForm({ saleId: '', amount: '' });
      setMessage({ type: 'success', text: 'EMI payment recorded successfully.' });
      await queryClient.invalidateQueries({ queryKey: ['emiReport'] });
      await queryClient.invalidateQueries({ queryKey: ['emiSales'] });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to record EMI payment.' });
    }
  };

  const columns = [
    { header: 'Payment Date', field: 'paymentDateDisplay' },
    { header: 'Receipt No', field: 'receiptNo' },
    { header: 'Project', field: 'projectDisplay' },
    { header: 'Property Ref', field: 'propertyRef' },
    { header: 'Agent Name', field: 'agentName' },
    { header: 'Paid Amount (₹)', field: 'amountDisplay' },
    { header: 'Status', field: 'status' },
  ];

  const tableData = emis.map((emi) => ({
    ...emi,
    paymentDateDisplay: emi.paymentDate ? new Date(emi.paymentDate).toLocaleDateString('en-GB') : '-',
    receiptNo: emi.sale.receiptNo,
    projectDisplay: emi.sale.property.block
      ? `${emi.sale.property.block.project.name} (${emi.sale.property.block.project.projectNo}) / Blk-${emi.sale.property.block.name}`
      : '-',
    agentName: `${emi.sale.agent.name} (${emi.sale.agent.userId})`,
    propertyRef: `${emi.sale.property.type} - ${emi.sale.property.propertyNo}`,
    amountDisplay: `₹ ${emi.amount.toLocaleString('en-IN')}`,
  }));

  return (
    <div className="p-4 bg-gray-50 min-h-screen space-y-4">
      <AdminUserSelector />
      
      {/* Header Tab */}
      <div className="inline-block px-4 py-1.5 bg-white border border-gray-200 border-b-0 rounded-t-sm shadow-sm ml-2">
        <span className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">EMI Report</span>
      </div>

      {/* Message */}
      {message && (
        <div className={`border px-3 py-2 text-sm rounded ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {message.text}
        </div>
      )}

      {/* Pay EMI Form */}
      <div className="bg-white border border-gray-200 shadow-sm p-4">
        <div className="text-[12px] font-bold text-gray-700 uppercase mb-3 pb-2 border-b border-gray-100">
          Record EMI Payment
        </div>
        <form onSubmit={handlePayEmi} className="grid gap-3 md:grid-cols-3">
          <select
            value={form.saleId}
            onChange={(event) => setForm((current) => ({ ...current, saleId: event.target.value }))}
            className="border border-gray-300 px-3 py-2 text-[12px] rounded focus:outline-none focus:border-blue-400"
            required
          >
            <option value="">Select sale / property</option>
            {payableSales.map((sale) => (
              <option key={sale.id} value={sale.id}>
                {sale.receiptNo} | {sale.property.propertyNo} | Outstanding: ₹{(sale.totalAmount - sale.paidAmount).toLocaleString('en-IN')}
              </option>
            ))}
          </select>
          <input
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            className="border border-gray-300 px-3 py-2 text-[12px] rounded focus:outline-none focus:border-blue-400"
            placeholder="EMI amount (₹)"
            type="number"
            min="1"
            required
          />
          <button
            type="submit"
            className="bg-[#247BA0] hover:bg-[#1D6381] text-white px-4 py-2 text-[12px] font-semibold rounded transition-colors shadow-sm"
          >
            Record EMI
          </button>
        </form>
      </div>

      {/* Table */}
      <LegacyTable
        title="Client EMI Installments Master Ledger"
        dateRange={true}
        columns={columns}
        data={loading ? [] : tableData}
      />
    </div>
  );
};

export default EMIReport;
