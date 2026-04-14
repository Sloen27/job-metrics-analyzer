'use client';

import { useMemo } from 'react';
import { useAiLogStore } from '@/store/aiLogStore';
import { useTokenReportStore } from '@/store/tokenReportStore';
import { TokenReportSummaryCards } from '@/components/TokenReportSummaryCards';
import { TokenReportFiltersComponent } from '@/components/TokenReportFilters';
import { TokenReportByJobsTable } from '@/components/TokenReportByJobsTable';
import { TokenReportByDaysTable } from '@/components/TokenReportByDaysTable';
import { TokenReportCharts } from '@/components/TokenReportCharts';
import { TokenReportExport } from '@/components/TokenReportExport';
import { Coins } from 'lucide-react';

/**
 * Отчёт по затратам токенов на основе AiLog
 * 
 * Особенности:
 * - Объединение по Name (джоба)
 * - Группировка по дням на основе StartDate (fallback на CreatedAt)
 * - Доли токенов рассчитываются относительно totalTokensAll
 * - Безопасная обработка пустых/битых данных
 */
export function TokenReportView() {
  // Получаем данные из AiLog store
  const aiRecords = useAiLogStore((state) => state.records);
  
  // Получаем методы и состояние из token report store
  const filters = useTokenReportStore((state) => state.filters);
  const byJobSort = useTokenReportStore((state) => state.byJobSort);
  const byDaySort = useTokenReportStore((state) => state.byDaySort);
  const setFilters = useTokenReportStore((state) => state.setFilters);
  const resetFilters = useTokenReportStore((state) => state.resetFilters);
  const setByJobSort = useTokenReportStore((state) => state.setByJobSort);
  const setByDaySort = useTokenReportStore((state) => state.setByDaySort);
  
  // Вычисляем данные с использованием memo
  const summary = useMemo(() => {
    return useTokenReportStore.getState().getSummary(aiRecords);
  }, [aiRecords, filters]);
  
  const byJobs = useMemo(() => {
    return useTokenReportStore.getState().getByJobs(aiRecords);
  }, [aiRecords, filters, byJobSort]);
  
  const byDays = useMemo(() => {
    return useTokenReportStore.getState().getByDays(aiRecords);
  }, [aiRecords, filters, byDaySort]);
  
  const uniqueValues = useMemo(() => {
    return useTokenReportStore.getState().getUniqueValues(aiRecords);
  }, [aiRecords]);
  
  // Если нет данных AiLog
  if (aiRecords.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Coins className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Нет данных AiLog</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Загрузите CSV файл с AI логами для просмотра отчёта по затратам токенов.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Info block */}
      <div className="text-xs text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <strong>Как считается отчёт:</strong> Группировка по джобам — по полю Name. 
        Группировка по дням — по StartDate (fallback на CreatedAt при отсутствии). 
        Доля токенов = токены джобы / totalTokensAll. 
        Пустые или некорректные SpentTokens считаются как 0.
      </div>
      
      {/* Summary Cards */}
      <TokenReportSummaryCards summary={summary} />
      
      {/* Filters */}
      <TokenReportFiltersComponent
        filters={filters}
        uniqueValues={uniqueValues}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />
      
      {/* Export */}
      <TokenReportExport byJobs={byJobs} byDays={byDays} />
      
      {/* Charts */}
      <TokenReportCharts byDays={byDays} byJobs={byJobs} />
      
      {/* Table by Jobs */}
      <TokenReportByJobsTable
        jobs={byJobs}
        sort={byJobSort}
        onSortChange={setByJobSort}
      />
      
      {/* Table by Days */}
      <TokenReportByDaysTable
        days={byDays}
        sort={byDaySort}
        onSortChange={setByDaySort}
      />
    </div>
  );
}
