// Типы данных для отчёта по затратам токенов AiLog

// Сводные метрики отчёта
export interface TokenReportSummary {
  totalRecords: number;
  uniqueJobs: number;
  totalSpentTokens: number;
  avgTokensPerRecord: number;
  avgTokensPerDay: number;
  maxTokensPerDay: number;
  topJobByTokens: string | null;
  topJobTokens: number;
  topModelByTokens: string | null;
  topModelTokens: number;
}

// Строка отчёта по джобе
export interface TokenReportByJob {
  name: string;
  displayName: string;
  runsCount: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  totalSpentTokens: number;
  tokenShare: number; // 0-1, в UI отображать как процент
  avgSpentTokens: number;
  medianSpentTokens: number;
  maxSpentTokens: number;
  lastActivityAt: Date | null;
  providersUsed: string[];
  modelsUsed: string[];
  configTypesUsed: string[];
}

// Строка отчёта по суткам
export interface TokenReportByDay {
  date: string; // YYYY-MM-DD
  runsCount: number;
  totalSpentTokens: number;
  avgSpentTokens: number;
  uniqueJobsCount: number;
  topJobName: string | null;
  topJobTokens: number;
}

// Фильтры для отчёта
export interface TokenReportFilters {
  periodStart: string | null; // YYYY-MM-DD
  periodEnd: string | null; // YYYY-MM-DD
  name: string | null;
  provider: string | null;
  modelName: string | null;
  configType: string | null;
  onlyWithTokens: boolean; // только записи с токенами > 0
}

// Сортировка таблицы по джобам
export type TokenReportByJobSortField = 
  | 'name'
  | 'runsCount'
  | 'totalSpentTokens'
  | 'tokenShare'
  | 'avgSpentTokens'
  | 'lastActivityAt';

export interface TokenReportByJobSort {
  field: TokenReportByJobSortField;
  direction: 'asc' | 'desc';
}

// Сортировка таблицы по суткам
export type TokenReportByDaySortField = 
  | 'date'
  | 'runsCount'
  | 'totalSpentTokens'
  | 'uniqueJobsCount';

export interface TokenReportByDaySort {
  field: TokenReportByDaySortField;
  direction: 'asc' | 'desc';
}

// Данные для экспорта CSV
export interface TokenReportCsvExport {
  byJobs: TokenReportByJob[];
  byDays: TokenReportByDay[];
  exportDate: string;
}
