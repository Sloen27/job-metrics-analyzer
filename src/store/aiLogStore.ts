// Хранилище состояния для AI логов

import { create } from 'zustand';
import {
  AiLogRow,
  AiLogStatistics,
  AiLogByJobStats,
  AiLogByProviderStats,
  AiLogFilters,
  AiLogDailyStats,
  ErrorSummary,
} from '@/lib/aiTypes';
import { parseAiLogFile, percentile, median } from '@/lib/aiParser';

// Русские названия джоб (дублируем из jobStore для независимости)
export const AI_JOB_NAMES_RU: Record<string, string> = {
  'ClusterizationJob': 'Кластеризация',
  'ClusterCommentTrendProcessingJob': 'Комментарийный тренд инфоповода',
  'TelegramPostOpenSearchIndexationJob': 'OpenSearch',
  'PostTagProcessingJob': 'Тегирование',
  'ClusterMultipleCommentEmotionalAnalysisProcessingJob': 'Тональность инфоповода',
  'PostEmotionalAnalysisProcessingJob': 'Тональность поста',
  'TelegramProcessingJob': 'Сбор данных',
  'TelegramPostCommentTrendProcessingJob': 'Комментарийный тренд поста',
  'PostMultipleCommentEmotionalAnalysisProcessingJob': 'Тональность комментариев к посту',
};

interface AiLogStore {
  // Данные
  records: AiLogRow[];
  fileName: string | null;
  rejectedCount: number;
  
  // Состояние
  isLoading: boolean;
  error: string | null;
  
  // Фильтры
  filters: AiLogFilters;
  
  // Действия
  loadFile: (content: string, fileName: string) => void;
  setFilters: (filters: Partial<AiLogFilters>) => void;
  resetFilters: () => void;
  clearData: () => void;
  
  // Вычисляемые данные
  getFilteredRecords: () => AiLogRow[];
  getStatistics: () => AiLogStatistics | null;
  getByJobStats: () => AiLogByJobStats[];
  getByProviderStats: () => AiLogByProviderStats[];
  getDailyStats: () => AiLogDailyStats[];
  getErrorSummaries: () => ErrorSummary[];
  getUniqueValues: () => {
    names: string[];
    providers: string[];
    modelNames: string[];
    configTypes: string[];
  };
}

// Начальные значения фильтров
const defaultFilters: AiLogFilters = {
  periodStart: null,
  periodEnd: null,
  name: null,
  provider: null,
  modelName: null,
  configType: null,
  status: 'all',
  onlyErrors: false,
  tokensAboveZero: false,
};

/**
 * Получить ключ даты (YYYY-MM-DD) в локальном времени
 */
