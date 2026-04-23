'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Upload } from 'lucide-react';

const statusVariant: Record<string, any> = {
  UPLOADED: 'secondary',
  EXTRACTING: 'info',
  EXTRACTED: 'info',
  MATCHED: 'success',
  EXCEPTION: 'destructive',
  REVIEWED: 'success',
};

export default function DocumentsPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    const { data: res } = await api.get('/documents', {
      params: { page, pageSize: 20, search: search || undefined },
    });
    setData(res.data);
    setTotal(res.total);
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<any>[] = [
    {
      header: 'Type',
      cell: (row) => <Badge variant="outline">{row.type}</Badge>,
    },
    { header: 'Document #', accessorKey: 'documentNumber' },
    { header: 'File Name', accessorKey: 'originalFileName' },
    {
      header: 'Vendor',
      cell: (row) => row.vendor?.name || row.vendorName || '-',
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant={statusVariant[row.status] || 'secondary'}>{row.status}</Badge>,
    },
    {
      header: 'Date',
      cell: (row) => formatDate(row.documentDate || row.createdAt),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Link href="/documents/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload
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
        searchPlaceholder="Search by document #, filename, or vendor..."
        onRowClick={(row) => router.push(`/documents/${row.id}`)}
      />
    </div>
  );
}
