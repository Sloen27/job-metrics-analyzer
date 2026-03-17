// Хранилище состояния приложения для анализа метрик джоб

import { create } from 'zustand';
import { 
  JobLog, 
  JobDailyStatistics, 
  DailyMetrics, 
  AggregatedJobMetrics,
  MetricComparison,
  MetricDefinition,
  ComparisonInterval,
  IntervalDefinition
} from '@/lib/types';
import { parseCsvFile } from '@/lib/parser';

// Цвета для графиков
const JOB_COLORS: Record<string, string> = {
  'TelegramProcessingJob': '#10b981',
  'PostTagProcessingJob': '#f59e0b',
  'PostEmotionalAnalysisProcessingJob': '#ec4899',
  'TelegramPostOpenSearchIndexationJob': '#6366f1',
  'ClusterizationJob': '#8b5cf6',
  'ClusterMultipleCommentEmotionalAnalysisProcessingJob': '#14b8a6',
  'ClusterCommentTrendProcessingJob': '#f97316',
  'PostMultipleCommentEmotionalAnalysisProcessingJob': '#06b6d4',
  'TelegramPostCommentTrendProcessingJob': '#84cc16',
};

// Русские названия джоб
export const JOB_NAMES_RU: Record<string, string> = {
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

// Определения интервалов сравнения
export const INTERVAL_DEFINITIONS: IntervalDefinition[] = [
  { key: 'today_vs_yesterday', label: 'Сегодня / Вчера', description: 'Сравнение сегодня с вчерашним днём' },
  { key: 'yesterday_vs_day_before', label: 'Вчера / Позавчера', description: 'Сравнение вчерашнего дня с позавчерашним' },
  { key: 'custom', label: 'Свой интервал', description: 'Выберите две даты для сравнения' },
];

// Определения метрик
export const METRIC_DEFINITIONS: MetricDefinition[] = [
  { key: 'runCount', label: 'Запусков', unit: '', format: 'number', higherIsBetter: true },
  { key: 'successCount', label: 'Успешных', unit: '', format: 'number', higherIsBetter: true },
  { key: 'avgDuration', label: 'Средняя длительность', unit: '', format: 'duration', higherIsBetter: false },
  { key: 'totalProcessedPosts', label: 'Обработано постов', unit: '', format: 'number', higherIsBetter: true },
  { key: 'totalTaggedPosts', label: 'Протегировано постов', unit: '', format: 'number', higherIsBetter: true },
  { key: 'avgLlmTime', label: 'Среднее время LLM', unit: 'мс', format: 'number', higherIsBetter: false },
  { key: 'totalLlmRequests', label: 'LLM запросов', unit: '', format: 'number', higherIsBetter: true },
  { key: 'totalProcessedInfoEvents', label: 'Обработано инфоповодов', unit: '', format: 'number', higherIsBetter: true },
  { key: 'avgComments', label: 'Среднее кол-во комментариев', unit: '', format: 'decimal', higherIsBetter: true },
  { key: 'totalNewPosts', label: 'Новых постов', unit: '', format: 'number', higherIsBetter: true },
  { key: 'avgActiveSources', label: 'Активных источников', unit: '', format: 'number', higherIsBetter: true },
  { key: 'avgSuccessRate', label: 'Успешность обработки', unit: '%', format: 'percent', higherIsBetter: true },
  { key: 'avgShortPostsPercent', label: 'Доля коротких постов', unit: '%', format: 'percent', higherIsBetter: false },
];

interface JobStore {
  // Данные
  jobs: JobLog[];
  jobNames: string[];
  selectedJob: string | null;
  selectedInterval: ComparisonInterval;
  customDate1: string | null;  // Первая дата для кастомного сравнения
  customDate2: string | null;  // Вторая дата для кастомного сравнения
  onlySuccessful: boolean;     // Фильтр только успешные
  jobStatistics: JobDailyStatistics | null;
  isLoading: boolean;
  error: string | null;
  
  // Действия
  loadFile: (content: string) => void;
  selectJob: (jobName: string | null) => void;
  selectInterval: (interval: ComparisonInterval) => void;
  setCustomDates: (date1: string, date2: string) => void;
  toggleSuccessfulOnly: () => void;
  clearData: () => void;
}

/**
 * Получить ключ даты (YYYY-MM-DD) в локальном времени
 */
function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Получить даты для сравнения
 */
function getComparisonDates(interval: ComparisonInterval, customDate1?: string | null, customDate2?: string | null): { date1: string; date2: string } | null {
  const now = new Date();
  const today = getDateKey(now);
  const yesterday = getDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const dayBefore = getDateKey(new Date(now.getTime() - 48 * 60 * 60 * 1000));
  
  switch (interval) {
    case 'today_vs_yesterday':
      return { date1: today, date2: yesterday };
    case 'yesterday_vs_day_before':
      return { date1: yesterday, date2: dayBefore };
    case 'custom':
      if (customDate1 && customDate2) {
        return { date1: customDate1, date2: customDate2 };
      }
      return null;
    default:
      return { date1: today, date2: yesterday };
  }
}

/**
 * Агрегировать метрики для списка запусков за день
 */
function aggregateDailyMetrics(dayJobs: JobLog[]): AggregatedJobMetrics {
  const metrics: AggregatedJobMetrics = {};
  
  // Обработанные посты
  const processedPosts = dayJobs.filter(j => j.metrics.processedPosts !== undefined);
  if (processedPosts.length > 0) {
    metrics.totalProcessedPosts = processedPosts.reduce((sum, j) => sum + (j.metrics.processedPosts || 0), 0);
    metrics.avgProcessedPosts = metrics.totalProcessedPosts / processedPosts.length;
  }
  
  // Протегированные посты
  const taggedPosts = dayJobs.filter(j => j.metrics.taggedPosts !== undefined);
  if (taggedPosts.length > 0) {
    metrics.totalTaggedPosts = taggedPosts.reduce((sum, j) => sum + (j.metrics.taggedPosts || 0), 0);
  }
  
  // LLM метрики
  const llmTime = dayJobs.filter(j => j.metrics.avgLlmTime !== undefined);
  if (llmTime.length > 0) {
    const times = llmTime.map(j => j.metrics.avgLlmTime || 0);
    metrics.avgLlmTime = times.reduce((a, b) => a + b, 0) / times.length;
    metrics.minLlmTime = Math.min(...times);
    metrics.maxLlmTime = Math.max(...times);
  }
  
  const llmRequests = dayJobs.filter(j => j.metrics.llmRequestsCount !== undefined);
  if (llmRequests.length > 0) {
    metrics.totalLlmRequests = llmRequests.reduce((sum, j) => sum + (j.metrics.llmRequestsCount || 0), 0);
    metrics.avgLlmRequests = metrics.totalLlmRequests / llmRequests.length;
  }
  
  const totalLlmTime = dayJobs.filter(j => j.metrics.totalLlmTime !== undefined);
  if (totalLlmTime.length > 0) {
    metrics.totalLlmTime = totalLlmTime.reduce((sum, j) => sum + (j.metrics.totalLlmTime || 0), 0);
  }
  
  // Инфоповоды
  const infoEvents = dayJobs.filter(j => j.metrics.processedInfoEvents !== undefined);
  if (infoEvents.length > 0) {
    metrics.totalProcessedInfoEvents = infoEvents.reduce((sum, j) => sum + (j.metrics.processedInfoEvents || 0), 0);
  }
  
  // Комментарии
  const comments = dayJobs.filter(j => j.metrics.avgComments !== undefined);
  if (comments.length > 0) {
    metrics.avgComments = comments.reduce((sum, j) => sum + (j.metrics.avgComments || 0), 0) / comments.length;
  }
  
  const totalComments = dayJobs.filter(j => j.metrics.totalComments !== undefined);
  if (totalComments.length > 0) {
    metrics.totalComments = totalComments.reduce((sum, j) => sum + (j.metrics.totalComments || 0), 0);
  }
  
  // Telegram метрики
  const newPosts = dayJobs.filter(j => j.metrics.newPosts !== undefined);
  if (newPosts.length > 0) {
    metrics.totalNewPosts = newPosts.reduce((sum, j) => sum + (j.metrics.newPosts || 0), 0);
  }
  
  const activeSources = dayJobs.filter(j => j.metrics.activeSources !== undefined);
  if (activeSources.length > 0) {
    metrics.avgActiveSources = activeSources.reduce((sum, j) => sum + (j.metrics.activeSources || 0), 0) / activeSources.length;
  }
  
  const processedSources = dayJobs.filter(j => j.metrics.processedSources !== undefined);
  if (processedSources.length > 0) {
    metrics.avgProcessedSources = processedSources.reduce((sum, j) => sum + (j.metrics.processedSources || 0), 0) / processedSources.length;
  }
  
  // Проценты
  const successRates = dayJobs.filter(j => j.metrics.successRate !== undefined);
  if (successRates.length > 0) {
    metrics.avgSuccessRate = successRates.reduce((sum, j) => sum + (j.metrics.successRate || 0), 0) / successRates.length;
  }
  
  const taggedPercents = dayJobs.filter(j => j.metrics.taggedPercent !== undefined);
  if (taggedPercents.length > 0) {
    metrics.avgTaggedPercent = taggedPercents.reduce((sum, j) => sum + (j.metrics.taggedPercent || 0), 0) / taggedPercents.length;
  }
  
  const shortPosts = dayJobs.filter(j => j.metrics.shortPostsPercent !== undefined);
  if (shortPosts.length > 0) {
    metrics.avgShortPostsPercent = shortPosts.reduce((sum, j) => sum + (j.metrics.shortPostsPercent || 0), 0) / shortPosts.length;
  }
  
  const shortTrends = dayJobs.filter(j => j.metrics.shortTrendsPercent !== undefined);
  if (shortTrends.length > 0) {
    metrics.avgShortTrendsPercent = shortTrends.reduce((sum, j) => sum + (j.metrics.shortTrendsPercent || 0), 0) / shortTrends.length;
  }
  
  return metrics;
}

/**
 * Создать дневные метрики для группы запусков
 */
function createDailyMetrics(date: string, dayJobs: JobLog[]): DailyMetrics {
  const durations = dayJobs.map(j => j.duration);
  const successCount = dayJobs.filter(j => j.status === 1).length;
  const errorCount = dayJobs.filter(j => j.status === 3).length;
  
  return {
    date,
    runCount: dayJobs.length,
    successCount,
    errorCount,
    avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    minDuration: durations.length > 0 ? Math.min(...durations) : 0,
    maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
    totalDuration: durations.reduce((a, b) => a + b, 0),
    metrics: aggregateDailyMetrics(dayJobs),
  };
}

/**
 * Получить список доступных метрик для джобы
 */
function getAvailableMetrics(dailyMetrics: DailyMetrics[]): string[] {
  const available = new Set<string>();
  
  // Всегда добавляем базовые метрики
  available.add('runCount');
  available.add('successCount');
  available.add('avgDuration');
  
  // Проверяем какие метрики есть в данных
  for (const day of dailyMetrics) {
    if (day.metrics.totalProcessedPosts) available.add('totalProcessedPosts');
    if (day.metrics.totalTaggedPosts) available.add('totalTaggedPosts');
    if (day.metrics.avgLlmTime) available.add('avgLlmTime');
    if (day.metrics.totalLlmRequests) available.add('totalLlmRequests');
    if (day.metrics.totalProcessedInfoEvents) available.add('totalProcessedInfoEvents');
    if (day.metrics.avgComments) available.add('avgComments');
    if (day.metrics.totalNewPosts) available.add('totalNewPosts');
    if (day.metrics.avgActiveSources) available.add('avgActiveSources');
    if (day.metrics.avgSuccessRate) available.add('avgSuccessRate');
    if (day.metrics.avgShortPostsPercent) available.add('avgShortPostsPercent');
  }
  
  return Array.from(available);
}

/**
 * Получить значение метрики из DailyMetrics
 */
function getMetricValue(day: DailyMetrics, metricKey: string): number {
  // Базовые метрики
  if (metricKey === 'runCount') return day.runCount;
  if (metricKey === 'successCount') return day.successCount;
  if (metricKey === 'avgDuration') return day.avgDuration;
  
  // Метрики из объекта metrics
  const metrics = day.metrics as Record<string, number | undefined>;
  return metrics[metricKey] || 0;
}

/**
 * Рассчитать сравнение метрик между двумя датами
 */
function calculateComparisons(
  dailyMetrics: DailyMetrics[],
  date1: string,
  date2: string
): Record<string, MetricComparison> {
  const comparisons: Record<string, MetricComparison> = {};
  
  const day1 = dailyMetrics.find(d => d.date === date1);
  const day2 = dailyMetrics.find(d => d.date === date2);
  
  if (!day1 || !day2) return comparisons;
  
  const availableMetrics = getAvailableMetrics([day1, day2]);
  
  for (const metricKey of availableMetrics) {
    const currentValue = getMetricValue(day1, metricKey);
    const previousValue = getMetricValue(day2, metricKey);
    
    // Изменения
    const change = currentValue - previousValue;
    const changePercent = previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0;
    
    // Определение тренда (порог 5%)
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) {
      trend = changePercent > 0 ? 'up' : 'down';
    }
    
    comparisons[metricKey] = {
      current: currentValue,
      previous: previousValue,
      change,
      changePercent,
      average: previousValue,
      vsAverage: changePercent,
      trend,
    };
  }
  
  return comparisons;
}

