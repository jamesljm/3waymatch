'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload } from 'lucide-react';

interface CsvUploadProps {
  onUpload: (file: File) => Promise<void>;
  label?: string;
  description?: string;
}

export function CsvUpload({ onUpload, label = 'Upload CSV', description }: CsvUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
      setFile(null);
      // Reset the file input
      const input = document.getElementById('csv-input') as HTMLInputElement;
      if (input) input.value = '';
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="flex items-center gap-3">
        <Input
          id="csv-input"
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="max-w-xs"
        />
        <Button onClick={handleSubmit} disabled={!file || uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {label}
        </Button>
      </div>
    </div>
  );
}
