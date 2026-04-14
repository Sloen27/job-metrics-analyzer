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
import {
  TokenReportByDay,
  TokenReportByDaySort,
  TokenReportByDaySortField,
} from '@/lib/tokenReportTypes';
import { formatNum, getDisplayName } from '@/lib/combinedAnalytics';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';

interface TokenReportByDaysTableProps {
  days: TokenReportByDay[];
  sort: TokenReportByDaySort;
  onSortChange: (sort: Partial<TokenReportByDaySort>) => void;
}

// Конфигурация колонок
const columns: {
  key: TokenReportByDaySortField | null;
  label: string;
  className?: string;
}[] = [
  { key: 'date', label: 'Дата', className: 'w-[120px]' },
  { key: 'runsCount', label: 'AI-записей', className: 'w-[100px]' },
  { key: 'totalSpentTokens', label: 'Токены всего', className: 'w-[120px]' },
  { key: null, label: 'Токены среднее', className: 'w-[110px]' },
  { key: 'uniqueJobsCount', label: 'Уникальных джоб', className: 'w-[120px]' },
  { key: null, label: 'Топ джоба дня', className: 'min-w-[200px]' },
  { key: null, label: 'Токены топ-джобы', className: 'w-[120px]' },
];

export function TokenReportByDaysTable({
  days,
  sort,
  onSortChange,
}: TokenReportByDaysTableProps) {
  const handleSort = (field: TokenReportByDaySortField | null) => {
    if (!field) return;
    
    if (sort.field === field) {
      onSortChange({ direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ field, direction: 'desc' });
    }
  };

  const renderSortIcon = (field: TokenReportByDaySortField | null) => {
    if (!field) return null;
    
    if (sort.field !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    }
    
    return sort.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const formatDateDisplay = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  if (days.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
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
          <Calendar className="h-4 w-4" />
          Затраты токенов по суткам
          <Badge variant="secondary" className="ml-2">
            {days.length} дней
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
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
              {days.map((day) => (
                <TableRow key={day.date}>
                  {/* Дата */}
                  <TableCell className="font-medium">
                    {formatDateDisplay(day.date)}
                  </TableCell>
                  
                  {/* AI-записей */}
                  <TableCell className="text-right">
                    {formatNum(day.runsCount)}
                  </TableCell>
                  
                  {/* Токены всего */}
                  <TableCell className="text-right font-semibold">
                    {formatNum(day.totalSpentTokens)}
                  </TableCell>
                  
                  {/* Токены среднее */}
                  <TableCell className="text-right">
                    {formatNum(Math.round(day.avgSpentTokens))}
                  </TableCell>
                  
                  {/* Уникальных джоб */}
                  <TableCell className="text-right">
                    {formatNum(day.uniqueJobsCount)}
                  </TableCell>
                  
                  {/* Топ джоба дня */}
                  <TableCell>
                    {day.topJobName ? (
                      <div>
                        <span className="font-medium">
                          {getDisplayName(day.topJobName)}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {day.topJobName}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  {/* Токены топ-джобы */}
                  <TableCell className="text-right">
                    {day.topJobTokens > 0 
                      ? formatNum(day.topJobTokens)
                      : <span className="text-muted-foreground">—</span>}
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
