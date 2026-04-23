'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CsvUpload } from '@/components/csv-upload';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function InventoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ itemCode: '', description: '', uom: '' });
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    const { data: res } = await api.get('/inventory-items', {
      params: { page, pageSize: 20, search: search || undefined },
    });
    setData(res.data);
    setTotal(res.total);
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/inventory-items', form);
    setForm({ itemCode: '', description: '', uom: '' });
    setShowForm(false);
    fetchData();
  };

  const handleBulkUpload = async (file: File) => {
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/inventory-items/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setMessage(`Created: ${data.data.created}, Skipped: ${data.data.skipped}`);
    fetchData();
  };

  const columns: Column<any>[] = [
    { header: 'Item Code', accessorKey: 'itemCode' },
    { header: 'Description', accessorKey: 'description' },
    { header: 'UOM', cell: (row) => row.uom || '-' },
    { header: 'Created', cell: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory Items</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Inventory Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Item Code *</Label>
                <Input value={form.itemCode} onChange={(e) => setForm({ ...form, itemCode: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>UOM</Label>
                <Input value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
              </div>
              <div className="col-span-3">
                <Button type="submit">Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bulk Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <CsvUpload
            onUpload={handleBulkUpload}
            label="Upload Items"
            description="CSV columns: itemCode, description, uom (optional)"
          />
          {message && <p className="mt-2 text-sm text-green-700">{message}</p>}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search inventory items..."
      />
    </div>
  );
}
