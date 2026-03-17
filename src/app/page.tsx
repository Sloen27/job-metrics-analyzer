'use client';

import { FileUpload } from '@/components/FileUpload';
import { JobTabs } from '@/components/JobTabs';
import { IntervalSelector } from '@/components/IntervalSelector';
import { MetricsComparison } from '@/components/MetricsComparison';
import { JobRunsList } from '@/components/JobRunsList';
import { DailyMetricsTable } from '@/components/DailyMetricsTable';
import { MetricTrendChart, RunCountChart, DurationChart } from '@/components/Charts';
import { useJobStore, JOB_NAMES_RU } from '@/store/jobStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart3 } from 'lucide-react';

export default function Home() {
  const { jobs, error, selectedJob } = useJobStore();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Анализ метрик джоб</h1>
              <p className="text-sm text-muted-foreground">
                Сравнение метрик по периодам для отслеживания динамики
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File Upload Section */}
        <div className="mb-6">
          <FileUpload />
        </div>

        {/* Content - only show when data is loaded */}
        {jobs.length > 0 && (
          <div className="space-y-6">
            {/* Tabs for selecting job */}
            <JobTabs />
            
            {/* Show content only when job is selected */}
            {selectedJob && (
              <>
                {/* Interval selector with filter */}
                <IntervalSelector />
                
                {/* Metrics comparison */}
                <MetricsComparison />
                
                {/* Job runs list */}
                <JobRunsList />
                
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RunCountChart />
                  <DurationChart />
                </div>
                
                <MetricTrendChart />
                
                {/* Daily metrics table */}
                <DailyMetricsTable />
              </>
            )}
            
            {/* Hint if no job selected */}
            {!selectedJob && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Выберите джобу для анализа</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Нажмите на вкладку джобы выше, чтобы увидеть сравнение её метрик 
                  за выбранные периоды времени.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {jobs.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Нет данных для отображения</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Загрузите CSV файл с логами выполнения джоб для просмотра статистики и графиков.
              Файл должен содержать колонки: Id, Name, StartDate, EndDate, Status, Error, Metrics.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Анализатор метрик системы обработки данных • {jobs.length > 0 && `${jobs.length} записей загружено`}
            {selectedJob && ` • ${JOB_NAMES_RU[selectedJob] || selectedJob}`}
          </p>
        </div>
      </footer>
    </div>
  );
}
