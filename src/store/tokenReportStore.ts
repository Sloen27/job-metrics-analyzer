// Хранилище состояния для отчёта по затратам токенов

import { create } from 'zustand';
import { AiLogRow } from '@/lib/aiTypes';
import {
  TokenReportSummary,
  TokenReportByJob,
  TokenReportByDay,
  TokenReportFilters,
  TokenReportByJobSort,
  TokenReportByDaySort,
} from '@/lib/tokenReportTypes';
import {
  filterAiRecords,
  buildTokenReportSummary,
  buildTokenReportByJobs,
  buildTokenReportByDays,
  sortTokenReportByJobs,
  sortTokenReportByDays,
  getTokenReportUniqueValues,
} from '@/lib/tokenReportAnalytics';

// Дефолтные значения фильтров
const defaultFilters: TokenReportFilters = {
  periodStart: null,
  periodEnd: null,
  name: null,
  provider: null,
  modelName: null,
  configType: null,
  onlyWithTokens: false,
};

// Дефолтная сортировка по джобам
const defaultByJobSort: TokenReportByJobSort = {
  field: 'totalSpentTokens',
  direction: 'desc',
};

// Дефолтная сортировка по суткам
const defaultByDaySort: TokenReportByDaySort = {
  field: 'date',
  direction: 'desc',
};

interface TokenReportStore {
  // Фильтры
  filters: TokenReportFilters;
  
  // Сортировка
  byJobSort: TokenReportByJobSort;
  byDaySort: TokenReportByDaySort;
  
  // Действия
  setFilters: (filters: Partial<TokenReportFilters>) => void;
  resetFilters: () => void;
  setByJobSort: (sort: Partial<TokenReportByJobSort>) => void;
  setByDaySort: (sort: Partial<TokenReportByDaySort>) => void;
  
  // Вычисляемые данные
  getFilteredRecords: (records: AiLogRow[]) => AiLogRow[];
  getSummary: (records: AiLogRow[]) => TokenReportSummary;
  getByJobs: (records: AiLogRow[]) => TokenReportByJob[];
  getByDays: (records: AiLogRow[]) => TokenReportByDay[];
  getUniqueValues: (records: AiLogRow[]) => {
    names: string[];
    providers: string[];
    models: string[];
    configTypes: string[];
  };
}

export const useTokenReportStore = create<TokenReportStore>((set, get) => ({
  filters: { ...defaultFilters },
  byJobSort: { ...defaultByJobSort },
  byDaySort: { ...defaultByDaySort },
  
  setFilters: (newFilters: Partial<TokenReportFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },
  
  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
  },
  
  setByJobSort: (newSort: Partial<TokenReportByJobSort>) => {
    set(state => ({
      byJobSort: { ...state.byJobSort, ...newSort },
    }));
  },
  
  setByDaySort: (newSort: Partial<TokenReportByDaySort>) => {
    set(state => ({
      byDaySort: { ...state.byDaySort, ...newSort },
    }));
  },
  
  getFilteredRecords: (records: AiLogRow[]) => {
    const { filters } = get();
    return filterAiRecords(records, filters);
  },
  
  getSummary: (records: AiLogRow[]) => {
    const { filters } = get();
    const filtered = filterAiRecords(records, filters);
    const byJobs = buildTokenReportByJobs(filtered);
    return buildTokenReportSummary(filtered, byJobs);
  },
  
  getByJobs: (records: AiLogRow[]) => {
    const { filters, byJobSort } = get();
    const filtered = filterAiRecords(records, filters);
    const jobs = buildTokenReportByJobs(filtered);
    return sortTokenReportByJobs(jobs, byJobSort);
  },
  
  getByDays: (records: AiLogRow[]) => {
    const { filters, byDaySort } = get();
    const filtered = filterAiRecords(records, filters);
    const days = buildTokenReportByDays(filtered);
    return sortTokenReportByDays(days, byDaySort);
  },
  
  getUniqueValues: (records: AiLogRow[]) => {
    return getTokenReportUniqueValues(records);
  },
}));

// Экспорт типов для использования в компонентах
export type { 
  TokenReportFilters, 
  TokenReportByJobSort, 
  TokenReportByDaySort 
};
