// Логика агрегации для отчёта по затратам токенов AiLog

import { AiLogRow } from './aiTypes';
import {
  TokenReportSummary,
  TokenReportByJob,
  TokenReportByDay,
  TokenReportFilters,
  TokenReportByJobSort,
  TokenReportByDaySort,
} from './tokenReportTypes';
import { percentile, median } from './aiParser';
import { 
  safeNumber, 
  uniqueNonEmpty, 
  getDisplayName,
} from './combinedAnalytics';
import { JOB_NAMES_RU } from '@/store/jobStore';
import { AI_JOB_NAMES_RU } from '@/store/aiLogStore';

// ==================== HELPER FUNCTIONS ====================

/**
 * Получить ключ даты (YYYY-MM-DD) из Date
 * Для суточной статистики используем StartDate, fallback на CreatedAt
 */
function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Получить дату для группировки (StartDate с fallback на CreatedAt)
 */
function getGroupingDate(record: AiLogRow): Date | null {
  // Приоритет: StartDate, fallback: CreatedAt
  if (record.startDate && !isNaN(record.startDate.getTime())) {
    return record.startDate;
  }
  if (record.createdAt && !isNaN(record.createdAt.getTime())) {
    return record.createdAt;
  }
  return null;
}

/**
 * Безопасное получение display name для джобы
 */
function getJobDisplayName(name: string): string {
  return JOB_NAMES_RU[name] || AI_JOB_NAMES_RU[name] || name;
}

/**
 * Форматирование даты для экспорта
 */
function formatDateForExport(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  return date.toISOString();
}

// ==================== FILTERING ====================

/**
 * Фильтрация записей AiLog
 */
export function filterAiRecords(
  records: AiLogRow[],
  filters: TokenReportFilters
): AiLogRow[] {
  return records.filter(record => {
    // Фильтр по периоду (используем StartDate для группировки)
    const groupDate = getGroupingDate(record);
    if (filters.periodStart && groupDate) {
      const recordDate = getDateKey(groupDate);
      if (recordDate < filters.periodStart) return false;
    }
    if (filters.periodEnd && groupDate) {
      const recordDate = getDateKey(groupDate);
      if (recordDate > filters.periodEnd) return false;
    }
    
    // Фильтр по имени джобы
    if (filters.name && record.name !== filters.name) return false;
    
    // Фильтр по провайдеру
    if (filters.provider && record.provider !== filters.provider) return false;
    
    // Фильтр по модели
    if (filters.modelName && record.modelName !== filters.modelName) return false;
    
    // Фильтр по ConfigType
    if (filters.configType && record.configType !== filters.configType) return false;
    
    // Только записи с токенами > 0
    if (filters.onlyWithTokens && record.spentTokens <= 0) return false;
    
    return true;
  });
}

// ==================== SUMMARY AGGREGATION ====================

/**
 * Построение сводных метрик отчёта
 */
export function buildTokenReportSummary(
  records: AiLogRow[],
  byJobs: TokenReportByJob[]
): TokenReportSummary {
  const totalRecords = records.length;
  const uniqueJobs = byJobs.length;
  
  // Суммарные токены
  const totalSpentTokens = records.reduce((sum, r) => sum + safeNumber(r.spentTokens), 0);
  
  // Среднее на запись
  const avgTokensPerRecord = totalRecords > 0 ? totalSpentTokens / totalRecords : 0;
  
  // Группировка по дням для расчёта среднесуточного и максимума
  const dayGroups = new Map<string, number>();
  for (const record of records) {
    const groupDate = getGroupingDate(record);
    if (groupDate) {
      const dateKey = getDateKey(groupDate);
      const current = dayGroups.get(dateKey) || 0;
      dayGroups.set(dateKey, current + safeNumber(record.spentTokens));
    }
  }
  
  const dayTokens = Array.from(dayGroups.values());
  const avgTokensPerDay = dayTokens.length > 0 
    ? dayTokens.reduce((a, b) => a + b, 0) / dayTokens.length 
    : 0;
  const maxTokensPerDay = dayTokens.length > 0 ? Math.max(...dayTokens) : 0;
  
  // Топ джоба по токенам
  let topJobByTokens: string | null = null;
  let topJobTokens = 0;
  if (byJobs.length > 0) {
    const sorted = [...byJobs].sort((a, b) => b.totalSpentTokens - a.totalSpentTokens);
    topJobByTokens = sorted[0].name;
    topJobTokens = sorted[0].totalSpentTokens;
  }
  
  // Топ модель по токенам
  const modelGroups = new Map<string, number>();
  for (const record of records) {
    if (record.modelName && record.modelName.trim()) {
      const current = modelGroups.get(record.modelName) || 0;
      modelGroups.set(record.modelName, current + safeNumber(record.spentTokens));
    }
  }
  
  let topModelByTokens: string | null = null;
  let topModelTokens = 0;
  if (modelGroups.size > 0) {
    const sorted = Array.from(modelGroups.entries()).sort((a, b) => b[1] - a[1]);
    topModelByTokens = sorted[0][0];
    topModelTokens = sorted[0][1];
  }
  
  return {
    totalRecords,
    uniqueJobs,
    totalSpentTokens,
    avgTokensPerRecord,
    avgTokensPerDay,
    maxTokensPerDay,
    topJobByTokens,
    topJobTokens,
    topModelByTokens,
    topModelTokens,
  };
}

