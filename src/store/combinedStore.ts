// Хранилище состояния для сводного представления

import { create } from 'zustand';
import {
  CombinedJobSummary,
  CombinedSummaryCards,
  CombinedFilters,
  CombinedSort,
  CombinedSortField,
  CoverageType,
} from '@/lib/aiTypes';
import {
  buildCombinedJobSummary,
  buildSummaryCards,
  filterCombinedSummaries,
  sortCombinedSummaries,
  getCombinedUniqueValues,
} from '@/lib/combinedAnalytics';
import { useJobStore } from './jobStore';
import { useAiLogStore } from './aiLogStore';

// Дефолтные значения фильтров
const defaultFilters: CombinedFilters = {
  search: '',
  coverageType: 'all',
  provider: null,
  modelName: null,
  configType: null,
  onlyWithAiErrors: false,
  onlyWithTokens: false,
};

// Дефолтная сортировка
const defaultSort: CombinedSort = {
  field: 'lastActivityAt',
  direction: 'desc',
};

interface CombinedStore {
  // Фильтры
  filters: CombinedFilters;
  
  // Сортировка
  sort: CombinedSort;
  
  // Действия
  setFilters: (filters: Partial<CombinedFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: Partial<CombinedSort>) => void;
  
  // Вычисляемые данные (вызываются с передачей данных из других stores)
  getSummaries: (
    operationJobs: ReturnType<typeof useJobStore.getState>['jobs'],
    aiRecords: ReturnType<typeof useAiLogStore.getState>['records']
  ) => CombinedJobSummary[];
  
  getFilteredSummaries: (
    operationJobs: ReturnType<typeof useJobStore.getState>['jobs'],
    aiRecords: ReturnType<typeof useAiLogStore.getState>['records']
  ) => CombinedJobSummary[];
  
  getSummaryCards: (
    operationJobs: ReturnType<typeof useJobStore.getState>['jobs'],
    aiRecords: ReturnType<typeof useAiLogStore.getState>['records']
  ) => CombinedSummaryCards;
  
  getUniqueFilterValues: (
    operationJobs: ReturnType<typeof useJobStore.getState>['jobs'],
    aiRecords: ReturnType<typeof useAiLogStore.getState>['records']
  ) => {
    providers: string[];
    models: string[];
    configTypes: string[];
  };
}

export const useCombinedStore = create<CombinedStore>((set, get) => ({
  filters: { ...defaultFilters },
  sort: { ...defaultSort },
  
  setFilters: (newFilters: Partial<CombinedFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },
  
  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
  },
  
  setSort: (newSort: Partial<CombinedSort>) => {
    set(state => ({
      sort: { ...state.sort, ...newSort },
    }));
  },
  
  getSummaries: (operationJobs, aiRecords) => {
    return buildCombinedJobSummary(operationJobs, aiRecords);
  },
  
  getFilteredSummaries: (operationJobs, aiRecords) => {
    const { filters, sort } = get();
    const summaries = buildCombinedJobSummary(operationJobs, aiRecords);
    const filtered = filterCombinedSummaries(summaries, filters);
    return sortCombinedSummaries(filtered, sort);
  },
  
  getSummaryCards: (operationJobs, aiRecords) => {
    const summaries = buildCombinedJobSummary(operationJobs, aiRecords);
    return buildSummaryCards(summaries);
  },
  
  getUniqueFilterValues: (operationJobs, aiRecords) => {
    const summaries = buildCombinedJobSummary(operationJobs, aiRecords);
    return getCombinedUniqueValues(summaries);
  },
}));

// Экспорт типов для использования в компонентах
export type { CombinedFilters, CombinedSort, CombinedSortField, CoverageType };
