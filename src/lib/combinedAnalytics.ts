// Логика агрегации для сводного представления

import { JobLog } from './types';
import { 
  AiLogRow, 
  CombinedJobSummary, 
  CombinedSummaryCards,
  OperationLogAggregates,
  AiLogAggregates,
  CoverageType,
  CombinedFilters,
  CombinedSort,
  CombinedSortField
} from './aiTypes';
import { percentile } from './aiParser';
import { JOB_NAMES_RU } from '@/store/jobStore';
import { AI_JOB_NAMES_RU } from '@/store/aiLogStore';

// ==================== HELPER FUNCTIONS ====================

/**
 * Безопасное получение максимальной даты
 */
export function safeMaxDate(dates: (Date | null)[]): Date | null {
  const validDates = dates.filter((d): d is Date => d !== null && !isNaN(d.getTime()));
  if (validDates.length === 0) return null;
  return new Date(Math.max(...validDates.map(d => d.getTime())));
}

/**
 * Безопасное получение числа
 */
export function safeNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Безопасный расчёт success rate
 */
export function safeSuccessRate(successCount: number, total: number): number {
  if (total <= 0) return 0;
  return (successCount / total) * 100;
}

/**
 * Получение уникальных непустых значений
 */
export function uniqueNonEmpty(values: (string | undefined | null)[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    if (v && v.trim()) {
      set.add(v.trim());
    }
  }
  return Array.from(set).sort();
}

/**
 * Форматирование длительности
 */
export function formatDurationMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} мс`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} сек`;
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.round((ms % 60000) / 1000);
    return `${minutes} мин ${seconds} сек`;
  }
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.round((ms % 3600000) / 60000);
  return `${hours} ч ${minutes} мин`;
}

/**
 * Форматирование даты
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Форматирование числа
 */
export function formatNum(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return num.toLocaleString('ru-RU');
}

/**
 * Форматирование процентов
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
}

/**
 * Получить отображаемое имя джобы
 */
export function getDisplayName(name: string): string {
  return JOB_NAMES_RU[name] || AI_JOB_NAMES_RU[name] || name;
}

// ==================== AGGREGATION FUNCTIONS ====================

/**
 * Агрегация OperationLog данных по имени джобы
 */
export function aggregateOperationLogByName(jobs: JobLog[]): Map<string, OperationLogAggregates> {
  const groups = new Map<string, JobLog[]>();
  
  // Группируем по имени
  for (const job of jobs) {
    const existing = groups.get(job.name) || [];
    existing.push(job);
    groups.set(job.name, existing);
  }
  
  const result = new Map<string, OperationLogAggregates>();
  
  for (const [name, groupJobs] of groups) {
    const runs = groupJobs.length;
    const successCount = groupJobs.filter(j => j.status === 1).length;
    const errorCount = groupJobs.filter(j => j.status === 3).length;
    const successRate = safeSuccessRate(successCount, runs);
    
    // Длительности
    const durations = groupJobs.map(j => j.duration).filter(d => d > 0);
    const avgDurationMs = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;
    const p95DurationMs = percentile(durations, 95);
    
    // Последняя активность
    const dates = groupJobs.map(j => j.startDate).filter(d => d && !isNaN(d.getTime()));
    const lastActivityAt = dates.length > 0 
      ? new Date(Math.max(...dates.map(d => d.getTime())))
      : null;
    
    result.set(name, {
      runs,
      successCount,
      errorCount,
      successRate,
      avgDurationMs,
      p95DurationMs,
      lastActivityAt,
    });
  }
  
  return result;
}

/**
 * Агрегация AiLog данных по имени джобы
 */
