'use client';

import { useMemo } from 'react';
import { useAiLogStore, AI_JOB_NAMES_RU } from '@/store/aiLogStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration, formatNumber } from '@/lib/aiParser';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

// Цвета для графиков
const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
  '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#ef4444',
];

/**
 * График запусков AI по времени
 */
export function AiRunsChart() {
  const getDailyStats = useAiLogStore(state => state.getDailyStats);
  const dailyStats = getDailyStats();
  
  const chartData = useMemo(() => {
    return dailyStats.map(day => ({
      date: day.date,
      dateFormatted: format(parseISO(day.date), 'dd MMM', { locale: ru }),
      totalRuns: day.totalRuns,
      successCount: day.successCount,
      errorCount: day.errorCount,
    }));
  }, [dailyStats]);
  
  if (chartData.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Запуски AI по времени
        </CardTitle>
        <CardDescription>Динамика запусков AI операций</CardDescription>
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
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalRuns"
                name="Всего"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="successCount"
                name="Успешных"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="errorCount"
                name="Ошибок"
                stroke="#ef4444"
                strokeWidth={2}
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
 * График ошибок по времени
 */
export function AiErrorsChart() {
  const getDailyStats = useAiLogStore(state => state.getDailyStats);
  const dailyStats = getDailyStats();
  
  const chartData = useMemo(() => {
    return dailyStats
      .filter(day => day.errorCount > 0)
      .map(day => ({
        date: day.date,
        dateFormatted: format(parseISO(day.date), 'dd MMM', { locale: ru }),
        errorCount: day.errorCount,
        errorRate: day.totalRuns > 0 ? (day.errorCount / day.totalRuns) * 100 : 0,
      }));
  }, [dailyStats]);
  
  if (chartData.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-red-500" />
          Ошибки по времени
        </CardTitle>
        <CardDescription>Динамика ошибок AI операций</CardDescription>
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
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  name === 'errorRate' ? `${value.toFixed(1)}%` : formatNumber(value),
                  name === 'errorRate' ? 'Доля ошибок' : 'Количество ошибок',
                ]}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="errorCount"
                name="Ошибок"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="errorRate"
                name="Доля ошибок (%)"
                stroke="#f59e0b"
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
 * Круговая диаграмма по провайдерам
 */
export function AiProviderChart() {
  const getByProviderStats = useAiLogStore(state => state.getByProviderStats);
  const providerStats = getByProviderStats();
  
  const chartData = useMemo(() => {
    return providerStats.slice(0, 10).map((stat, index) => ({
      name: stat.provider || 'Unknown',
      value: stat.runs,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [providerStats]);
  
  if (chartData.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Распределение по провайдерам
        </CardTitle>
        <CardDescription>Топ провайдеров по количеству запусков</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatNumber(value), 'Запусков']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Круговая диаграмма по моделям
 */
export function AiModelChart() {
  const getByProviderStats = useAiLogStore(state => state.getByProviderStats);
  const providerStats = getByProviderStats();
  
  const chartData = useMemo(() => {
    // Группируем по модели (без провайдера)
    const modelGroups = new Map<string, number>();
    for (const stat of providerStats) {
      const model = stat.modelName || 'Unknown';
      modelGroups.set(model, (modelGroups.get(model) || 0) + stat.runs);
    }
    
    return Array.from(modelGroups.entries())
      .map(([name, value], index) => ({
        name,
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [providerStats]);
  
  if (chartData.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Распределение по моделям
        </CardTitle>
        <CardDescription>Топ моделей по количеству запусков</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name.slice(0, 20)}... (${(percent * 100).toFixed(0)}%)`}
                labelLine={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatNumber(value), 'Запусков']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Столбчатая диаграмма топ джоб по запускам
 */
export function AiTopJobsChart() {
  const getByJobStats = useAiLogStore(state => state.getByJobStats);
  const jobStats = getByJobStats();
  
  const chartData = useMemo(() => {
    return jobStats.slice(0, 10).map(stat => ({
      name: AI_JOB_NAMES_RU[stat.name] || stat.name,
      runs: stat.totalRuns,
      success: stat.successCount,
      errors: stat.errorCount,
    }));
  }, [jobStats]);
  
  if (chartData.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Топ джоб по запускам
        </CardTitle>
        <CardDescription>Самые часто запускаемые AI операции</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis
                type="category"
                dataKey="name"
                className="text-xs"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="success" name="Успешных" stackId="a" fill="#10b981" />
              <Bar dataKey="errors" name="Ошибок" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Столбчатая диаграмма топ джоб по ошибкам
 */
export function AiTopErrorsChart() {
  const getByJobStats = useAiLogStore(state => state.getByJobStats);
  const jobStats = getByJobStats();
  
  const chartData = useMemo(() => {
    return jobStats
      .filter(stat => stat.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 10)
      .map(stat => ({
        name: AI_JOB_NAMES_RU[stat.name] || stat.name,
        errors: stat.errorCount,
        errorRate: stat.successRate > 0 ? 100 - stat.successRate : 0,
      }));
  }, [jobStats]);
  
  if (chartData.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-red-500" />
          Топ джоб по ошибкам
        </CardTitle>
        <CardDescription>Джобы с наибольшим количеством ошибок</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis
                type="category"
                dataKey="name"
                className="text-xs"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  name === 'errorRate' ? `${value.toFixed(1)}%` : formatNumber(value),
                  name === 'errorRate' ? 'Доля ошибок' : 'Количество ошибок',
                ]}
              />
              <Legend />
              <Bar dataKey="errors" name="Ошибок" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Экспорт всех графиков
export function AiCharts() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AiRunsChart />
        <AiErrorsChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AiProviderChart />
        <AiModelChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AiTopJobsChart />
        <AiTopErrorsChart />
      </div>
    </div>
  );
}
