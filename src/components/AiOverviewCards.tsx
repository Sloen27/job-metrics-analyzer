'use client';

import { useAiLogStore } from '@/store/aiLogStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration, formatNumber } from '@/lib/aiParser';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Coins,
  Clock,
  Gauge,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export function AiOverviewCards() {
  const getStatistics = useAiLogStore(state => state.getStatistics);
  const stats = getStatistics();
  
  if (!stats) return null;
  
  const cards = [
    {
      title: 'Всего записей',
      value: formatNumber(stats.totalRecords),
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Успешность',
      value: `${stats.successRate.toFixed(1)}%`,
      subtitle: `${formatNumber(stats.successCount)} из ${formatNumber(stats.totalRecords)}`,
      icon: CheckCircle,
      color: stats.successRate >= 95 ? 'text-green-500' : stats.successRate >= 80 ? 'text-yellow-500' : 'text-red-500',
      bgColor: stats.successRate >= 95 ? 'bg-green-500/10' : stats.successRate >= 80 ? 'bg-yellow-500/10' : 'bg-red-500/10',
    },
    {
      title: 'Ошибок',
      value: formatNumber(stats.errorCount),
      subtitle: `${stats.errorRate.toFixed(1)}%`,
      icon: XCircle,
      color: stats.errorCount === 0 ? 'text-green-500' : 'text-red-500',
      bgColor: stats.errorCount === 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
    {
      title: 'Всего токенов',
      value: formatNumber(stats.totalSpentTokens),
      subtitle: `среднее: ${formatNumber(Math.round(stats.avgSpentTokens))}`,
      icon: Coins,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Средняя длительность',
      value: formatDuration(stats.avgDuration),
      subtitle: `p95: ${formatDuration(stats.p95Duration)}`,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Средняя задержка очереди',
      value: formatDuration(stats.avgQueueLag),
      subtitle: `p95: ${formatDuration(stats.p95QueueLag)}`,
      icon: Gauge,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
