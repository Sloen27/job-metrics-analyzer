'use client';

import { useJobStore, METRIC_DEFINITIONS, JOB_NAMES_RU } from '@/store/jobStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetricComparison } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDuration } from '@/lib/parser';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Форматирование значения метрики
 */
function formatMetricValue(value: number, formatType: string): string {
  switch (formatType) {
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
 * Компонент карточки сравнения одной метрики
 */
function MetricCard({ 
  metricKey, 
  comparison 
}: { 
  metricKey: string; 
  comparison: MetricComparison;
}) {
  const definition = METRIC_DEFINITIONS.find(m => m.key === metricKey);
  
  if (!definition) return null;
  
  const { label, unit, format: formatType, higherIsBetter } = definition;
  const { current, previous, change, changePercent } = comparison;
  
  // Определяем тренд
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(changePercent) > 5) {
    trend = changePercent > 0 ? 'up' : 'down';
  }
  
  // Определяем, является ли изменение положительным или отрицательным
  const isImprovement = higherIsBetter ? change > 0 : change < 0;
  const isDegradation = higherIsBetter ? change < 0 : change > 0;
  
  // Цвета: зелёный для улучшения, жёлтый для деградации, серый для стабильности
  const trendColor = trend === 'stable' ? 'text-muted-foreground' :
    isImprovement ? 'text-green-600' : 'text-yellow-600';
  
  // Иконка
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  // Форматирование изменения
  const formatChange = () => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${formatMetricValue(change, formatType)}`;
  };
  
  // Форматирование процентов
  const formatPercent = () => {
    const sign = changePercent > 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(1)}%`;
  };
  
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <TrendIcon className={cn("h-4 w-4", trendColor)} />
      </div>
      
      <div className="text-2xl font-bold">
        {formatMetricValue(current, formatType)}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
      
      <div className="flex items-center gap-3 text-sm">
        {/* Изменение относительно предыдущего периода */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-muted-foreground">vs {formatMetricValue(previous, formatType)}:</span>
          <Badge 
            variant="outline"
            className={cn(
              "font-mono text-xs",
              isImprovement && Math.abs(changePercent) > 5 && "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
              isDegradation && Math.abs(changePercent) > 5 && "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700"
            )}
          >
            {formatChange()} ({formatPercent()})
          </Badge>
        </div>
      </div>
      
      {/* Индикатор улучшения/деградации */}
      {(isImprovement || isDegradation) && Math.abs(changePercent) > 5 && (
        <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
          {isImprovement ? (
            <>
              <CheckCircle className="h-3 w-3" />
              <span>Улучшение</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3" />
              <span>Требует внимания</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function MetricsComparison() {
  const { jobStatistics, selectedJob, onlySuccessful } = useJobStore();
  
  if (!jobStatistics || !selectedJob) return null;
  
  const { latestDayComparisons, availableMetrics, comparisonDates } = jobStatistics;
  
  // Фильтруем метрики, которые есть в comparisons
  const metricsToShow = availableMetrics.filter(key => latestDayComparisons[key]);
  
  // Считаем улучшения и деградации
  const improvements: string[] = [];
  const degradations: string[] = [];
  
  for (const key of metricsToShow) {
    const comp = latestDayComparisons[key];
    const def = METRIC_DEFINITIONS.find(m => m.key === key);
    if (!def || Math.abs(comp.changePercent) <= 5) continue;
    
    const isImprovement = def.higherIsBetter ? comp.change > 0 : comp.change < 0;
    if (isImprovement) improvements.push(key);
    else degradations.push(key);
  }
  
  // Отображаемое имя джобы
  const displayName = JOB_NAMES_RU[selectedJob] || selectedJob;
  
  // Преобразуем строку даты в Date объект (локальное время)
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Сравнение периодов
        </CardTitle>
        <CardDescription>
          {displayName} • {jobStatistics.totalRuns} запусков
          {onlySuccessful && ' (только успешные)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Сводка улучшений/деградаций */}
        {(improvements.length > 0 || degradations.length > 0) && (
          <div className="flex gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
            {improvements.length > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {improvements.length} улучшений
                </span>
              </div>
            )}
            {degradations.length > 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {degradations.length} требуют внимания
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Информация о периодах */}
        {comparisonDates && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="font-medium text-green-700 dark:text-green-400">Период 1</div>
              <div className="text-muted-foreground text-xs mt-1">
                {format(parseLocalDate(comparisonDates.date1), 'd MMMM yyyy', { locale: ru })}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="font-medium">Период 2</div>
              <div className="text-muted-foreground text-xs mt-1">
                {format(parseLocalDate(comparisonDates.date2), 'd MMMM yyyy', { locale: ru })}
              </div>
            </div>
          </div>
        )}
        
        {/* Карточки метрик */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {metricsToShow.map(key => (
            <MetricCard 
              key={key} 
              metricKey={key} 
              comparison={latestDayComparisons[key]} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
