'use client';

import { useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  CombinedJobSummary,
  CombinedSort,
  CombinedSortField,
  CoverageType,
} from '@/lib/aiTypes';
import {
  formatDurationMs,
  formatDate,
  formatNum,
  formatPercent,
} from '@/lib/combinedAnalytics';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  TableIcon,
  CheckCircle,
  MinusCircle,
} from 'lucide-react';

interface CombinedTableProps {
  summaries: CombinedJobSummary[];
  sort: CombinedSort;
  onSortChange: (sort: Partial<CombinedSort>) => void;
}

// Конфигурация колонок
const columns: {
  key: CombinedSortField | null;
  label: string;
  className?: string;
}[] = [
  { key: 'name', label: 'Джоба', className: 'min-w-[200px]' },
  { key: null, label: 'Покрытие', className: 'w-[120px]' },
  { key: 'operationRuns', label: 'Запусков Op.', className: 'w-[100px]' },
  { key: 'aiRuns', label: 'Запусков AI', className: 'w-[100px]' },
  { key: 'operationSuccessRate', label: 'Success Op.', className: 'w-[100px]' },
  { key: 'aiSuccessRate', label: 'Success AI', className: 'w-[100px]' },
  { key: 'aiAvgDurationMs', label: 'Длит. AI средн.', className: 'w-[120px]' },
  { key: null, label: 'P95 длит. AI', className: 'w-[100px]' },
  { key: null, label: 'Queue lag AI', className: 'w-[100px]' },
  { key: 'aiTotalSpentTokens', label: 'Токены всего', className: 'w-[110px]' },
  { key: null, label: 'Токены средн.', className: 'w-[100px]' },
  { key: null, label: 'Провайдеры', className: 'min-w-[150px]' },
  { key: null, label: 'Модели', className: 'min-w-[150px]' },
  { key: 'lastActivityAt', label: 'Последняя активность', className: 'w-[150px]' },
];

export function CombinedTable({ summaries, sort, onSortChange }: CombinedTableProps) {
  const handleSort = (field: CombinedSortField | null) => {
    if (!field) return;
    
    if (sort.field === field) {
      onSortChange({ direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ field, direction: 'desc' });
    }
  };

  const renderSortIcon = (field: CombinedSortField | null) => {
    if (!field) return null;
    
    if (sort.field !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    }
    
    return sort.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const getCoverageBadge = (coverageType: CoverageType) => {
    switch (coverageType) {
      case 'both':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Оба источника
          </Badge>
        );
      case 'operation_only':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            Только OperationLog
          </Badge>
        );
      case 'ai_only':
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-600">
            Только AiLog
          </Badge>
        );
    }
  };

  const getSuccessRateBadge = (rate: number, hasData: boolean) => {
    if (!hasData) return <span className="text-muted-foreground">—</span>;
    
    if (rate >= 95) {
      return <Badge className="bg-green-500">{rate.toFixed(1)}%</Badge>;
    } else if (rate >= 80) {
      return <Badge className="bg-yellow-500">{rate.toFixed(1)}%</Badge>;
    } else {
      return <Badge variant="destructive">{rate.toFixed(1)}%</Badge>;
    }
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

  if (summaries.length === 0) {
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
          Сводная таблица по джобам
          <Badge variant="secondary" className="ml-2">
            {summaries.length} записей
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
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
              {summaries.map((summary) => (
                <TableRow
                  key={summary.name}
                  className={summary.coverageType !== 'both' ? 'bg-muted/20' : ''}
                >
                  {/* Джоба */}
                  <TableCell>
                    <div>
                      <div className="font-medium">{summary.displayName}</div>
                      {summary.displayName !== summary.name && (
                        <div className="text-xs text-muted-foreground">{summary.name}</div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Покрытие */}
                  <TableCell>{getCoverageBadge(summary.coverageType)}</TableCell>
                  
                  {/* Запусков Operation */}
                  <TableCell className="text-right">
                    {summary.hasOperation ? (
                      <div>
                        <div>{formatNum(summary.operationRuns)}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className="text-green-600">{summary.operationSuccessCount}</span>
                          {' / '}
                          <span className="text-red-600">{summary.operationErrorCount}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  {/* Запусков AI */}
                  <TableCell className="text-right">
                    {summary.hasAi ? (
                      <div>
                        <div>{formatNum(summary.aiRuns)}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className="text-green-600">{summary.aiSuccessCount}</span>
                          {' / '}
                          <span className="text-red-600">{summary.aiErrorCount}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  {/* Success Rate Operation */}
                  <TableCell className="text-right">
                    {getSuccessRateBadge(summary.operationSuccessRate, summary.hasOperation)}
                  </TableCell>
                  
                  {/* Success Rate AI */}
                  <TableCell className="text-right">
                    {getSuccessRateBadge(summary.aiSuccessRate, summary.hasAi)}
                  </TableCell>
                  
                  {/* Средняя длительность AI */}
                  <TableCell className="text-right">
                    {summary.hasAi && summary.aiAvgDurationMs > 0
                      ? formatDurationMs(summary.aiAvgDurationMs)
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  
                  {/* P95 длительности AI */}
                  <TableCell className="text-right">
                    {summary.hasAi && summary.aiP95DurationMs > 0
                      ? formatDurationMs(summary.aiP95DurationMs)
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  
                  {/* Queue lag AI */}
                  <TableCell className="text-right">
                    {summary.hasAi && summary.aiAvgQueueLagMs > 0
                      ? formatDurationMs(summary.aiAvgQueueLagMs)
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  
                  {/* Токены всего */}
                  <TableCell className="text-right">
                    {summary.aiTotalSpentTokens > 0
                      ? formatNum(summary.aiTotalSpentTokens)
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  
                  {/* Токены средн. */}
                  <TableCell className="text-right">
                    {summary.hasAi && summary.aiAvgSpentTokens > 0
                      ? formatNum(Math.round(summary.aiAvgSpentTokens))
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  
                  {/* Провайдеры */}
                  <TableCell>{renderList(summary.providersUsed)}</TableCell>
                  
                  {/* Модели */}
                  <TableCell>{renderList(summary.modelsUsed)}</TableCell>
                  
                  {/* Последняя активность */}
                  <TableCell>
                    {formatDate(summary.lastActivityAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
