'use client';

import { useMemo } from 'react';
import { useJobStore, METRIC_DEFINITIONS, JOB_NAMES_RU } from '@/store/jobStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DailyMetrics } from '@/lib/types';
import { formatDuration } from '@/lib/parser';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Форматирование значения метрики
 */
function formatMetricValue(value: number | undefined, format: string): string {
  if (value === undefined || value === null) return '-';
  
  switch (format) {
    case 'duration':
      return formatDuration(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'decimal':
      return value.toFixed(2);
    default:
      return value.toLocaleString('ru-RU');
  }
}

/**
 * Получить значение метрики из DailyMetrics
 */
function getMetricValue(day: DailyMetrics, metricKey: string): number | undefined {
  if (metricKey === 'runCount') return day.runCount;
  if (metricKey === 'successCount') return day.successCount;
  if (metricKey === 'avgDuration') return day.avgDuration;
  
  const metrics = day.metrics as Record<string, number | undefined>;
  return metrics[metricKey];
}

/**
 * Компонент ячейки с трендом
 */
function TrendCell({ 
  current, 
  previous, 
  format,
  higherIsBetter 
}: { 
  current: number | undefined; 
  previous: number | undefined;
  format: string;
  higherIsBetter: boolean;
}) {
  if (current === undefined || previous === undefined) {
    return <span className="text-muted-foreground">{formatMetricValue(current, format)}</span>;
  }
  
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;
  
  // Определяем тренд
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendColor = 'text-muted-foreground';
  
  if (Math.abs(changePercent) > 5) {
    const isPositive = higherIsBetter ? change > 0 : change < 0;
    trend = change > 0 ? 'up' : 'down';
    trendColor = isPositive ? 'text-green-600' : 'text-yellow-600';
  }
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  return (
    <div className="flex items-center gap-2">
      <span>{formatMetricValue(current, format)}</span>
      {trend !== 'stable' && (
        <TrendIcon className={cn("h-3 w-3", trendColor)} />
      )}
    </div>
  );
}

export function DailyMetricsTable() {
  const { jobStatistics, selectedJob, onlySuccessful } = useJobStore();
  
  // Получаем метрики для отображения в таблице
  const tableMetrics = useMemo(() => {
    if (!jobStatistics) return [];
    
    // Фильтруем метрики, которые реально есть в данных
    return jobStatistics.availableMetrics
      .map(key => METRIC_DEFINITIONS.find(m => m.key === key))
      .filter((m): m is typeof METRIC_DEFINITIONS[0] => m !== undefined)
      .filter(m => {
        // Проверяем, что метрика действительно есть хотя бы в одном дне
        return jobStatistics.dailyMetrics.some(day => {
          const value = getMetricValue(day, m.key);
          return value !== undefined && value !== 0;
        });
      });
  }, [jobStatistics]);
  
  if (!jobStatistics || !selectedJob) return null;
  
  const { dailyMetrics } = jobStatistics;
  const displayName = JOB_NAMES_RU[selectedJob] || selectedJob;
  
  // Сортируем дни от новых к старым
  const sortedDays = [...dailyMetrics].sort((a, b) => b.date.localeCompare(a.date));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Метрики по дням
        </CardTitle>
        <CardDescription>
          {displayName}
          {onlySuccessful && ' • только успешные'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="min-w-[120px]">Дата</TableHead>
                {tableMetrics.map(metric => (
                  <TableHead key={metric.key} className="min-w-[100px]">
                    <div className="flex flex-col">
                      <span>{metric.label}</span>
                      {metric.unit && (
                        <span className="text-xs text-muted-foreground">({metric.unit})</span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDays.map((day, index) => {
                const previousDay = index < sortedDays.length - 1 ? sortedDays[index + 1] : null;
                
                return (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>
                          {format(parseISO(day.date), 'dd MMM yyyy', { locale: ru })}
                        </span>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {day.runCount} запусков
                          </Badge>
                          {day.errorCount > 0 && !onlySuccessful && (
                            <Badge variant="destructive" className="text-xs">
                              {day.errorCount} ошибок
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {tableMetrics.map(metric => {
                      const currentValue = getMetricValue(day, metric.key);
                      const previousValue = previousDay ? getMetricValue(previousDay, metric.key) : undefined;
                      
                      return (
                        <TableCell key={metric.key}>
                          <TrendCell
                            current={currentValue}
                            previous={previousValue}
                            format={metric.format}
                            higherIsBetter={metric.higherIsBetter}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