/**
 * Вычислить статистику по джобе с разбивкой по дням
 */
function calculateJobStatistics(
  jobs: JobLog[],
  jobName: string,
  interval: ComparisonInterval,
  customDate1: string | null,
  customDate2: string | null,
  onlySuccessful: boolean
): JobDailyStatistics | null {
  // Фильтруем по джобе
  let jobJobs = jobs.filter(j => j.name === jobName);
  
  // Фильтр только успешные
  if (onlySuccessful) {
    jobJobs = jobJobs.filter(j => j.status === 1);
  }
  
  if (jobJobs.length === 0) return null;
  
  // Группируем по дням
  const dailyGroups = new Map<string, JobLog[]>();
  
  for (const job of jobJobs) {
    const dateKey = getDateKey(job.startDate);
    const existing = dailyGroups.get(dateKey) || [];
    existing.push(job);
    dailyGroups.set(dateKey, existing);
  }
  
  // Создаем дневные метрики
  const dailyMetrics: DailyMetrics[] = [];
  const sortedDates = Array.from(dailyGroups.keys()).sort();
  
  for (const date of sortedDates) {
    const dayJobs = dailyGroups.get(date)!;
    dailyMetrics.push(createDailyMetrics(date, dayJobs));
  }
  
  // Определяем диапазон дат
  const dateRange = {
    start: sortedDates[0] || '',
    end: sortedDates[sortedDates.length - 1] || '',
  };
  
  // Получаем доступные метрики
  const availableMetrics = getAvailableMetrics(dailyMetrics);
  
  // Получаем даты для сравнения
  const comparisonDates = getComparisonDates(interval, customDate1, customDate2);
  
  // Рассчитываем сравнения
  let latestDayComparisons: Record<string, MetricComparison> = {};
  
  if (comparisonDates) {
    latestDayComparisons = calculateComparisons(
      dailyMetrics,
      comparisonDates.date1,
      comparisonDates.date2
    );
  }
  
  return {
    jobName,
    totalRuns: jobJobs.length,
    dateRange,
    dailyMetrics,
    availableMetrics,
    latestDayComparisons,
    comparisonDates,
  };
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  jobNames: [],
  selectedJob: null,
  selectedInterval: 'today_vs_yesterday',
  customDate1: null,
  customDate2: null,
  onlySuccessful: false,
  jobStatistics: null,
  isLoading: false,
  error: null,
  
  loadFile: (content: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const jobs = parseCsvFile(content);
      const jobNames = [...new Set(jobs.map(j => j.name))].sort();
      
      set({ 
        jobs, 
        jobNames,
        isLoading: false,
        selectedJob: null,
        jobStatistics: null,
      });
    } catch (error) {
      set({ 
        error: `Ошибка при обработке файла: ${error}`,
        isLoading: false 
      });
    }
  },
  
  selectJob: (jobName: string | null) => {
    const { jobs, selectedInterval, customDate1, customDate2, onlySuccessful } = get();
    
    if (!jobName) {
      set({ selectedJob: null, jobStatistics: null });
      return;
    }
    
    const jobStatistics = calculateJobStatistics(
      jobs, 
      jobName, 
      selectedInterval, 
      customDate1, 
      customDate2,
      onlySuccessful
    );
    set({ selectedJob: jobName, jobStatistics });
  },
  
  selectInterval: (interval: ComparisonInterval) => {
    const { jobs, selectedJob, customDate1, customDate2, onlySuccessful } = get();
    set({ selectedInterval: interval });
    
    if (selectedJob) {
      const jobStatistics = calculateJobStatistics(
        jobs, 
        selectedJob, 
        interval, 
        customDate1, 
        customDate2,
        onlySuccessful
      );
      set({ jobStatistics });
    }
  },
  
  setCustomDates: (date1: string, date2: string) => {
    const { jobs, selectedJob, onlySuccessful } = get();
    set({ customDate1: date1, customDate2: date2 });
    
    if (selectedJob) {
      const jobStatistics = calculateJobStatistics(
        jobs, 
        selectedJob, 
        'custom', 
        date1, 
        date2,
        onlySuccessful
      );
      set({ jobStatistics });
    }
  },
  
  toggleSuccessfulOnly: () => {
    const { jobs, selectedJob, selectedInterval, customDate1, customDate2, onlySuccessful } = get();
    const newOnlySuccessful = !onlySuccessful;
    set({ onlySuccessful: newOnlySuccessful });
    
    if (selectedJob) {
      const jobStatistics = calculateJobStatistics(
        jobs, 
        selectedJob, 
        selectedInterval, 
        customDate1, 
        customDate2,
        newOnlySuccessful
      );
      set({ jobStatistics });
    }
  },
  
  clearData: () => {
    set({ 
      jobs: [], 
      jobNames: [],
      selectedJob: null,
      selectedInterval: 'today_vs_yesterday',
      customDate1: null,
      customDate2: null,
      onlySuccessful: false,
      jobStatistics: null,
      error: null 
    });
  },
}));

// Экспортируем цвета для использования в компонентах
export { JOB_COLORS };
