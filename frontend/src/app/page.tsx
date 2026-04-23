'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { FileText, Building2, Package, Upload } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalDocuments: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  totalVendors: number;
  totalInventoryItems: number;
  recentDocuments: any[];
}

const statusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive'> = {
  UPLOADED: 'secondary',
  CLASSIFYING: 'info',
  EXTRACTING: 'info',
  EXTRACTED: 'info',
  MATCHING: 'warning',
  MATCHED: 'success',
  EXCEPTION: 'destructive',
  REVIEWED: 'success',
  EXPORTED: 'default',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get('/documents/dashboard').then(({ data }) => setStats(data.data));
  }, []);

  if (!stats) return <div className="text-muted-foreground">Loading...</div>;

  const statCards = [
    { label: 'Documents', value: stats.totalDocuments, icon: FileText, href: '/documents' },
    { label: 'Vendors', value: stats.totalVendors, icon: Building2, href: '/vendors' },
    { label: 'Inventory Items', value: stats.totalInventoryItems, icon: Package, href: '/inventory' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/documents/upload"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          Upload Documents
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {Object.keys(stats.byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="text-sm">
                  <span className="font-medium">{type}:</span> {count}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.recentDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentDocuments.map((doc: any) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{doc.type}</Badge>
                    <span className="font-medium">{doc.documentNumber || doc.originalFileName}</span>
                    {doc.vendorName && (
                      <span className="text-muted-foreground">{doc.vendorName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant[doc.status] || 'secondary'}>{doc.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
