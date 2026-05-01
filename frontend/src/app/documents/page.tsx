'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Upload, Loader2 } from 'lucide-react';

const statusVariant: Record<string, any> = {
  UPLOADED: 'secondary',
  CLASSIFYING: 'outline',
  EXTRACTING: 'outline',
  EXTRACTED: 'info',
  MATCHED: 'success',
  EXCEPTION: 'destructive',
  REVIEWED: 'success',
};

const PROCESSING_STATUSES = ['CLASSIFYING', 'EXTRACTING'];

export default function DocumentsPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Auto-refresh every 5s when any doc is processing
  const hasProcessing = data.some((d) => PROCESSING_STATUSES.includes(d.status));

  useEffect(() => {
    if (hasProcessing) {
      intervalRef.current = setInterval(fetchData, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasProcessing, fetchData]);

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
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {PROCESSING_STATUSES.includes(row.status) && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
          <Badge variant={statusVariant[row.status] || 'secondary'}>{row.status}</Badge>
        </div>
      ),
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