// ==================== BY JOBS AGGREGATION ====================

/**
 * Построение отчёта по джобам
 */
export function buildTokenReportByJobs(records: AiLogRow[]): TokenReportByJob[] {
  // Сначала вычисляем totalTokensAll
  const totalTokensAll = records.reduce((sum, r) => sum + safeNumber(r.spentTokens), 0);
  
  // Группируем по имени джобы
  const groups = new Map<string, AiLogRow[]>();
  for (const record of records) {
    const existing = groups.get(record.name) || [];
    existing.push(record);
    groups.set(record.name, existing);
  }
  
  const result: TokenReportByJob[] = [];
  
  for (const [name, groupRecords] of groups) {
    const runsCount = groupRecords.length;
    const successCount = groupRecords.filter(r => r.isSuccess).length;
    const errorCount = groupRecords.filter(r => r.isError).length;
    const successRate = runsCount > 0 ? (successCount / runsCount) * 100 : 0;
    
    // Токены
    const tokens = groupRecords.map(r => safeNumber(r.spentTokens));
    const totalSpentTokens = tokens.reduce((a, b) => a + b, 0);
    const avgSpentTokens = runsCount > 0 ? totalSpentTokens / runsCount : 0;
    const medianSpentTokens = median(tokens);
    const maxSpentTokens = tokens.length > 0 ? Math.max(...tokens) : 0;
    
    // Доля токенов (безопасное деление)
    const tokenShare = totalTokensAll > 0 ? totalSpentTokens / totalTokensAll : 0;
    
    // Последняя активность
    const dates = groupRecords
      .map(r => getGroupingDate(r))
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
    const lastActivityAt = dates.length > 0 
      ? new Date(Math.max(...dates.map(d => d.getTime())))
      : null;
    
    // Уникальные значения
    const providersUsed = uniqueNonEmpty(groupRecords.map(r => r.provider));
    const modelsUsed = uniqueNonEmpty(groupRecords.map(r => r.modelName));
    const configTypesUsed = uniqueNonEmpty(groupRecords.map(r => r.configType));
    
    result.push({
      name,
      displayName: getJobDisplayName(name),
      runsCount,
      successCount,
      errorCount,
      successRate,
      totalSpentTokens,
      tokenShare,
      avgSpentTokens,
      medianSpentTokens,
      maxSpentTokens,
      lastActivityAt,
      providersUsed,
      modelsUsed,
      configTypesUsed,
    });
  }
  
  // Сортируем по суммарным токенам
  return result.sort((a, b) => b.totalSpentTokens - a.totalSpentTokens);
}

/**
 * Сортировка отчёта по джобам
 */
