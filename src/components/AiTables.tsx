'use client';

import { useAiLogStore, AI_JOB_NAMES_RU } from '@/store/aiLogStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDuration, formatNumber } from '@/lib/aiParser';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TableIcon, AlertTriangle, Cpu } from 'lucide-react';

/**
 * Таблица статистики по джобам
 */
export function AiJobStatsTable() {
  const getByJobStats = useAiLogStore(state => state.getByJobStats);
  const jobStats = getByJobStats();
  
  if (jobStats.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="h-5 w-5" />
          Статистика по джобам
        </CardTitle>
        <CardDescription>Детальная статистика по каждой AI джобе</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Джоба</TableHead>
                <TableHead className="text-right">Запусков</TableHead>
                <TableHead className="text-right">Успешных</TableHead>
                <TableHead className="text-right">Ошибок</TableHead>
                <TableHead className="text-right">Успешность</TableHead>
                <TableHead className="text-right">Средняя длит.</TableHead>
                <TableHead className="text-right">P95 длит.</TableHead>
                <TableHead className="text-right">Токенов</TableHead>
                <TableHead className="text-right">Среднее токенов</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobStats.map((stat) => {
                const displayName = AI_JOB_NAMES_RU[stat.name] || stat.name;
                return (
                  <TableRow key={stat.name}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{displayName}</div>
                        <div className="text-xs text-muted-foreground">{stat.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(stat.totalRuns)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatNumber(stat.successCount)}</TableCell>
                    <TableCell className="text-right">
                      {stat.errorCount > 0 ? (
                        <span className="text-red-600">{formatNumber(stat.errorCount)}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={stat.successRate >= 95 ? 'default' : stat.successRate >= 80 ? 'secondary' : 'destructive'}>
                        {stat.successRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatDuration(stat.avgDuration)}</TableCell>
                    <TableCell className="text-right">{formatDuration(stat.p95Duration)}</TableCell>
                    <TableCell className="text-right">{formatNumber(stat.totalSpentTokens)}</TableCell>
                    <TableCell className="text-right">{formatNumber(Math.round(stat.avgSpentTokens))}</TableCell>
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

/**
 * Таблица статистики по провайдерам и моделям
 */
export function AiProviderStatsTable() {
  const getByProviderStats = useAiLogStore(state => state.getByProviderStats);
  const providerStats = getByProviderStats();
  
  if (providerStats.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Статистика по провайдерам и моделям
        </CardTitle>
        <CardDescription>Сравнение производительности AI моделей</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Провайдер</TableHead>
                <TableHead>Модель</TableHead>
                <TableHead className="text-right">Запусков</TableHead>
                <TableHead className="text-right">Успешность</TableHead>
                <TableHead className="text-right">Средняя длит.</TableHead>
                <TableHead className="text-right">Токенов</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerStats.map((stat, index) => (
                <TableRow key={`${stat.provider}-${stat.modelName}-${index}`}>
                  <TableCell className="font-medium">{stat.provider || '-'}</TableCell>
                  <TableCell>{stat.modelName || '-'}</TableCell>
                  <TableCell className="text-right">{formatNumber(stat.runs)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={stat.successRate >= 95 ? 'default' : stat.successRate >= 80 ? 'secondary' : 'destructive'}>
                      {stat.successRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatDuration(stat.avgDuration)}</TableCell>
                  <TableCell className="text-right">{formatNumber(stat.totalSpentTokens)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Таблица ошибок
 */
export function AiErrorSummaryTable() {
  const getErrorSummaries = useAiLogStore(state => state.getErrorSummaries);
  const errorSummaries = getErrorSummaries();
  
  if (errorSummaries.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Сводка ошибок
        </CardTitle>
        <CardDescription>Типы ошибок и их частота</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ошибка</TableHead>
                <TableHead className="text-right">Количество</TableHead>
                <TableHead className="text-right">Последнее появление</TableHead>
                <TableHead>Джобы</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorSummaries.map((summary, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="max-w-md truncate" title={summary.error}>
                      {summary.error}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive">{formatNumber(summary.count)}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {format(summary.lastOccurrence, 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {summary.jobNames.slice(0, 3).map((name, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {AI_JOB_NAMES_RU[name] || name}
                        </Badge>
                      ))}
                      {summary.jobNames.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{summary.jobNames.length - 3}
                        </Badge>
                      )}
                    </div>
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

// Экспорт всех таблиц
export function AiTables() {
  return (
    <div className="space-y-6">
      <AiJobStatsTable />
      <AiProviderStatsTable />
      <AiErrorSummaryTable />
    </div>
  );
}
