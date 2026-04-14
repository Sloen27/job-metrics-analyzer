'use client';

import { useMemo } from 'react';
import { useJobStore, JOB_NAMES_RU } from '@/store/jobStore';
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
import { JobLog, JobStatus } from '@/lib/types';
import { formatDuration } from '@/lib/parser';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { List, CheckCircle2, XCircle, Clock } from 'lucide-react';

/**
 * Извлечь ключевые метрики для отображения
 */
function extractKeyMetrics(job: JobLog): { label: string; value: string }[] {
  const metrics: { label: string; value: string }[] = [];
  
  // Общие метрики
  if (job.metrics.processedPosts !== undefined) {
    metrics.push({ label: 'Постов', value: job.metrics.processedPosts.toLocaleString('ru-RU') });
  }
  
  if (job.metrics.taggedPosts !== undefined) {
    metrics.push({ label: 'Тегов', value: job.metrics.taggedPosts.toLocaleString('ru-RU') });
  }
  
  if (job.metrics.processedInfoEvents !== undefined) {
    metrics.push({ label: 'Инфоповодов', value: job.metrics.processedInfoEvents.toLocaleString('ru-RU') });
  }
  
  // LLM метрики
  if (job.metrics.llmRequestsCount !== undefined) {
    metrics.push({ label: 'LLM запросов', value: job.metrics.llmRequestsCount.toLocaleString('ru-RU') });
  }
  
  if (job.metrics.avgLlmTime !== undefined) {
    metrics.push({ label: 'Ср.время LLM', value: `${Math.round(job.metrics.avgLlmTime)} мс` });
  }
  
  if (job.metrics.totalLlmTime !== undefined) {
    metrics.push({ label: 'Всего LLM', value: `${(job.metrics.totalLlmTime / 1000).toFixed(1)} сек` });
  }
  
  // Комментарии
  if (job.metrics.avgComments !== undefined) {
    metrics.push({ label: 'Ср.комм.', value: job.metrics.avgComments.toFixed(1) });
  }
  
  if (job.metrics.totalComments !== undefined) {
    metrics.push({ label: 'Комментариев', value: job.metrics.totalComments.toLocaleString('ru-RU') });
  }
  
  // Telegram метрики (TelegramProcessingJob)
  if (job.metrics.activeSources !== undefined) {
    metrics.push({ label: 'Активных источников', value: job.metrics.activeSources.toLocaleString('ru-RU') });
  }
  
  if (job.metrics.processedSources !== undefined) {
    metrics.push({ label: 'Обработанных ист.', value: job.metrics.processedSources.toLocaleString('ru-RU') });
  }
  
  if (job.metrics.connectedSources !== undefined) {
    metrics.push({ label: 'Подключённых ист.', value: job.metrics.connectedSources.toLocaleString('ru-RU') });
  }
  
  if (job.metrics.usedAccounts !== undefined) {
    metrics.push({ label: 'Аккаунтов', value: job.metrics.usedAccounts.toLocaleString('ru-RU') });
  }
  
  if (job.metrics.newPosts !== undefined) {
    metrics.push({ label: 'Новых постов', value: job.metrics.newPosts.toLocaleString('ru-RU') });
  }
  
  if (job.metrics.totalPosts !== undefined) {
    metrics.push({ label: 'Всего постов', value: job.metrics.totalPosts.toLocaleString('ru-RU') });
  }
  
  // Проценты
  if (job.metrics.successRate !== undefined) {
    metrics.push({ label: 'Успешность', value: `${job.metrics.successRate.toFixed(1)}%` });
  }
  
  if (job.metrics.taggedPercent !== undefined) {
    metrics.push({ label: 'Протегировано', value: `${job.metrics.taggedPercent.toFixed(1)}%` });
  }
  
  if (job.metrics.shortPostsPercent !== undefined) {
    metrics.push({ label: 'Коротких', value: `${job.metrics.shortPostsPercent.toFixed(1)}%` });
  }

  // === НОВЫЕ МЕТРИКИ PostTagProcessingJob ===
  if (job.metrics.postsWith2to4TagsPercent !== undefined) {
    metrics.push({ label: '2-4 тега', value: `${job.metrics.postsWith2to4TagsPercent.toFixed(1)}%` });
  }

  if (job.metrics.postsWith1TagPercent !== undefined) {
    metrics.push({ label: '1 тег', value: `${job.metrics.postsWith1TagPercent.toFixed(1)}%` });
  }

  if (job.metrics.brokenPostsPercent !== undefined) {
    metrics.push({ label: 'Сломанных', value: `${job.metrics.brokenPostsPercent.toFixed(2)}%` });
  }

  if (job.metrics.newPostsTaggedIn2DaysPercent !== undefined) {
    metrics.push({ label: 'Новых за 2 дня', value: `${job.metrics.newPostsTaggedIn2DaysPercent.toFixed(1)}%` });
  }

  if (job.metrics.avgTimeToTag !== undefined) {
    metrics.push({ label: 'Ср.время до тега', value: `${job.metrics.avgTimeToTag.toFixed(1)} мин` });
  }

  // Тайминги компонентов
  if (job.metrics.dbTimePercent !== undefined) {
    metrics.push({ label: 'БД', value: `${job.metrics.dbTimePercent.toFixed(1)}%` });
  }

  if (job.metrics.openSearchTimePercent !== undefined) {
    metrics.push({ label: 'OpenSearch', value: `${job.metrics.openSearchTimePercent.toFixed(1)}%` });
  }

  if (job.metrics.llmTimePercent !== undefined) {
    metrics.push({ label: 'LLM доля', value: `${job.metrics.llmTimePercent.toFixed(1)}%` });
  }

  // === НОВЫЕ МЕТРИКИ TelegramProcessingJob ===
  if (job.metrics.proxyChanges !== undefined) {
    metrics.push({ label: 'Смен прокси', value: job.metrics.proxyChanges.toLocaleString('ru-RU') });
  }

  if (job.metrics.uniqueProxies !== undefined) {
    metrics.push({ label: 'Уник. прокси', value: job.metrics.uniqueProxies.toLocaleString('ru-RU') });
  }

  if (job.metrics.medianProxyPing !== undefined) {
    metrics.push({ label: 'Пинг прокси', value: `${job.metrics.medianProxyPing} мс` });
  }

  if (job.metrics.proxyChangeSourcesPercent !== undefined) {
    metrics.push({ label: 'Смена прокси', value: `${job.metrics.proxyChangeSourcesPercent.toFixed(1)}%` });
  }

  if (job.metrics.avgSourcesPerProxy !== undefined) {
    metrics.push({ label: 'Ист. на прокси', value: job.metrics.avgSourcesPerProxy.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) });
  }

  // === НОВЫЕ МЕТРИКИ TelegramPostCommentTrendProcessingJob ===
  if (job.metrics.totalTrackedPosts !== undefined) {
    metrics.push({ label: 'Отслеживаемых', value: job.metrics.totalTrackedPosts.toLocaleString('ru-RU') });
  }
  
  return metrics;
}