export function aggregateAiLogByName(records: AiLogRow[]): Map<string, AiLogAggregates> {
  const groups = new Map<string, AiLogRow[]>();
  
  // Группируем по имени
  for (const record of records) {
    const existing = groups.get(record.name) || [];
    existing.push(record);
    groups.set(record.name, existing);
  }
  
  const result = new Map<string, AiLogAggregates>();
  
  for (const [name, groupRecords] of groups) {
    const runs = groupRecords.length;
    const successCount = groupRecords.filter(r => r.isSuccess).length;
    const errorCount = groupRecords.filter(r => r.isError).length;
    const successRate = safeSuccessRate(successCount, runs);
    
    // Длительности
    const durations = groupRecords.map(r => r.durationMs).filter(d => !isNaN(d));
    const avgDurationMs = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;
    const p95DurationMs = percentile(durations, 95);
    
    // Queue lag
    const queueLags = groupRecords.map(r => r.queueLagMs).filter(l => !isNaN(l));
    const avgQueueLagMs = queueLags.length > 0 
      ? queueLags.reduce((a, b) => a + b, 0) / queueLags.length 
      : 0;
    const p95QueueLagMs = percentile(queueLags, 95);
    
    // Токены
    const totalSpentTokens = groupRecords.reduce((sum, r) => sum + safeNumber(r.spentTokens), 0);
    const avgSpentTokens = runs > 0 ? totalSpentTokens / runs : 0;
    
    // Последняя активность
    const dates = groupRecords.map(r => r.startDate).filter(d => d && !isNaN(d.getTime()));
    const lastActivityAt = dates.length > 0 
      ? new Date(Math.max(...dates.map(d => d.getTime())))
      : null;
    
    // Уникальные значения
    const providers = uniqueNonEmpty(groupRecords.map(r => r.provider));
    const models = uniqueNonEmpty(groupRecords.map(r => r.modelName));
    const configTypes = uniqueNonEmpty(groupRecords.map(r => r.configType));
    
    result.set(name, {
      runs,
      successCount,
      errorCount,
      successRate,
      avgDurationMs,
      p95DurationMs,
      avgQueueLagMs,
      p95QueueLagMs,
      totalSpentTokens,
      avgSpentTokens,
      lastActivityAt,
      providers,
      models,
      configTypes,
    });
  }
  
  return result;
}

/**
 * Определение типа покрытия
 */
function getCoverageType(hasOperation: boolean, hasAi: boolean): CoverageType {
  if (hasOperation && hasAi) return 'both';
  if (hasOperation) return 'operation_only';
  return 'ai_only';
}

/**
 * Построение сводных данных по джобам
 */
export function buildCombinedJobSummary(
  operationJobs: JobLog[],
  aiRecords: AiLogRow[]
): CombinedJobSummary[] {
  // Агрегируем оба источника
  const operationAggregates = aggregateOperationLogByName(operationJobs);
  const aiAggregates = aggregateAiLogByName(aiRecords);
  
  // Получаем все уникальные имена
  const allNames = new Set<string>([
    ...operationAggregates.keys(),
    ...aiAggregates.keys(),
  ]);
  
  const summaries: CombinedJobSummary[] = [];
  
  for (const name of allNames) {
    const opAgg = operationAggregates.get(name);
    const aiAgg = aiAggregates.get(name);
    
    const hasOperation = !!opAgg;
    const hasAi = !!aiAgg;
    const coverageType = getCoverageType(hasOperation, hasAi);
    
    const lastOperationAt = opAgg?.lastActivityAt || null;
    const lastAiAt = aiAgg?.lastActivityAt || null;
    const lastActivityAt = safeMaxDate([lastOperationAt, lastAiAt]);
    
    summaries.push({
      name,
      displayName: getDisplayName(name),
      hasOperation,
      hasAi,
      coverageType,
      lastActivityAt,
      
      // OperationLog метрики
      operationRuns: opAgg?.runs ?? 0,
      operationSuccessCount: opAgg?.successCount ?? 0,
      operationErrorCount: opAgg?.errorCount ?? 0,
      operationSuccessRate: opAgg?.successRate ?? 0,
      operationAvgDurationMs: opAgg?.avgDurationMs ?? 0,
      operationP95DurationMs: opAgg?.p95DurationMs ?? 0,
      lastOperationAt,
      
      // AiLog метрики
      aiRuns: aiAgg?.runs ?? 0,
      aiSuccessCount: aiAgg?.successCount ?? 0,
      aiErrorCount: aiAgg?.errorCount ?? 0,
      aiSuccessRate: aiAgg?.successRate ?? 0,
      aiAvgDurationMs: aiAgg?.avgDurationMs ?? 0,
      aiP95DurationMs: aiAgg?.p95DurationMs ?? 0,
      aiAvgQueueLagMs: aiAgg?.avgQueueLagMs ?? 0,
      aiP95QueueLagMs: aiAgg?.p95QueueLagMs ?? 0,
      aiTotalSpentTokens: aiAgg?.totalSpentTokens ?? 0,
      aiAvgSpentTokens: aiAgg?.avgSpentTokens ?? 0,
      lastAiAt,
      providersUsed: aiAgg?.providers ?? [],
      modelsUsed: aiAgg?.models ?? [],
      configTypesUsed: aiAgg?.configTypes ?? [],
    });
  }
  
  // Сортируем: сначала обе источника, потом по общему количеству запусков
  return summaries.sort((a, b) => {
    // Джобы в обоих источниках первыми
    if (a.coverageType === 'both' && b.coverageType !== 'both') return -1;
    if (b.coverageType === 'both' && a.coverageType !== 'both') return 1;
    
    // Потом по общему количеству запусков
    const aTotal = a.operationRuns + a.aiRuns;
    const bTotal = b.operationRuns + b.aiRuns;
    return bTotal - aTotal;
  });
}

