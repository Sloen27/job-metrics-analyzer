'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { JobTabs } from '@/components/JobTabs';
import { IntervalSelector } from '@/components/IntervalSelector';
import { MetricsComparison } from '@/components/MetricsComparison';
import { JobRunsList } from '@/components/JobRunsList';
import { DailyMetricsTable } from '@/components/DailyMetricsTable';
import { MetricTrendChart, RunCountChart, DurationChart } from '@/components/Charts';
import { useJobStore, JOB_NAMES_RU } from '@/store/jobStore';
import { useAiLogStore } from '@/store/aiLogStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BarChart3, Coins } from 'lucide-react';
import { DataSources } from '@/components/DataSources';
import { AiOverviewCards } from '@/components/AiOverviewCards';
import { AiCharts } from '@/components/AiCharts';
import { AiTables } from '@/components/AiTables';
import { AiFilters } from '@/components/AiFilters';
import { CombinedView } from '@/components/CombinedView';
import { TokenReportView } from '@/components/TokenReportView';

export default function Home() {
  const { jobs, error, selectedJob } = useJobStore();
  const { records: aiRecords } = useAiLogStore();
  const [activeTab, setActiveTab] = useState<string>('operation');
  
  const hasOperationData = jobs.length > 0;
  const hasAiData = aiRecords.length > 0;
  const hasBothData = hasOperationData && hasAiData;
  
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

        {/* Data Sources Section */}
        <div className="mb-6">
          <DataSources />
        </div>

        {/* Main Content Tabs */}
        {(hasOperationData || hasAiData) && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-lg">
              <TabsTrigger value="operation" className="flex items-center gap-2">
                OperationLog
                {hasOperationData && (
                  <Badge variant="secondary" className="ml-1">
                    {jobs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                AiLog
                {hasAiData && (
                  <Badge variant="secondary" className="ml-1">
                    {aiRecords.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tokens" disabled={!hasAiData} className="flex items-center gap-2">
                <Coins className="h-3 w-3" />
                Токены
              </TabsTrigger>
              <TabsTrigger value="combined" disabled={!hasBothData} className="flex items-center gap-2">
                Сводно
              </TabsTrigger>
            </TabsList>
            
            {/* OperationLog Tab */}
            <TabsContent value="operation" className="space-y-6">
              {hasOperationData ? (
                <>
                  {/* File Upload Section - only show when no data */}
                  <FileUpload />
                  
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
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Нет данных OperationLog</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Загрузите CSV файл с логами выполнения джоб (OperationLog) для просмотра статистики.
                  </p>
                </div>
              )}
            </TabsContent>
            
            {/* AiLog Tab */}
            <TabsContent value="ai" className="space-y-6">
              {hasAiData ? (
                <>
                  {/* Filters */}
                  <AiFilters />
                  
                  {/* Overview Cards */}
                  <AiOverviewCards />
                  
                  {/* Charts */}
                  <AiCharts />
                  
                  {/* Tables */}
                  <AiTables />
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Нет данных AiLog</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Загрузите CSV файл с логами AI операций (AiLog) для просмотра статистики.
                  </p>
                </div>
              )}
            </TabsContent>
            
            {/* Token Report Tab */}
            <TabsContent value="tokens" className="space-y-6">
              <TokenReportView />
            </TabsContent>
            
            {/* Combined View Tab */}
            <TabsContent value="combined" className="space-y-6">
              {hasBothData ? (
                <CombinedView />
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Требуются оба файла</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Для просмотра сводного представления загрузите файлы OperationLog и AiLog.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State - no data at all */}
        {!hasOperationData && !hasAiData && !error && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Нет данных для отображения</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Загрузите CSV файлы с логами выполнения джоб для просмотра статистики и графиков.
              <br />
              Поддерживаются файлы OperationLog и AiLog.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Анализатор метрик системы обработки данных
            {hasOperationData && ` • OperationLog: ${jobs.length} записей`}
            {hasAiData && ` • AiLog: ${aiRecords.length} записей`}
            {selectedJob && ` • ${JOB_NAMES_RU[selectedJob] || selectedJob}`}
          </p>
        </div>
      </footer>
    </div>
  );
}
