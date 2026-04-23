'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function POListPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    const { data: res } = await api.get('/documents', {
      params: { page, pageSize: 20, type: 'PO', search: search || undefined },
    });
    setData(res.data);
    setTotal(res.total);
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<any>[] = [
    { header: 'PO Number', accessorKey: 'documentNumber' },
    {
      header: 'Vendor',
      cell: (row) => row.vendor?.name || '-',
    },
    {
      header: 'Lines',
      cell: (row) => row.lineItems?.length || 0,
    },
    {
      header: 'Total',
      cell: (row) => formatCurrency(row.totalAmount),
    },
    {
      header: 'Date',
      cell: (row) => formatDate(row.documentDate),
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant="outline">{row.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Link href="/po/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add PO
          </Button>
        </Link>
      </div>
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
        searchPlaceholder="Search POs..."
        onRowClick={(row) => router.push(`/documents/${row.id}`)}
      />
    </div>
  );
}
