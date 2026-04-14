'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { TokenReportByDay, TokenReportByJob } from '@/lib/tokenReportTypes';
import { getDisplayName } from '@/lib/combinedAnalytics';
import { BarChart3, LineChartIcon, PieChartIcon } from 'lucide-react';

interface TokenReportChartsProps {
  byDays: TokenReportByDay[];
  byJobs: TokenReportByJob[];
}

// Явные цвета для графиков (не CSS переменные)
const COLORS = {
  tokens: '#3b82f6',     // blue-500
  runs: '#10b981',       // emerald-500
  tokensBar: '#6366f1',  // indigo-500
  models: '#8b5cf6',     // violet-500
  grid: '#e5e7eb',       // gray-200
  text: '#6b7280',       // gray-500
};

const chartConfig = {
  tokens: {
    label: 'Токены',
    color: COLORS.tokens,
  },
  runs: {
    label: 'Записи',
    color: COLORS.runs,
  },
} satisfies ChartConfig;

export function TokenReportCharts({ byDays, byJobs }: TokenReportChartsProps) {
  // Подготовка данных для графика токенов по дням
  const tokensByDayData = useMemo(() => {
    return byDays
      .slice()
      .reverse() // Показываем в хронологическом порядке
      .map(day => ({
        date: day.date.slice(5), // MM-DD
        fullDate: day.date,
        tokens: day.totalSpentTokens,
        runs: day.runsCount,
      }));
  }, [byDays]);

  // Подготовка данных для топ-10 джоб по токенам
  const topJobsData = useMemo(() => {
    return byJobs.slice(0, 10).map(job => ({
      name: job.displayName.length > 20 
        ? job.displayName.slice(0, 20) + '...' 
        : job.displayName,
      fullName: job.displayName,
      tokens: job.totalSpentTokens,
      share: (job.tokenShare * 100).toFixed(1),
    }));
  }, [byJobs]);

  // Подготовка данных для распределения по моделям
  const modelDistributionData = useMemo(() => {
    const modelTotals = new Map<string, number>();
    
    for (const job of byJobs) {
      // Распределяем токены джобы по её моделям поровну (упрощение)
      if (job.modelsUsed.length > 0 && job.totalSpentTokens > 0) {
        const perModel = job.totalSpentTokens / job.modelsUsed.length;
        for (const model of job.modelsUsed) {
          const current = modelTotals.get(model) || 0;
          modelTotals.set(model, current + perModel);
        }
      }
    }
    
    const sorted = Array.from(modelTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return sorted.map(([model, tokens]) => ({
      name: model.length > 20 ? model.slice(0, 20) + '...' : model,
      fullName: model,
      tokens: Math.round(tokens),
    }));
  }, [byJobs]);

  if (byDays.length === 0 && byJobs.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* График токенов по дням */}
      {byDays.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Токены по дням
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tokensByDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: COLORS.text }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: COLORS.text }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value;
                    }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(value, payload) => {
                      const data = payload?.[0]?.payload;
                      return data?.fullDate || value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tokens"
                    stroke={COLORS.tokens}
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLORS.tokens }}
                    name="tokens"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* График записей по дням */}
      {byDays.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              AI-записи по дням
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokensByDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: COLORS.text }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: COLORS.text }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(value, payload) => {
                      const data = payload?.[0]?.payload;
                      return data?.fullDate || value;
                    }}
                  />
                  <Bar
                    dataKey="runs"
                    fill={COLORS.runs}
                    radius={[4, 4, 0, 0]}
                    name="runs"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Топ-10 джоб по токенам */}
      {byJobs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Топ-10 джоб по токенам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topJobsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 10, fill: COLORS.text }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value;
                    }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 9, fill: COLORS.text }}
                    width={120}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => (
                      <div className="text-xs">
                        <div><strong>{props.payload.fullName}</strong></div>
                        <div>Токены: {value?.toLocaleString('ru-RU')}</div>
                        <div>Доля: {props.payload.share}%</div>
                      </div>
                    )}
                  />
                  <Bar
                    dataKey="tokens"
                    fill={COLORS.tokensBar}
                    radius={[0, 4, 4, 0]}
                    name="tokens"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Распределение по моделям */}
      {modelDistributionData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Токены по моделям (топ-10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelDistributionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 10, fill: COLORS.text }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value;
                    }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 9, fill: COLORS.text }}
                    width={140}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => (
                      <div className="text-xs">
                        <div><strong>{props.payload.fullName}</strong></div>
                        <div>Токены: ~{value?.toLocaleString('ru-RU')}</div>
                      </div>
                    )}
                  />
                  <Bar
                    dataKey="tokens"
                    fill={COLORS.models}
                    radius={[0, 4, 4, 0]}
                    name="tokens"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