function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useAiLogStore = create<AiLogStore>((set, get) => ({
  records: [],
  fileName: null,
  rejectedCount: 0,
  isLoading: false,
  error: null,
  filters: { ...defaultFilters },
  
  loadFile: (content: string, fileName: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const result = parseAiLogFile(content);
      
      if (result.errors.length > 0 && result.records.length === 0) {
        set({
          error: result.errors.join('\n'),
          isLoading: false,
        });
        return;
      }
      
      set({
        records: result.records,
        fileName,
        rejectedCount: result.errorCount,
        isLoading: false,
        filters: { ...defaultFilters },
        error: null,
      });
    } catch (error) {
      set({
        error: `Ошибка при обработке файла: ${error}`,
        isLoading: false,
      });
    }
  },
  
  setFilters: (newFilters: Partial<AiLogFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },
  
  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
  },
  
  clearData: () => {
    set({
      records: [],
      fileName: null,
      rejectedCount: 0,
      error: null,
      filters: { ...defaultFilters },
    });
  },
  
  getFilteredRecords: () => {
    const { records, filters } = get();
    
    return records.filter(record => {
      // Фильтр по периоду
      if (filters.periodStart) {
        const recordDate = getDateKey(record.startDate);
        if (recordDate < filters.periodStart) return false;
      }
      if (filters.periodEnd) {
        const recordDate = getDateKey(record.startDate);
        if (recordDate > filters.periodEnd) return false;
      }
      
      // Фильтр по имени джобы
      if (filters.name && record.name !== filters.name) return false;
      
      // Фильтр по провайдеру
      if (filters.provider && record.provider !== filters.provider) return false;
      
      // Фильтр по модели
      if (filters.modelName && record.modelName !== filters.modelName) return false;
      
      // Фильтр по типу конфигурации
      if (filters.configType && record.configType !== filters.configType) return false;
      
      // Фильтр по статусу
      if (filters.status === 'success' && !record.isSuccess) return false;
      if (filters.status === 'error' && !record.isError) return false;
      
      // Фильтр только ошибки
      if (filters.onlyErrors && !record.isError) return false;
      
      // Фильтр токенов > 0
      if (filters.tokensAboveZero && record.spentTokens <= 0) return false;
      
      return true;
    });
  },
  
  getStatistics: () => {
    const records = get().getFilteredRecords();
    if (records.length === 0) return null;
    
    const totalRecords = records.length;
    const successCount = records.filter(r => r.isSuccess).length;
    const errorCount = records.filter(r => r.isError).length;
    const successRate = totalRecords > 0 ? (successCount / totalRecords) * 100 : 0;
    const errorRate = totalRecords > 0 ? (errorCount / totalRecords) * 100 : 0;
    
    const spentTokens = records.map(r => r.spentTokens);
    const totalSpentTokens = spentTokens.reduce((a, b) => a + b, 0);
    const avgSpentTokens = totalSpentTokens / totalRecords;
    const medianSpentTokens = median(spentTokens);
    
    const durations = records.map(r => r.durationMs);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / totalRecords;
    const p50Duration = percentile(durations, 50);
    const p95Duration = percentile(durations, 95);
    
    const queueLags = records.map(r => r.queueLagMs);
    const avgQueueLag = queueLags.reduce((a, b) => a + b, 0) / totalRecords;
    const p50QueueLag = percentile(queueLags, 50);
    const p95QueueLag = percentile(queueLags, 95);
    
    return {
      totalRecords,
      successCount,
      errorCount,
      successRate,
      errorRate,
      totalSpentTokens,
      avgSpentTokens,
      medianSpentTokens,
      avgDuration,
      p50Duration,
      p95Duration,
      avgQueueLag,
      p50QueueLag,
      p95QueueLag,
    };
  },
  
  getByJobStats: () => {
    const records = get().getFilteredRecords();
    
    // Группируем по имени джобы
    const groups = new Map<string, AiLogRow[]>();
    for (const record of records) {
      const existing = groups.get(record.name) || [];
      existing.push(record);
      groups.set(record.name, existing);
    }
    
    const stats: AiLogByJobStats[] = [];
    
    for (const [name, groupRecords] of groups) {
      const totalRuns = groupRecords.length;
      const successCount = groupRecords.filter(r => r.isSuccess).length;
      const errorCount = groupRecords.filter(r => r.isError).length;
      const successRate = totalRuns > 0 ? (successCount / totalRuns) * 100 : 0;
      
      const durations = groupRecords.map(r => r.durationMs);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / totalRuns;
      const p95Duration = percentile(durations, 95);
      
      const spentTokens = groupRecords.map(r => r.spentTokens);
      const totalSpentTokens = spentTokens.reduce((a, b) => a + b, 0);
      const avgSpentTokens = totalSpentTokens / totalRuns;
      
      stats.push({
        name,
        totalRuns,
        successCount,
        errorCount,
        successRate,
        avgDuration,
        p95Duration,
        totalSpentTokens,
        avgSpentTokens,
      });
    }
    
    // Сортируем по количеству запусков
    return stats.sort((a, b) => b.totalRuns - a.totalRuns);
  },
  
  getByProviderStats: () => {
    const records = get().getFilteredRecords();
    
    // Группируем по провайдеру + модели
    const groups = new Map<string, AiLogRow[]>();
    for (const record of records) {
      const key = `${record.provider || 'Unknown'}|${record.modelName || 'Unknown'}`;
      const existing = groups.get(key) || [];
      existing.push(record);
      groups.set(key, existing);
    }
    
    const stats: AiLogByProviderStats[] = [];
    
    for (const [key, groupRecords] of groups) {
      const [provider, modelName] = key.split('|');
      const runs = groupRecords.length;
      const successCount = groupRecords.filter(r => r.isSuccess).length;
      const successRate = runs > 0 ? (successCount / runs) * 100 : 0;
      
      const durations = groupRecords.map(r => r.durationMs);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / runs;
      
      const totalSpentTokens = groupRecords.reduce((a, r) => a + r.spentTokens, 0);
      
      stats.push({
        provider,
        modelName,
        runs,
        successRate,
        avgDuration,
        totalSpentTokens,
      });
    }
    
    // Сортируем по количеству запусков
    return stats.sort((a, b) => b.runs - a.runs);
  },
  
  getDailyStats: () => {
    const records = get().getFilteredRecords();
    
    // Группируем по дням
    const groups = new Map<string, AiLogRow[]>();
    for (const record of records) {
      const dateKey = getDateKey(record.startDate);
      const existing = groups.get(dateKey) || [];
      existing.push(record);
      groups.set(dateKey, existing);
    }
    
    const stats: AiLogDailyStats[] = [];
    
    for (const [date, dayRecords] of groups) {
      const totalRuns = dayRecords.length;
      const successCount = dayRecords.filter(r => r.isSuccess).length;
      const errorCount = dayRecords.filter(r => r.isError).length;
      const totalSpentTokens = dayRecords.reduce((a, r) => a + r.spentTokens, 0);
      const avgDuration = dayRecords.reduce((a, r) => a + r.durationMs, 0) / totalRuns;
      
      stats.push({
        date,
        totalRuns,
        successCount,
        errorCount,
        totalSpentTokens,
        avgDuration,
      });
    }
    
    // Сортируем по дате
    return stats.sort((a, b) => a.date.localeCompare(b.date));
  },
  
  getErrorSummaries: () => {
    const records = get().getFilteredRecords().filter(r => r.isError && r.error);
    
    // Группируем по тексту ошибки
    const groups = new Map<string, { count: number; lastOccurrence: Date; jobNames: Set<string> }>();
    
    for (const record of records) {
      const errorText = record.error || 'Неизвестная ошибка';
      const existing = groups.get(errorText);
      
      if (existing) {
        existing.count++;
        if (record.startDate > existing.lastOccurrence) {
          existing.lastOccurrence = record.startDate;
        }
        existing.jobNames.add(record.name);
      } else {
        groups.set(errorText, {
          count: 1,
          lastOccurrence: record.startDate,
          jobNames: new Set([record.name]),
        });
      }
    }
    
    const summaries: ErrorSummary[] = [];
    
    for (const [error, data] of groups) {
      summaries.push({
        error,
        count: data.count,
        lastOccurrence: data.lastOccurrence,
        jobNames: Array.from(data.jobNames),
      });
    }
    
    // Сортируем по количеству
    return summaries.sort((a, b) => b.count - a.count);
  },
  
  getUniqueValues: () => {
    const { records } = get();
    
    const names = [...new Set(records.map(r => r.name))].sort();
    const providers = [...new Set(records.map(r => r.provider).filter(Boolean))].sort();
    const modelNames = [...new Set(records.map(r => r.modelName).filter(Boolean))].sort();
    const configTypes = [...new Set(records.map(r => r.configType).filter(Boolean))].sort();
    
    return { names, providers, modelNames, configTypes };
  },
}));
