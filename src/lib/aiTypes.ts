// Типы данных для анализа AI логов

// Запись AI лога
export interface AiLogRow {
  id: string;
  name: string;
  startDate: Date;
  createdAt: Date;
  endDate: Date;
  status: number;
  error: string;
  configType: string;
  provider: string;
  modelName: string;
  spentTokens: number;
  durationMs: number;  // вычисляемое: endDate - startDate
  queueLagMs: number;  // вычисляемое: startDate - createdAt
  isSuccess: boolean;
  isError: boolean;
}

// Статистика AI логов
export interface AiLogStatistics {
  totalRecords: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  errorRate: number;
  totalSpentTokens: number;
  avgSpentTokens: number;
  medianSpentTokens: number;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  avgQueueLag: number;
  p50QueueLag: number;
  p95QueueLag: number;
}

// Статистика по джобе
export interface AiLogByJobStats {
  name: string;
  totalRuns: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgDuration: number;
  p95Duration: number;
  totalSpentTokens: number;
  avgSpentTokens: number;
}

// Статистика по провайдеру/модели
export interface AiLogByProviderStats {
  provider: string;
  modelName: string;
  runs: number;
  successRate: number;
  avgDuration: number;
  totalSpentTokens: number;
}

// Статистика из OperationLog для сводки
export interface OperationLogAggregates {
  runs: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  lastActivityAt: Date | null;
}

// Статистика из AiLog для сводки
export interface AiLogAggregates {
  runs: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  avgQueueLagMs: number;
  p95QueueLagMs: number;
  totalSpentTokens: number;
  avgSpentTokens: number;
  lastActivityAt: Date | null;
  providers: string[];
  models: string[];
  configTypes: string[];
}

// Тип покрытия источниками
export type CoverageType = 'both' | 'operation_only' | 'ai_only';

// Сводная статистика по джобе (объединённое представление)
export interface CombinedJobSummary {
  name: string;
  displayName: string;
  hasOperation: boolean;
  hasAi: boolean;
  coverageType: CoverageType;
  lastActivityAt: Date | null;
  
  // OperationLog метрики
  operationRuns: number;
  operationSuccessCount: number;
  operationErrorCount: number;
  operationSuccessRate: number;
  operationAvgDurationMs: number;
  operationP95DurationMs: number;
  lastOperationAt: Date | null;
  
  // AiLog метрики
  aiRuns: number;
  aiSuccessCount: number;
  aiErrorCount: number;
  aiSuccessRate: number;
  aiAvgDurationMs: number;
  aiP95DurationMs: number;
  aiAvgQueueLagMs: number;
  aiP95QueueLagMs: number;
  aiTotalSpentTokens: number;
  aiAvgSpentTokens: number;
  lastAiAt: Date | null;
  providersUsed: string[];
  modelsUsed: string[];
  configTypesUsed: string[];
}

// Сводные карточки (summary cards)
export interface CombinedSummaryCards {
  totalUniqueJobs: number;
  operationOnlyJobs: number;
  aiOnlyJobs: number;
  bothSourcesJobs: number;
  totalAiTokens: number;
  avgAiSuccessRate: number;
}

// Фильтры для сводного представления
export interface CombinedFilters {
  search: string;
  coverageType: CoverageType | 'all';
  provider: string | null;
  modelName: string | null;
  configType: string | null;
  onlyWithAiErrors: boolean;
  onlyWithTokens: boolean;
}

// Сортировка сводной таблицы
export type CombinedSortField = 
  | 'name' 
  | 'operationRuns' 
  | 'aiRuns' 
  | 'operationSuccessRate' 
  | 'aiSuccessRate'
  | 'aiAvgDurationMs'
  | 'aiTotalSpentTokens'
  | 'lastActivityAt';

export interface CombinedSort {
  field: CombinedSortField;
  direction: 'asc' | 'desc';
}

// Устаревший тип для обратной совместимости
export interface CombinedJobStats {
  name: string;
  inOperationLog: boolean;
  inAiLog: boolean;
  operationLogRuns: number;
  aiLogRuns: number;
  operationLogSuccessRate: number;
  aiLogSuccessRate: number;
  avgDuration: number;
  totalSpentTokens: number;
}

// Фильтры для AI логов
export interface AiLogFilters {
  periodStart: string | null;
  periodEnd: string | null;
  name: string | null;
  provider: string | null;
  modelName: string | null;
  configType: string | null;
  status: 'all' | 'success' | 'error';
  onlyErrors: boolean;
  tokensAboveZero: boolean;
}

// Дневная статистика AI логов
export interface AiLogDailyStats {
  date: string;
  totalRuns: number;
  successCount: number;
  errorCount: number;
  totalSpentTokens: number;
  avgDuration: number;
}

// Ошибка с количеством
export interface ErrorSummary {
  error: string;
  count: number;
  lastOccurrence: Date;
  jobNames: string[];
}
