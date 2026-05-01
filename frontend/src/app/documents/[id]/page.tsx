'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Loader2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const PROCESSING_STATUSES = ['CLASSIFYING', 'EXTRACTING', 'UPLOADED'];

export default function DocumentDetailPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<any>(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDoc = useCallback(async () => {
    const { data } = await api.get(`/documents/${id}`);
    setDoc(data.data);
  }, [id]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  // Auto-refresh during processing
  const isProcessing = doc && PROCESSING_STATUSES.includes(doc.status);

  useEffect(() => {
    if (isProcessing) {
      intervalRef.current = setInterval(fetchDoc, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isProcessing, fetchDoc]);

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      await api.post(`/documents/${id}/reprocess`);
      await fetchDoc();
    } catch (err: any) {
      console.error('Reprocess failed:', err);
    } finally {
      setReprocessing(false);
    }
  };

  if (!doc) return <div className="text-muted-foreground">Loading...</div>;

  const confidence = doc.extractionConfidence;
  const extractedData = doc.extractedData as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">
          {doc.type} - {doc.documentNumber || doc.originalFileName}
        </h1>
        <Badge>{doc.status}</Badge>
        {PROCESSING_STATUSES.includes(doc.status) && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {doc.filePath && doc.status !== 'CLASSIFYING' && doc.status !== 'EXTRACTING' && (
          <Button variant="outline" size="sm" onClick={handleReprocess} disabled={reprocessing}>
            {reprocessing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1 h-3.5 w-3.5" />}
            Reprocess
          </Button>
        )}
      </div>

      {/* Confidence Bar */}
      {confidence != null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Extraction Confidence</span>
            <span>{(confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all ${
                confidence >= 0.8 ? 'bg-green-500' : confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error display */}
      {extractedData?.error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Processing error: {extractedData.error}
        </div>
      )}

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
            {extractedData?.classification && (
              <div>
                <span className="font-medium">Classification:</span>{' '}
                {extractedData.classification.documentType} ({(extractedData.classification.confidence * 100).toFixed(0)}%)
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendor & Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Vendor:</span> {doc.vendor?.name || doc.vendorName || '-'}
              {extractedData?.vendorMatch && (
                <span className="ml-1 text-xs text-muted-foreground">
                  (matched via {extractedData.vendorMatch.matchMethod}, {(extractedData.vendorMatch.confidence * 100).toFixed(0)}%)
                </span>
              )}
            </div>
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

      {/* Raw OCR Text (collapsible) */}
      {doc.rawOcrText && (
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowRawText(!showRawText)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Raw OCR Text</CardTitle>
              {showRawText ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {showRawText && (
            <CardContent>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                {doc.rawOcrText}
              </pre>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