export function sortTokenReportByJobs(
  jobs: TokenReportByJob[],
  sort: TokenReportByJobSort
): TokenReportByJob[] {
  const sorted = [...jobs];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (sort.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'runsCount':
        comparison = a.runsCount - b.runsCount;
        break;
      case 'totalSpentTokens':
        comparison = a.totalSpentTokens - b.totalSpentTokens;
        break;
      case 'tokenShare':
        comparison = a.tokenShare - b.tokenShare;
        break;
      case 'avgSpentTokens':
        comparison = a.avgSpentTokens - b.avgSpentTokens;
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

// ==================== BY DAYS AGGREGATION ====================

/**
 * Построение отчёта по суткам
 */
export function buildTokenReportByDays(records: AiLogRow[]): TokenReportByDay[] {
  // Группируем по дням (используем StartDate с fallback на CreatedAt)
  const groups = new Map<string, AiLogRow[]>();
  
  for (const record of records) {
    const groupDate = getGroupingDate(record);
    if (groupDate) {
      const dateKey = getDateKey(groupDate);
      const existing = groups.get(dateKey) || [];
      existing.push(record);
      groups.set(dateKey, existing);
    }
  }
  
  const result: TokenReportByDay[] = [];
  
  for (const [date, dayRecords] of groups) {
    const runsCount = dayRecords.length;
    
    // Токены
    const tokens = dayRecords.map(r => safeNumber(r.spentTokens));
    const totalSpentTokens = tokens.reduce((a, b) => a + b, 0);
    const avgSpentTokens = runsCount > 0 ? totalSpentTokens / runsCount : 0;
    
    // Уникальные джобы
    const uniqueJobs = new Set(dayRecords.map(r => r.name));
    const uniqueJobsCount = uniqueJobs.size;
    
    // Топ джоба дня по токенам
    const jobTokens = new Map<string, number>();
    for (const r of dayRecords) {
      const current = jobTokens.get(r.name) || 0;
      jobTokens.set(r.name, current + safeNumber(r.spentTokens));
    }
    
    let topJobName: string | null = null;
    let topJobTokens = 0;
    if (jobTokens.size > 0) {
      const sorted = Array.from(jobTokens.entries()).sort((a, b) => b[1] - a[1]);
      topJobName = sorted[0][0];
      topJobTokens = sorted[0][1];
    }
    
    result.push({
      date,
      runsCount,
      totalSpentTokens,
      avgSpentTokens,
      uniqueJobsCount,
      topJobName,
      topJobTokens,
    });
  }
  
  // Сортируем по дате
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Сортировка отчёта по суткам
 */
export function sortTokenReportByDays(
  days: TokenReportByDay[],
  sort: TokenReportByDaySort
): TokenReportByDay[] {
  const sorted = [...days];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (sort.field) {
      case 'date':
        comparison = a.date.localeCompare(b.date);
        break;
      case 'runsCount':
        comparison = a.runsCount - b.runsCount;
        break;
      case 'totalSpentTokens':
        comparison = a.totalSpentTokens - b.totalSpentTokens;
        break;
      case 'uniqueJobsCount':
        comparison = a.uniqueJobsCount - b.uniqueJobsCount;
        break;
    }
    
    return sort.direction === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

// ==================== UNIQUE VALUES ====================

/**
 * Получение уникальных значений для фильтров
 */
export function getTokenReportUniqueValues(records: AiLogRow[]): {
  names: string[];
  providers: string[];
  models: string[];
  configTypes: string[];
} {
  return {
    names: uniqueNonEmpty(records.map(r => r.name)),
    providers: uniqueNonEmpty(records.map(r => r.provider)),
    models: uniqueNonEmpty(records.map(r => r.modelName)),
    configTypes: uniqueNonEmpty(records.map(r => r.configType)),
  };
}

// ==================== CSV EXPORT ====================

/**
 * Форматирование числа с запятой как разделителем дробной части (для Excel)
 */
function formatNumberForCsv(value: number, decimals = 0): string {
  return value.toFixed(decimals).replace('.', ',');
}

/**
 * Генерация CSV для отчёта по джобам
 */
export function generateCsvByJobs(jobs: TokenReportByJob[]): string {
  const headers = [
    'Джоба',
    'Запусков',
    'Успешных',
    'Ошибочных',
    'Success Rate (%)',
    'Токены всего',
    'Доля от общего (%)',
    'Токены среднее',
    'Токены медиана',
    'Токены максимум',
    'Последняя активность',
    'Провайдеры',
    'Модели',
    'ConfigType',
  ];
  
  const rows = jobs.map(job => [
    job.name,
    job.runsCount.toString(),
    job.successCount.toString(),
    job.errorCount.toString(),
    formatNumberForCsv(job.successRate, 2),
    job.totalSpentTokens.toString(),
    formatNumberForCsv(job.tokenShare * 100, 2) + '%',
    formatNumberForCsv(job.avgSpentTokens, 2),
    formatNumberForCsv(job.medianSpentTokens, 2),
    job.maxSpentTokens.toString(),
    job.lastActivityAt ? formatDateForExport(job.lastActivityAt) : '',
    job.providersUsed.join(', '),
    job.modelsUsed.join(', '),
    job.configTypesUsed.join(', '),
  ]);
  
  return [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
  ].join('\n');
}

/**
 * Генерация CSV для отчёта по суткам
 */
export function generateCsvByDays(days: TokenReportByDay[]): string {
  const headers = [
    'Дата',
    'AI-записей',
    'Токены всего',
    'Токены среднее',
    'Уникальных джоб',
    'Топ джоба дня',
    'Токены топ-джобы',
  ];
  
  const rows = days.map(day => [
    day.date,
    day.runsCount.toString(),
    day.totalSpentTokens.toString(),
    formatNumberForCsv(day.avgSpentTokens, 2),
    day.uniqueJobsCount.toString(),
    day.topJobName || '',
    day.topJobTokens.toString(),
  ]);
  
  return [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
  ].join('\n');
}

/**
 * Скачивание CSV файла
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Получить имя файла с датой
 */
export function getExportFilename(prefix: string): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return `${prefix}-${dateStr}.csv`;
}
