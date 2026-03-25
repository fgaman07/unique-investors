import { useEffect, useMemo, useState } from 'react';
import LegacyTable from '../components/common/LegacyTable';
import { api } from '../context/AuthContext';

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
  const [emis, setEmis] = useState<EmiRecord[]>([]);
  const [sales, setSales] = useState<SaleOption[]>([]);
  const [form, setForm] = useState({ saleId: '', amount: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [emiResponse, salesResponse] = await Promise.all([
        api.get<EmiRecord[]>('/sales/emis'),
        api.get<SaleOption[]>('/sales'),
      ]);
      setEmis(emiResponse.data);
      setSales(salesResponse.data);
    } catch (error) {
      console.error('Error fetching EMI report', error);
      setMessage('Failed to load EMI data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      setMessage('EMI payment recorded successfully.');
      await loadData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to record EMI payment.');
    }
  };

  const columns = [
    { header: 'Payment Date', field: 'paymentDateDisplay' },
    { header: 'EMI ID', field: 'id' },
    { header: 'Sale Receipt No', field: 'receiptNo' },
    { header: 'Agent Name', field: 'agentName' },
    { header: 'Property Ref', field: 'propertyRef' },
    { header: 'Paid Amount (INR)', field: 'amountDisplay' },
    { header: 'Status', field: 'status' },
  ];

  const tableData = emis.map((emi) => ({
    ...emi,
    paymentDateDisplay: emi.paymentDate ? new Date(emi.paymentDate).toLocaleDateString('en-GB') : '-',
    receiptNo: emi.sale.receiptNo,
    agentName: emi.sale.agent.name,
    propertyRef: `${emi.sale.property.type} (${emi.sale.property.propertyNo})`,
    amountDisplay: emi.amount.toLocaleString('en-IN'),
  }));

  return (
    <div className="space-y-4 p-4">
      {message ? (
        <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <form onSubmit={handlePayEmi} className="grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-3">
        <select value={form.saleId} onChange={(event) => setForm((current) => ({ ...current, saleId: event.target.value }))} className="border px-3 py-2 text-sm" required>
          <option value="">Select sale</option>
          {payableSales.map((sale) => (
            <option key={sale.id} value={sale.id}>
              {sale.receiptNo} / {sale.property.propertyNo} / Outstanding {(sale.totalAmount - sale.paidAmount).toLocaleString('en-IN')}
            </option>
          ))}
        </select>
        <input value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="border px-3 py-2 text-sm" placeholder="EMI amount" required />
        <button type="submit" className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Record EMI
        </button>
      </form>

      <LegacyTable title="Client EMI Installments Master Ledger" dateRange={true} columns={columns} data={loading ? [] : tableData} />
    </div>
  );
};

export default EMIReport;
