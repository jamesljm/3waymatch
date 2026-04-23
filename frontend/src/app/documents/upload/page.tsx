'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/file-upload';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import api from '@/lib/api';

export default function DocumentUploadPage() {
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState('');

  const handleUpload = async (files: File[]) => {
    setError('');
    setResult(null);
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    try {
      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult({ count: data.data.length });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Upload Documents</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload DOs & Invoices</CardTitle>
          <CardDescription>
            Upload PDF or image files. They will be queued for OCR and extraction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload onUpload={handleUpload} />
          {result && (
            <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              Successfully uploaded {result.count} document(s). They will be processed shortly.
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
