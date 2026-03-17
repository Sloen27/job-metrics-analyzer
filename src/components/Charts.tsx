'use client';

import { useMemo, useState } from 'react';
import { useJobStore, METRIC_DEFINITIONS, JOB_COLORS, JOB_NAMES_RU } from '@/store/jobStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DailyMetrics } from '@/lib/types';
import { formatDuration } from '@/lib/parser';
import { TrendingUp, BarChart3, Clock } from 'lucide-react';

/**
 * Получить значение метрики
 */
function getMetricValue(day: DailyMetrics, metricKey: string): number {
  if (metricKey === 'runCount') return day.runCount;
  if (metricKey === 'successCount') return day.successCount;
  if (metricKey === 'errorCount') return day.errorCount;
  if (metricKey === 'avgDuration') return day.avgDuration;
  
  const metrics = day.metrics as Record<string, number | undefined>;
  return metrics[metricKey] || 0;
}

/**
 * Форматирование значения для tooltip
 */
function formatTooltipValue(value: number, format: string): string {
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
 * График динамики метрики по времени
 */
export function MetricTrendChart() {
  const { jobStatistics, selectedJob, onlySuccessful } = useJobStore();
  const [selectedMetric, setSelectedMetric] = useState<string>('runCount');
  
  // Получаем доступные метрики
  const availableMetrics = useMemo(() => {
    if (!jobStatistics) return [];
    
    return jobStatistics.availableMetrics
      .map(key => METRIC_DEFINITIONS.find(m => m.key === key))
      .filter((m): m is typeof METRIC_DEFINITIONS[0] => m !== undefined);
  }, [jobStatistics]);
  
  // Выбираем данные для графика
  const chartData = useMemo(() => {
    if (!jobStatistics || !selectedMetric) return [];
    
    const definition = METRIC_DEFINITIONS.find(m => m.key === selectedMetric);
    if (!definition) return [];
    
    const sourceData = jobStatistics.dailyMetrics;
    
    // Вычисляем среднее
    const values = sourceData
      .map(d => getMetricValue(d, selectedMetric))
      .filter(v => v !== undefined);
    
    const average = values.length > 0 
      ? values.reduce((a, b) => a + b, 0) / values.length 
      : 0;
    
    return sourceData
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        date: d.date,
        label: format(parseISO(d.date), 'dd.MM.yyyy'),
        value: getMetricValue(d, selectedMetric),
        average,
      }));
  }, [jobStatistics, selectedMetric]);
  
  if (!jobStatistics || !selectedJob) return null;
  
  const currentDefinition = METRIC_DEFINITIONS.find(m => m.key === selectedMetric);
  const displayName = JOB_NAMES_RU[selectedJob] || selectedJob;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Динамика метрики
            </CardTitle>
            <CardDescription>
              {displayName}
              {onlySuccessful && ' • только успешные'}
            </CardDescription>
          </div>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Выберите метрику" />
            </SelectTrigger>
            <SelectContent>
              {availableMetrics.map(metric => (
                <SelectItem key={metric.key} value={metric.key}>
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                className="text-xs"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [
                  formatTooltipValue(value, currentDefinition?.format || 'number'),
                  currentDefinition?.label || 'Значение'
                ]}
                labelFormatter={(label) => `Дата: ${label}`}
              />
              <Legend />
              <ReferenceLine 
                y="average" 
                stroke="#888" 
                strokeDasharray="5 5"
                label={{ value: 'Среднее', position: 'right', fill: '#888', fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={currentDefinition?.label || 'Значение'}
                stroke={JOB_COLORS[selectedJob] || '#6366f1'}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * График количества запусков и успешности
 */
export function RunCountChart() {
  const { jobStatistics, selectedJob, onlySuccessful } = useJobStore();
  
  const chartData = useMemo(() => {
    if (!jobStatistics) return [];
    
    return jobStatistics.dailyMetrics
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        date: day.date,
        dateFormatted: format(parseISO(day.date), 'dd MMM', { locale: ru }),
        runCount: day.runCount,
        successCount: day.successCount,
        errorCount: day.errorCount,
        successRate: day.runCount > 0 
          ? (day.successCount / day.runCount) * 100 
          : 100,
      }));
  }, [jobStatistics]);
  
  if (!jobStatistics || !selectedJob) return null;
  
  const displayName = JOB_NAMES_RU[selectedJob] || selectedJob;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Запуски и успешность
        </CardTitle>
        <CardDescription>
          {displayName}
          {onlySuccessful && ' • только успешные'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateFormatted" 
                className="text-xs"
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                yAxisId="left"
                className="text-xs"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-xs"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {!onlySuccessful && (
                <>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="runCount"
                    name="Всего запусков"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="errorCount"
                    name="Ошибок"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </>
              )}
              {onlySuccessful && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="successCount"
                  name="Успешных"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="successRate"
                name="Успешность (%)"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * График длительности выполнения
 */
export function DurationChart() {
  const { jobStatistics, selectedJob, onlySuccessful } = useJobStore();
  
  const chartData = useMemo(() => {
    if (!jobStatistics) return [];
    
    const durations = jobStatistics.dailyMetrics.map(d => d.avgDuration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    return jobStatistics.dailyMetrics
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        date: day.date,
        dateFormatted: format(parseISO(day.date), 'dd MMM', { locale: ru }),
        avgDuration: day.avgDuration / 1000,
        minDuration: day.minDuration / 1000,
        maxDuration: day.maxDuration / 1000,
        avgLine: avgDuration / 1000,
      }));
  }, [jobStatistics]);
  
  if (!jobStatistics || !selectedJob) return null;
  
  const displayName = JOB_NAMES_RU[selectedJob] || selectedJob;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Длительность выполнения
        </CardTitle>
        <CardDescription>
          {displayName}
          {onlySuccessful && ' • только успешные'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateFormatted" 
                className="text-xs"
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                className="text-xs"
                tickFormatter={(v) => `${v}с`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value.toFixed(1)} сек`, '']}
              />
              <Legend />
              <ReferenceLine 
                y="avgLine" 
                stroke="#888" 
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="avgDuration"
                name="Средняя"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="minDuration"
                name="Минимальная"
                stroke="#10b981"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="maxDuration"
                name="Максимальная"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
