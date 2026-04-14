'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  TokenReportByJob,
  TokenReportByJobSort,
  TokenReportByJobSortField,
} from '@/lib/tokenReportTypes';
import { formatDate, formatNum } from '@/lib/combinedAnalytics';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  TableIcon,
} from 'lucide-react';

interface TokenReportByJobsTableProps {
  jobs: TokenReportByJob[];
  sort: TokenReportByJobSort;
  onSortChange: (sort: Partial<TokenReportByJobSort>) => void;
}

// Конфигурация колонок
const columns: {
  key: TokenReportByJobSortField | null;
  label: string;
  className?: string;
}[] = [
  { key: 'name', label: 'Джоба', className: 'min-w-[200px]' },
  { key: 'runsCount', label: 'Запусков', className: 'w-[80px]' },
  { key: null, label: 'Успешных', className: 'w-[80px]' },
  { key: null, label: 'Ошибок', className: 'w-[80px]' },
  { key: null, label: 'Success Rate', className: 'w-[100px]' },
  { key: 'totalSpentTokens', label: 'Токены всего', className: 'w-[120px]' },
  { key: 'tokenShare', label: 'Доля (%)', className: 'w-[150px]' },
  { key: 'avgSpentTokens', label: 'Среднее', className: 'w-[90px]' },
  { key: null, label: 'Медиана', className: 'w-[90px]' },
  { key: null, label: 'Максимум', className: 'w-[90px]' },
  { key: 'lastActivityAt', label: 'Последняя активность', className: 'w-[140px]' },
  { key: null, label: 'Провайдеры', className: 'min-w-[120px]' },
  { key: null, label: 'Модели', className: 'min-w-[120px]' },
  { key: null, label: 'ConfigType', className: 'min-w-[100px]' },
];

export function TokenReportByJobsTable({
  jobs,
  sort,
  onSortChange,
}: TokenReportByJobsTableProps) {
  const handleSort = (field: TokenReportByJobSortField | null) => {
    if (!field) return;
    
    if (sort.field === field) {
      onSortChange({ direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ field, direction: 'desc' });
    }
  };

  const renderSortIcon = (field: TokenReportByJobSortField | null) => {
    if (!field) return null;
    
    if (sort.field !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    }
    
    return sort.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const renderList = (items: string[], maxVisible = 2) => {
    if (items.length === 0) {
      return <span className="text-muted-foreground">—</span>;
    }
    
    const visible = items.slice(0, maxVisible);
    const remaining = items.length - maxVisible;
    
    return (
      <div className="flex flex-wrap gap-1">
        {visible.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remaining}
          </Badge>
        )}
      </div>
    );
  };

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 95) {
      return <Badge className="bg-green-500">{rate.toFixed(1)}%</Badge>;
    } else if (rate >= 80) {
      return <Badge className="bg-yellow-500">{rate.toFixed(1)}%</Badge>;
    } else {
      return <Badge variant="destructive">{rate.toFixed(1)}%</Badge>;
    }
  };

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TableIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Нет данных для отображения</p>
          <p className="text-sm text-muted-foreground mt-1">
            Попробуйте изменить параметры фильтрации
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TableIcon className="h-4 w-4" />
          Затраты токенов по джобам
          <Badge variant="secondary" className="ml-2">
            {jobs.length} джоб
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead
                    key={i}
                    className={`${col.className || ''} ${col.key ? 'cursor-pointer select-none hover:bg-muted/50' : ''}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center">
                      {col.label}
                      {renderSortIcon(col.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.name}>
                  {/* Джоба */}
                  <TableCell>
                    <div>
                      <div className="font-medium">{job.displayName}</div>
                      {job.displayName !== job.name && (
                        <div className="text-xs text-muted-foreground">{job.name}</div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Запусков */}
                  <TableCell className="text-right">
                    {formatNum(job.runsCount)}
                  </TableCell>
                  
                  {/* Успешных */}
                  <TableCell className="text-right">
                    <span className="text-green-600">{job.successCount}</span>
                  </TableCell>
                  
                  {/* Ошибок */}
                  <TableCell className="text-right">
                    <span className="text-red-600">{job.errorCount}</span>
                  </TableCell>
                  
                  {/* Success Rate */}
                  <TableCell className="text-right">
                    {getSuccessRateBadge(job.successRate)}
                  </TableCell>
                  
                  {/* Токены всего */}
                  <TableCell className="text-right font-semibold">
                    {formatNum(job.totalSpentTokens)}
                  </TableCell>
                  
                  {/* Доля (%) */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {(job.tokenShare * 100).toFixed(2)}%
                        </span>
                      </div>
                      <Progress 
                        value={job.tokenShare * 100} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  
                  {/* Среднее */}
                  <TableCell className="text-right">
                    {formatNum(Math.round(job.avgSpentTokens))}
                  </TableCell>
                  
                  {/* Медиана */}
                  <TableCell className="text-right">
                    {formatNum(Math.round(job.medianSpentTokens))}
                  </TableCell>
                  
                  {/* Максимум */}
                  <TableCell className="text-right">
                    {formatNum(job.maxSpentTokens)}
                  </TableCell>
                  
                  {/* Последняя активность */}
                  <TableCell>
                    {formatDate(job.lastActivityAt)}
                  </TableCell>
                  
                  {/* Провайдеры */}
                  <TableCell>{renderList(job.providersUsed)}</TableCell>
                  
                  {/* Модели */}
                  <TableCell>{renderList(job.modelsUsed)}</TableCell>
                  
                  {/* ConfigType */}
                  <TableCell>{renderList(job.configTypesUsed)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
