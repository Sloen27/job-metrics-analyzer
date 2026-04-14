// Типы данных для анализа логов джоб

export interface JobLog {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: JobStatus;
  error: string;
  metrics: JobMetrics;
  duration: number; // в миллисекундах
}

export enum JobStatus {
  Success = 1,
  Error = 3,
}

export interface JobMetrics {
  // Общие метрики
  processedPosts?: number;
  taggedPosts?: number;

  // LLM метрики
  avgLlmTime?: number; // в мс
  totalLlmTime?: number; // в мс
  llmRequestsCount?: number;

  // Инфоповоды
  processedInfoEvents?: number;
  avgComments?: number;
  totalComments?: number;

  // Telegram метрики
  activeSources?: number;
  processedSources?: number;
  connectedSources?: number;
  usedAccounts?: number;
  newPosts?: number;
  totalPosts?: number;

  // Проценты и доли
  successRate?: number;
  taggedPercent?: number;
  shortPostsPercent?: number;
  shortTrendsPercent?: number;

  // === НОВЫЕ МЕТРИКИ PostTagProcessingJob ===
  // Распределение тегов
  postsWith2to4TagsPercent?: number; // Доля постов с 2-4 тегами (%)
  postsWith1TagPercent?: number; // Доля постов с 1 тегом (%)
  brokenPostsPercent?: number; // Доля сломанных постов (0 тегов) (%)
  newPostsTaggedIn2DaysPercent?: number; // Доля протегированных новых постов за два дня (%)
  
  // Время тегирования
  avgTimeToTag?: number; // Среднее время от появления поста до тегирования (в минутах)
  
  // Тайминги компонентов (БД, OpenSearch, LLM)
  dbTimePercent?: number; // Доля времени БД (%)
  dbTimeMs?: number; // Время БД (мс)
  dbRequests?: number; // Количество запросов к БД
  
  openSearchTimePercent?: number; // Доля времени OpenSearch (%)
  openSearchTimeMs?: number; // Время OpenSearch (мс)
  openSearchRequests?: number; // Количество запросов к OpenSearch
  
  llmTimePercent?: number; // Доля времени LLM (%)
  llmTimeMs?: number; // Время LLM (мс) - из строки таймингов

  // === НОВЫЕ МЕТРИКИ TelegramProcessingJob ===
  proxyChanges?: number; // Суммарное количество смен прокси
  uniqueProxies?: number; // Количество уникальных прокси
  avgSourcesPerProxy?: number; // Среднее количество источников на один прокси
  medianProxyPing?: number; // Медианный пинг прокси (мс)
  proxyChangeSourcesPercent?: number; // Доля источников со сменой прокси (%)

  // === НОВЫЕ МЕТРИКИ ClusterCommentTrendProcessingJob ===
  shortTrendsCount?: number; // Количество пустых/коротких трендов

  // === НОВЫЕ МЕТРИКИ TelegramPostCommentTrendProcessingJob ===
  totalTrackedPosts?: number; // Общее количество постов для всех отслеживаний

  // === НОВЫЕ МЕТРИКИ PostEmotionalAnalysisProcessingJob ===
  shortTextPostsCount?: number; // Количество постов с очень коротким текстом
}

// Агрегированные метрики за день
export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  
  // Количество запусков
  runCount: number;
  successCount: number;
  errorCount: number;
  
  // Длительность
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
  
  // Агрегированные метрики джобы
  metrics: AggregatedJobMetrics;
}

// Агрегированные метрики для одной джобы за день
export interface AggregatedJobMetrics {
  // Посты
  totalProcessedPosts?: number;
  avgProcessedPosts?: number;
  totalTaggedPosts?: number;
  
  // LLM
  avgLlmTime?: number;
  minLlmTime?: number;
  maxLlmTime?: number;
  totalLlmTime?: number;
  totalLlmRequests?: number;
  avgLlmRequests?: number;
  
  // Инфоповоды и комментарии
  totalProcessedInfoEvents?: number;
  avgComments?: number;
  totalComments?: number;
  
  // Telegram метрики
  totalNewPosts?: number;
  totalAllPosts?: number;
  avgActiveSources?: number;
  avgProcessedSources?: number;
  avgConnectedSources?: number;
  avgUsedAccounts?: number;
  
  // Проценты (средние за день)
  avgSuccessRate?: number;
  avgTaggedPercent?: number;
  avgShortPostsPercent?: number;
  avgShortTrendsPercent?: number;
}

// Сравнение метрик с предыдущим периодом
export interface MetricComparison {
  current: number;
  previous: number;
  change: number; // абсолютное изменение
  changePercent: number; // процентное изменение
  average: number; // среднее за период
  vsAverage: number; // отклонение от среднего в %
  trend: 'up' | 'down' | 'stable';
}

// Статистика джобы с дневной разбивкой
export interface JobDailyStatistics {
  jobName: string;
  totalRuns: number;
  dateRange: {
    start: string;
    end: string;
  };
  dailyMetrics: DailyMetrics[];
  
  // Сравнение последнего дня с предыдущим и средним
  latestDayComparisons: Record<string, MetricComparison>;
  
  // Список доступных метрик для этой джобы
  availableMetrics: string[];
  
  // Даты сравнения
  comparisonDates?: { date1: string; date2: string } | null;
}

// Интервалы сравнения
export type ComparisonInterval = 'today_vs_yesterday' | 'yesterday_vs_day_before' | 'custom';

// Определение интервала для UI
export interface IntervalDefinition {
  key: ComparisonInterval;
  label: string;
  description: string;
}

// Описание метрики для отображения
export interface MetricDefinition {
  key: string;
  label: string;
  unit: string;
  format: 'number' | 'percent' | 'duration' | 'decimal';
  higherIsBetter: boolean;
}
