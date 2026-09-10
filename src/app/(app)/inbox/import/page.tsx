'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileDropzone } from '@/components/feedback/FileDropzone';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { importFeedbackCsv } from '@/services/api/feedback.api';
import { ApiClientError } from '@/services/api/client';
import type { CsvImportResultDto } from '@/types';

export default function ImportCsvPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<CsvImportResultDto | null>(null);

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    setResult(null);
    try {
      const outcome = await importFeedbackCsv(file);
      setResult(outcome);
      if (outcome.imported > 0) {
        toast.success(`Imported ${outcome.imported} feedback ${outcome.imported === 1 ? 'item' : 'items'}.`);
      }
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Feedback</CardTitle>
          <p className="mt-1 text-sm text-text-secondary">Upload a CSV file to import customer feedback in bulk.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <FileDropzone file={file} onFileSelect={setFile} />

          <div className="rounded-lg bg-surface p-4 text-xs text-text-secondary">
            <p className="font-medium text-text-primary">CSV format notes:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1">
              <li>Must include a <code>content</code> column</li>
              <li>Optional columns: <code>channel</code>, <code>sourceRef</code>, <code>customerLabel</code>, <code>createdAt</code>, <code>featureArea</code></li>
              <li>Maximum 1,000 rows per file, 5MB max size</li>
            </ul>
          </div>

          {result && (
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-positive" />
                <p className="text-sm font-medium text-text-primary">
                  {result.imported} imported, {result.failed} failed
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-xs text-negative">
                      <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                      Row {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => router.push('/inbox')}>
              {result ? 'Done' : 'Cancel'}
            </Button>
            {!result && (
              <Button variant="primary" onClick={handleImport} loading={isImporting} disabled={!file}>
                Import
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
