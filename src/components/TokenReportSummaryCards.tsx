'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TokenReportSummary } from '@/lib/tokenReportTypes';
import { getDisplayName } from '@/lib/combinedAnalytics';
import { 
  Coins, 
  FileText, 
  Briefcase, 
  TrendingUp,
  Calendar,
  BarChart3,
  Star,
  Cpu
} from 'lucide-react';

interface TokenReportSummaryCardsProps {
  summary: TokenReportSummary;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString('ru-RU');
}

export function TokenReportSummaryCards({ summary }: TokenReportSummaryCardsProps) {
  const cards = [
    {
      label: 'Всего AI-записей',
      value: formatNumber(summary.totalRecords),
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Уникальных джоб',
      value: formatNumber(summary.uniqueJobs),
      icon: Briefcase,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Суммарно токенов',
      value: formatNumber(summary.totalSpentTokens),
      icon: Coins,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Среднее токенов / запись',
      value: formatNumber(Math.round(summary.avgTokensPerRecord)),
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Среднее токенов / сутки',
      value: formatNumber(Math.round(summary.avgTokensPerDay)),
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Максимум токенов / сутки',
      value: formatNumber(summary.maxTokensPerDay),
      icon: BarChart3,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Джоба-лидер по токенам',
      value: summary.topJobByTokens 
        ? `${getDisplayName(summary.topJobByTokens)} (${formatNumber(summary.topJobTokens)})`
        : '—',
      icon: Star,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      isWide: true,
    },
    {
      label: 'Модель-лидер по токенам',
      value: summary.topModelByTokens 
        ? `${summary.topModelByTokens} (${formatNumber(summary.topModelTokens)})`
        : '—',
      icon: Cpu,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      isWide: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className={card.isWide ? 'col-span-2' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                  <p className="text-lg font-semibold truncate">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
