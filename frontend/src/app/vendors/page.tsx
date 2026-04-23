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
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';

export default function VendorsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vendorCode: '', name: '', address: '', taxId: '' });
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    const { data: res } = await api.get('/vendors', {
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
    await api.post('/vendors', form);
    setForm({ vendorCode: '', name: '', address: '', taxId: '' });
    setShowForm(false);
    fetchData();
  };

  const handleBulkUpload = async (file: File) => {
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/vendors/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setMessage(`Created: ${data.data.created}, Skipped: ${data.data.skipped}`);
    fetchData();
  };

  const columns: Column<any>[] = [
    { header: 'Code', accessorKey: 'vendorCode' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Address', cell: (row) => row.address || '-' },
    { header: 'Tax ID', cell: (row) => row.taxId || '-' },
    { header: 'Created', cell: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor Code *</Label>
                <Input value={form.vendorCode} onChange={(e) => setForm({ ...form, vendorCode: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
              </div>
              <div className="col-span-2">
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
            label="Upload Vendors"
            description="CSV columns: vendorCode, name, address (optional), taxId (optional)"
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
        searchPlaceholder="Search vendors..."
      />
    </div>
  );
}
