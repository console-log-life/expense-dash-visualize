import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import type { ImportResult } from "@/types/transaction";

interface ImportCsvProps {
  onImport: (csv: string) => Promise<ImportResult | null>;
  onClose: () => void;
}

const MAX_FILE_BYTES = 1024 * 1024; // matches the server's 1 MB body limit

const SAMPLE = `date,description,amount,type,category
01/11/2026,Salary,50000,credit,Salary
02/11/2026,Swiggy order,-349.50,,Food & Dining
03/11/2026,Metro card recharge,500,debit,Transportation`;

const ImportCsv: React.FC<ImportCsvProps> = ({ onImport, onClose }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (file: File | undefined) => {
    setError('');
    setResult(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError('File is larger than 1 MB. Split it into smaller files.');
      return;
    }
    setFileName(file.name);
    setBusy(true);
    const text = await file.text();
    setResult(await onImport(text));
    setBusy(false);
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Import bank statement (CSV)</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-gray-600">
          Needs <code>date</code>, <code>description</code> and <code>amount</code> columns. <code>type</code>{' '}
          (income/expense or credit/debit) and <code>category</code> are optional; without a type, a negative amount
          is an expense. Dates can be YYYY-MM-DD or DD/MM/YYYY. Rows you have already imported are skipped, so
          uploading the same statement twice is safe.
        </p>
        <pre className="bg-gray-50 border rounded p-2 text-xs overflow-x-auto">{SAMPLE}</pre>

        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button onClick={() => fileInput.current?.click()} disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700">
          <Upload className="h-4 w-4 mr-2" />
          {busy ? `Importing ${fileName}…` : 'Choose CSV file'}
        </Button>

        {error && <p className="text-red-600">{error}</p>}

        {result && (
          <div className="rounded border p-3 space-y-1">
            <p className="font-medium">{fileName}</p>
            <p className="text-green-700">{result.imported} imported</p>
            <p className="text-gray-600">{result.duplicates} skipped as already imported</p>
            {result.failed > 0 && (
              <>
                <p className="text-red-600">{result.failed} rows could not be read:</p>
                <ul className="text-xs text-red-600 list-disc pl-5 max-h-32 overflow-y-auto">
                  {result.errors.map((e) => (
                    <li key={e.row}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportCsv;
