'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenReportByJob, TokenReportByDay } from '@/lib/tokenReportTypes';
import {
  generateCsvByJobs,
  generateCsvByDays,
  downloadCsv,
  getExportFilename,
} from '@/lib/tokenReportAnalytics';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';

interface TokenReportExportProps {
  byJobs: TokenReportByJob[];
  byDays: TokenReportByDay[];
}

export function TokenReportExport({ byJobs, byDays }: TokenReportExportProps) {
  const handleExportByJobs = () => {
    if (byJobs.length === 0) return;
    
    const csv = generateCsvByJobs(byJobs);
    const filename = getExportFilename('ai-token-report-by-jobs');
    downloadCsv(csv, filename);
  };

  const handleExportByDays = () => {
    if (byDays.length === 0) return;
    
    const csv = generateCsvByDays(byDays);
    const filename = getExportFilename('ai-token-report-by-days');
    downloadCsv(csv, filename);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-4 w-4" />
          Экспорт отчёта
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportByJobs}
            disabled={byJobs.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Экспорт по джобам (CSV)
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportByDays}
            disabled={byDays.length === 0}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Экспорт по суткам (CSV)
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-3">
          Файлы CSV с разделителем `;`. Имена файлов содержат дату выгрузки.
        </p>
      </CardContent>
    </Card>
  );
}
