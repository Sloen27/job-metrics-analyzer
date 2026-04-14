'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CombinedSummaryCards as CombinedSummaryCardsType } from '@/lib/aiTypes';
import { formatNum } from '@/lib/combinedAnalytics';
import { 
  Layers, 
  FileText, 
  Cpu, 
  Link2, 
  Coins,
  CheckCircle 
} from 'lucide-react';

interface CombinedSummaryCardsProps {
  cards: CombinedSummaryCardsType;
}

export function CombinedSummaryCards({ cards }: CombinedSummaryCardsProps) {
  const cardItems = [
    {
      label: 'Всего уникальных джоб',
      value: cards.totalUniqueJobs,
      icon: Layers,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Только в OperationLog',
      value: cards.operationOnlyJobs,
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Только в AiLog',
      value: cards.aiOnlyJobs,
      icon: Cpu,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'В обоих источниках',
      value: cards.bothSourcesJobs,
      icon: Link2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Всего AI токенов',
      value: formatNum(cards.totalAiTokens),
      icon: Coins,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Средний AI success rate',
      value: cards.avgAiSuccessRate > 0 ? `${cards.avgAiSuccessRate.toFixed(1)}%` : '—',
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cardItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-semibold">{item.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
