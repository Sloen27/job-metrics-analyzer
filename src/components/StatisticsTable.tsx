'use client';

import { useJobStore, JOB_COLORS } from '@/store/jobStore';
import { formatDuration, formatNumber } from '@/lib/parser';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Clock, BarChart3 } from 'lucide-react';

export function StatisticsTable() {
  const { statistics, selectedJob, selectJob } = useJobStore();
  
  if (statistics.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Сводная статистика по джобам
        </CardTitle>
        <CardDescription>
          Нажмите на строку для детального просмотра метрик
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Джоба</TableHead>
                <TableHead className="text-center">Запусков</TableHead>
                <TableHead className="text-center">Успешно</TableHead>
                <TableHead className="text-center">Ошибок</TableHead>
                <TableHead className="text-right">Средняя длит.</TableHead>
                <TableHead className="text-right">Мин. длит.</TableHead>
                <TableHead className="text-right">Макс. длит.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statistics.map((stat) => (
                <TableRow 
                  key={stat.name}
                  className={`cursor-pointer transition-colors ${
                    selectedJob === stat.name ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => selectJob(selectedJob === stat.name ? null : stat.name)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: JOB_COLORS[stat.name] || '#888' }}
                      />
                      <span className="font-medium">{stat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{stat.count}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {stat.successCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {stat.errorCount > 0 ? (
                      <div className="flex items-center justify-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        {stat.errorCount}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatDuration(stat.avgDuration)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatDuration(stat.minDuration)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatDuration(stat.maxDuration)}
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

export function JobMetricsDetail() {
  const { statistics, selectedJob, jobs } = useJobStore();
  
  if (!selectedJob) return null;
  
  const stat = statistics.find(s => s.name === selectedJob);
  if (!stat) return null;
  
  const jobJobs = jobs.filter(j => j.name === selectedJob);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: JOB_COLORS[selectedJob] || '#888' }}
          />
          {selectedJob}
        </CardTitle>
        <CardDescription>
          Детальная статистика и метрики
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Всего запусков</div>
            <div className="text-2xl font-bold">{stat.count}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Успешность</div>
            <div className="text-2xl font-bold text-green-600">
              {((stat.successCount / stat.count) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Средняя длительность</div>
            <div className="text-2xl font-bold">{formatDuration(stat.avgDuration)}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Общее время</div>
            <div className="text-2xl font-bold">{formatDuration(stat.totalDuration)}</div>
          </div>
        </div>
        
        {/* Метрики */}
        <div className="space-y-4">
          <h4 className="font-semibold">Метрики</h4>
          
          {stat.metrics.totalProcessedPosts && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Обработано постов:</span>
                <span className="font-mono">{formatNumber(stat.metrics.totalProcessedPosts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Среднее за запуск:</span>
                <span className="font-mono">{formatNumber(Math.round(stat.metrics.avgProcessedPosts || 0))}</span>
              </div>
            </div>
          )}
          
          {stat.metrics.totalTaggedPosts && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Протегировано постов:</span>
                <span className="font-mono">{formatNumber(stat.metrics.totalTaggedPosts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Средняя успешность:</span>
                <span className="font-mono">{(stat.metrics.avgSuccessRate || 0).toFixed(1)}%</span>
              </div>
            </div>
          )}
          
          {stat.metrics.avgLlmTime && (
            <div className="grid grid-cols-3 gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Среднее время LLM:</span>
                <span className="font-mono">{stat.metrics.avgLlmTime.toFixed(1)} мс</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Мин:</span>
                <span className="font-mono">{stat.metrics.minLlmTime?.toFixed(1)} мс</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Макс:</span>
                <span className="font-mono">{stat.metrics.maxLlmTime?.toFixed(1)} мс</span>
              </div>
            </div>
          )}
          
          {stat.metrics.totalLlmRequests && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Всего LLM запросов:</span>
              <span className="font-mono">{formatNumber(stat.metrics.totalLlmRequests)}</span>
            </div>
          )}
          
          {stat.metrics.totalProcessedInfoEvents && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Обработано инфоповодов:</span>
              <span className="font-mono">{formatNumber(stat.metrics.totalProcessedInfoEvents)}</span>
            </div>
          )}
          
          {stat.metrics.avgComments && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Среднее кол-во комментариев:</span>
              <span className="font-mono">{stat.metrics.avgComments.toFixed(2)}</span>
            </div>
          )}
          
          {stat.metrics.totalNewPosts && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Всего новых постов:</span>
              <span className="font-mono">{formatNumber(stat.metrics.totalNewPosts)}</span>
            </div>
          )}
          
          {/* Если нет специфичных метрик */}
          {Object.keys(stat.metrics).length === 0 && (
            <div className="text-muted-foreground text-sm">
              Нет детальных метрик для этого типа джобы
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
