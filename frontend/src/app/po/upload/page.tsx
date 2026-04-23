'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CsvUpload } from '@/components/csv-upload';
import api from '@/lib/api';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface LineItem {
  lineNumber: number;
  itemCode: string;
  description: string;
  quantity: string;
  uom: string;
  unitPrice: string;
  amount: string;
}

export default function POUploadPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [form, setForm] = useState({
    documentNumber: '',
    documentDate: '',
    vendorId: '',
    currency: 'MYR',
    totalAmount: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { lineNumber: 1, itemCode: '', description: '', quantity: '', uom: '', unitPrice: '', amount: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');

  useEffect(() => {
    api.get('/vendors', { params: { pageSize: 1000 } }).then(({ data }) => setVendors(data.data));
  }, []);

  const addLine = () => {
    setLineItems([
      ...lineItems,
      {
        lineNumber: lineItems.length + 1,
        itemCode: '',
        description: '',
        quantity: '',
        uom: '',
        unitPrice: '',
        amount: '',
      },
    ]);
  };

  const removeLine = (idx: number) => {
    const updated = lineItems.filter((_, i) => i !== idx).map((li, i) => ({ ...li, lineNumber: i + 1 }));
    setLineItems(updated);
  };

  const updateLine = (idx: number, field: keyof LineItem, value: string) => {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: value };
    // Auto-calculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(updated[idx].quantity) || 0;
      const price = parseFloat(updated[idx].unitPrice) || 0;
      updated[idx].amount = (qty * price).toFixed(2);
    }
    setLineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/documents/po', {
        ...form,
        totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : undefined,
        lineItems: lineItems.map((li) => ({
          lineNumber: li.lineNumber,
          itemCode: li.itemCode || undefined,
          description: li.description || undefined,
          quantity: li.quantity ? parseFloat(li.quantity) : undefined,
          uom: li.uom || undefined,
          unitPrice: li.unitPrice ? parseFloat(li.unitPrice) : undefined,
          amount: li.amount ? parseFloat(li.amount) : undefined,
        })),
      });
      router.push('/po');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create PO');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (file: File) => {
    setBulkMessage('');
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/documents/po/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setBulkMessage(`Created: ${data.data.created}, Skipped: ${data.data.skipped}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Purchase Order</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bulk Upload POs</CardTitle>
          <CardDescription>
            CSV columns: documentNumber, documentDate, vendorCode, lineNumber, itemCode, description, quantity, uom, unitPrice, amount
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvUpload onUpload={handleBulkUpload} label="Upload POs" />
          {bulkMessage && <p className="mt-2 text-sm text-green-700">{bulkMessage}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual PO Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>PO Number *</Label>
                <Input
                  value={form.documentNumber}
                  onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.documentDate}
                  onChange={(e) => setForm({ ...form, documentDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.vendorId}
                  onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                  required
                >
                  <option value="">Select vendor...</option>
                  {vendors.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorCode} - {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Line
                </Button>
              </div>
              <div className="space-y-2">
                {lineItems.map((li, idx) => (
                  <div key={idx} className="grid grid-cols-7 gap-2 items-end">
                    <div>
                      {idx === 0 && <Label className="text-xs">Item Code</Label>}
                      <Input
                        placeholder="Item code"
                        value={li.itemCode}
                        onChange={(e) => updateLine(idx, 'itemCode', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs">Description</Label>}
                      <Input
                        placeholder="Description"
                        value={li.description}
                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      {idx === 0 && <Label className="text-xs">Qty</Label>}
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Qty"
                        value={li.quantity}
                        onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                      />
                    </div>
                    <div>
                      {idx === 0 && <Label className="text-xs">Unit Price</Label>}
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={li.unitPrice}
                        onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)}
                      />
                    </div>
                    <div>
                      {idx === 0 && <Label className="text-xs">Amount</Label>}
                      <Input value={li.amount} readOnly className="bg-muted" />
                    </div>
                    <div>
                      {lineItems.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create PO
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
