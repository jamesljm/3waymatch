'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<any>(null);

  useEffect(() => {
    api.get(`/documents/${id}`).then(({ data }) => setDoc(data.data));
  }, [id]);

  if (!doc) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">
          {doc.type} - {doc.documentNumber || doc.originalFileName}
        </h1>
        <Badge>{doc.status}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-medium">Type:</span> {doc.type}</div>
            <div><span className="font-medium">Number:</span> {doc.documentNumber || '-'}</div>
            <div><span className="font-medium">Date:</span> {formatDate(doc.documentDate)}</div>
            <div><span className="font-medium">File:</span> {doc.originalFileName}</div>
            <div><span className="font-medium">Currency:</span> {doc.currency || 'MYR'}</div>
            <div><span className="font-medium">Created:</span> {formatDate(doc.createdAt)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendor & Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-medium">Vendor:</span> {doc.vendor?.name || doc.vendorName || '-'}</div>
            <div><span className="font-medium">Subtotal:</span> {formatCurrency(doc.subtotal)}</div>
            <div><span className="font-medium">Tax:</span> {formatCurrency(doc.taxAmount)}</div>
            <div><span className="font-medium">Discount:</span> {formatCurrency(doc.discount)}</div>
            <div><span className="font-medium">Total:</span> {formatCurrency(doc.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {doc.lineItems?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items ({doc.lineItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doc.lineItems.map((li: any) => (
                  <TableRow key={li.id}>
                    <TableCell>{li.lineNumber}</TableCell>
                    <TableCell>{li.itemCode || '-'}</TableCell>
                    <TableCell>{li.description || '-'}</TableCell>
                    <TableCell>{li.quantity ?? '-'}</TableCell>
                    <TableCell>{li.uom || '-'}</TableCell>
                    <TableCell>{formatCurrency(li.unitPrice)}</TableCell>
                    <TableCell>{formatCurrency(li.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