/**
 * Вычисление сводных карточек
 */
export function buildSummaryCards(summaries: CombinedJobSummary[]): CombinedSummaryCards {
  const totalUniqueJobs = summaries.length;
  
  let operationOnlyJobs = 0;
  let aiOnlyJobs = 0;
  let bothSourcesJobs = 0;
  let totalAiTokens = 0;
  let aiJobsCount = 0;
  let aiSuccessRateSum = 0;
  
  for (const s of summaries) {
    switch (s.coverageType) {
      case 'operation_only':
        operationOnlyJobs++;
        break;
      case 'ai_only':
        aiOnlyJobs++;
        break;
      case 'both':
        bothSourcesJobs++;
        break;
    }
    
    totalAiTokens += s.aiTotalSpentTokens;
    
    if (s.hasAi) {
      aiJobsCount++;
      aiSuccessRateSum += s.aiSuccessRate;
    }
  }
  
  return {
    totalUniqueJobs,
    operationOnlyJobs,
    aiOnlyJobs,
    bothSourcesJobs,
    totalAiTokens,
    avgAiSuccessRate: aiJobsCount > 0 ? aiSuccessRateSum / aiJobsCount : 0,
  };
}

/**
 * Фильтрация сводных данных
 */
export function filterCombinedSummaries(
  summaries: CombinedJobSummary[],
  filters: CombinedFilters
): CombinedJobSummary[] {
  return summaries.filter(s => {
    // Поиск по имени
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !s.name.toLowerCase().includes(searchLower) &&
        !s.displayName.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    
    // Фильтр по покрытию
    if (filters.coverageType !== 'all' && s.coverageType !== filters.coverageType) {
      return false;
    }
    
    // Фильтр по провайдеру
    if (filters.provider && !s.providersUsed.includes(filters.provider)) {
      return false;
    }
    
    // Фильтр по модели
    if (filters.modelName && !s.modelsUsed.includes(filters.modelName)) {
      return false;
    }
    
    // Фильтр по ConfigType
    if (filters.configType && !s.configTypesUsed.includes(filters.configType)) {
      return false;
    }
    
    // Только джобы с AI ошибками
    if (filters.onlyWithAiErrors && s.aiErrorCount === 0) {
      return false;
    }
    
    // Только джобы с токенами > 0
    if (filters.onlyWithTokens && s.aiTotalSpentTokens === 0) {
      return false;
    }
    
    return true;
  });
}

/**
 * Сортировка сводных данных
 */
export function sortCombinedSummaries(
  summaries: CombinedJobSummary[],
  sort: CombinedSort
): CombinedJobSummary[] {
  const sorted = [...summaries];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (sort.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'operationRuns':
        comparison = a.operationRuns - b.operationRuns;
        break;
      case 'aiRuns':
        comparison = a.aiRuns - b.aiRuns;
        break;
      case 'operationSuccessRate':
        comparison = a.operationSuccessRate - b.operationSuccessRate;
        break;
      case 'aiSuccessRate':
        comparison = a.aiSuccessRate - b.aiSuccessRate;
        break;
      case 'aiAvgDurationMs':
        comparison = a.aiAvgDurationMs - b.aiAvgDurationMs;
        break;
      case 'aiTotalSpentTokens':
        comparison = a.aiTotalSpentTokens - b.aiTotalSpentTokens;
        break;
      case 'lastActivityAt':
        const aTime = a.lastActivityAt?.getTime() ?? 0;
        const bTime = b.lastActivityAt?.getTime() ?? 0;
        comparison = aTime - bTime;
        break;
    }
    
    return sort.direction === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

/**
 * Получение уникальных значений для фильтров
 */
export function getCombinedUniqueValues(summaries: CombinedJobSummary[]): {
  providers: string[];
  models: string[];
  configTypes: string[];
} {
  const providers = new Set<string>();
  const models = new Set<string>();
  const configTypes = new Set<string>();
  
  for (const s of summaries) {
    s.providersUsed.forEach(p => providers.add(p));
    s.modelsUsed.forEach(m => models.add(m));
    s.configTypesUsed.forEach(c => configTypes.add(c));
  }
  
  return {
    providers: Array.from(providers).sort(),
    models: Array.from(models).sort(),
    configTypes: Array.from(configTypes).sort(),
  };
}
