'use client';

import { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { useJobStore } from '@/store/jobStore';
import { useAiLogStore } from '@/store/aiLogStore';
import { useCombinedStore } from '@/store/combinedStore';
import { CombinedSummaryCards } from '@/components/CombinedSummaryCards';
import { CombinedFiltersComponent } from '@/components/CombinedFilters';
import { CombinedTable } from '@/components/CombinedTable';

/**
 * Сводное представление данных из обоих источников
 * 
 * Объединение происходит на уровне типа джобы (поле Name), а не на уровне отдельных запусков.
 * Каждая строка в таблице = одна джоба, агрегированная из обоих источников.
 */
export function CombinedView() {
  // Получаем данные из stores напрямую (без вызова функций в селекторах)
  const jobs = useJobStore((state) => state.jobs);
  const aiRecords = useAiLogStore((state) => state.records);
  
  // Получаем методы и состояние из combined store
  const filters = useCombinedStore((state) => state.filters);
  const sort = useCombinedStore((state) => state.sort);
  const setFilters = useCombinedStore((state) => state.setFilters);
  const resetFilters = useCombinedStore((state) => state.resetFilters);
  const setSort = useCombinedStore((state) => state.setSort);
  
  // Вычисляем данные с использованием memo
  const summaries = useMemo(() => {
    if (!jobs.length && !aiRecords.length) return [];
    return useCombinedStore.getState().getFilteredSummaries(jobs, aiRecords);
  }, [jobs, aiRecords, filters, sort]);
  
  const summaryCards = useMemo(() => {
    return useCombinedStore.getState().getSummaryCards(jobs, aiRecords);
  }, [jobs, aiRecords]);
  
  const uniqueFilterValues = useMemo(() => {
    return useCombinedStore.getState().getUniqueFilterValues(jobs, aiRecords);
  }, [jobs, aiRecords]);
  
  // Если нет данных вообще
  if (!jobs.length && !aiRecords.length) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Layers className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Нет данных для сводного представления</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Загрузите файлы OperationLog и AiLog для просмотра сводной аналитики.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <CombinedSummaryCards cards={summaryCards} />
      
      {/* Filters */}
      <CombinedFiltersComponent
        filters={filters}
        uniqueValues={uniqueFilterValues}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />
      
      {/* Table */}
      <CombinedTable
        summaries={summaries}
        sort={sort}
        onSortChange={setSort}
      />
      
      {/* Info block about the logic */}
      <div className="text-xs text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <strong>Как работает сводка:</strong> Объединение происходит на уровне типа джобы (поле Name), 
        а не на уровне отдельных запусков. Каждая строка = одна джоба, агрегированная из обоих источников. 
        Если джоба есть только в одном источнике, она всё равно отображается с доступными данными.
      </div>
    </div>
  );
}