/**
 * Компонент одной строки запуска
 */
function RunRow({ job, index }: { job: JobLog; index: number }) {
  const keyMetrics = extractKeyMetrics(job);
  
  return (
    <TableRow className={cn(
      "transition-colors hover:bg-muted/50",
      job.status === JobStatus.Error && "bg-red-50 dark:bg-red-950/20"
    )}>
      {/* Номер */}
      <TableCell className="font-mono text-xs text-muted-foreground w-[50px]">
        {index + 1}
      </TableCell>
      
      {/* Время запуска */}
      <TableCell className="w-[130px]">
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {format(job.startDate, 'dd.MM.yyyy', { locale: ru })}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(job.startDate, 'HH:mm:ss')}
          </span>
        </div>
      </TableCell>
      
      {/* Длительность */}
      <TableCell className="w-[100px]">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-sm">{formatDuration(job.duration)}</span>
        </div>
      </TableCell>
      
      {/* Статус */}
      <TableCell className="w-[80px]">
        {job.status === JobStatus.Success ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            OK
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Ошибка
          </Badge>
        )}
      </TableCell>
      
      {/* Метрики */}
      <TableCell>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {keyMetrics.map((m, i) => (
            <div key={i} className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">{m.label}:</span>
              <span className="font-medium">{m.value}</span>
            </div>
          ))}
          {keyMetrics.length === 0 && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function JobRunsList() {
  const { jobs, selectedJob, onlySuccessful } = useJobStore();
  
  // Фильтруем запуски выбранной джобы
  const jobRuns = useMemo(() => {
    if (!selectedJob) return [];
    
    let filtered = jobs.filter(j => j.name === selectedJob);
    
    if (onlySuccessful) {
      filtered = filtered.filter(j => j.status === JobStatus.Success);
    }
    
    // Сортируем по дате (новые сначала)
    return filtered.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }, [jobs, selectedJob, onlySuccessful]);
  
  if (!selectedJob || jobRuns.length === 0) return null;
  
  const displayName = JOB_NAMES_RU[selectedJob] || selectedJob;
  const successCount = jobRuns.filter(j => j.status === JobStatus.Success).length;
  const errorCount = jobRuns.filter(j => j.status === JobStatus.Error).length;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Список запусков
            </CardTitle>
            <CardDescription>
              {displayName} • {jobRuns.length} запусков
              {onlySuccessful && ' (только успешные)'}
            </CardDescription>
          </div>
          
          {/* Статистика по статусам */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">{successCount}</span>
              <span className="text-muted-foreground">успешных</span>
            </div>
            {!onlySuccessful && errorCount > 0 && (
              <div className="flex items-center gap-1.5 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">{errorCount}</span>
                <span className="text-muted-foreground">ошибок</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[350px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead className="w-[130px]">Время</TableHead>
                <TableHead className="w-[100px]">Длительность</TableHead>
                <TableHead className="w-[80px]">Статус</TableHead>
                <TableHead>Метрики</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobRuns.map((job, index) => (
                <RunRow key={job.id} job={job} index={index} />
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
