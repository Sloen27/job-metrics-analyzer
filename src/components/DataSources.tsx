'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, RefreshCw, Database, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useJobStore } from '@/store/jobStore';
import { useAiLogStore } from '@/store/aiLogStore';
import { detectFileType, getFileTypeName, FileType } from '@/lib/fileDetector';

export function DataSources() {
  const { loadFile: loadOperationLog, jobs, clearData: clearOperationLog, isLoading: isLoadingOperation } = useJobStore();
  const { loadFile: loadAiLog, records: aiRecords, fileName: aiFileName, rejectedCount, clearData: clearAiLog, isLoading: isLoadingAi, error: aiError } = useAiLogStore();
  
  const [operationLogFileName, setOperationLogFileName] = useState<string | null>(null);
  const [dragOverZone, setDragOverZone] = useState<'operation' | 'ai' | null>(null);
  const [detectedType, setDetectedType] = useState<FileType | null>(null);
  const [showTypeWarning, setShowTypeWarning] = useState(false);
  
  const handleFile = useCallback((file: File, targetZone: 'operation' | 'ai') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileType = detectFileType(content);
      setDetectedType(fileType);
      
      // Проверяем соответствует ли тип зоне
      const isCorrectZone = 
        (targetZone === 'operation' && fileType === 'operation') ||
        (targetZone === 'ai' && fileType === 'ai');
      
      if (!isCorrectZone && fileType !== 'unknown') {
        setShowTypeWarning(true);
        // Автоматически загружаем в правильную зону
        if (fileType === 'operation') {
          loadOperationLog(content);
          setOperationLogFileName(file.name);
        } else if (fileType === 'ai') {
          loadAiLog(content, file.name);
        }
        return;
      }
      
      setShowTypeWarning(false);
      
      if (targetZone === 'operation') {
        loadOperationLog(content);
        setOperationLogFileName(file.name);
      } else {
        loadAiLog(content, file.name);
      }
    };
    reader.readAsText(file);
  }, [loadOperationLog, loadAiLog]);
  
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>, zone: 'operation' | 'ai') => {
    e.preventDefault();
    setDragOverZone(null);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file, zone);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, zone: 'operation' | 'ai') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file, zone);
    }
  };
  
  const hasOperationData = jobs.length > 0;
  const hasAiData = aiRecords.length > 0;
  
  return (
    <div className="space-y-4">
      {/* Warning for wrong file type */}
      {showTypeWarning && detectedType && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Автоматическое определение</AlertTitle>
          <AlertDescription>
            Файл определён как {getFileTypeName(detectedType)} и загружен в соответствующую секцию.
          </AlertDescription>
        </Alert>
      )}
      
      {/* AI Error */}
      {aiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки AiLog</AlertTitle>
          <AlertDescription>{aiError}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OperationLog Zone */}
        <Card className={dragOverZone === 'operation' ? 'border-primary' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">OperationLog</CardTitle>
              </div>
              {hasOperationData && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    clearOperationLog();
                    setOperationLogFileName(null);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Очистить
                </Button>
              )}
            </div>
            <CardDescription>
              Логи выполнения операций с метриками
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasOperationData ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{operationLogFileName || 'Файл загружен'}</p>
                  <p className="text-xs text-muted-foreground">
                    {jobs.length} записей • {new Set(jobs.map(j => j.name)).size} джоб
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('operation-file-input')?.click()}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Заменить
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onDrop={(e) => handleFileDrop(e, 'operation')}
                onDragOver={(e) => { e.preventDefault(); setDragOverZone('operation'); }}
                onDragLeave={() => setDragOverZone(null)}
                onClick={() => document.getElementById('operation-file-input')?.click()}
              >
                {isLoadingOperation ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-sm">Обработка...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Перетащите файл или нажмите
                    </p>
                  </div>
                )}
              </div>
            )}
            <input
              id="operation-file-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'operation')}
            />
          </CardContent>
        </Card>
        
        {/* AiLog Zone */}
        <Card className={dragOverZone === 'ai' ? 'border-primary' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">AiLog</CardTitle>
              </div>
              {hasAiData && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearAiLog}
                >
                  <X className="h-4 w-4 mr-1" />
                  Очистить
                </Button>
              )}
            </div>
            <CardDescription>
              Логи AI операций с токенами и моделями
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasAiData ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{aiFileName || 'Файл загружен'}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {aiRecords.length} записей
                    </p>
                    {rejectedCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {rejectedCount} отклонено
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('ai-file-input')?.click()}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Заменить
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onDrop={(e) => handleFileDrop(e, 'ai')}
                onDragOver={(e) => { e.preventDefault(); setDragOverZone('ai'); }}
                onDragLeave={() => setDragOverZone(null)}
                onClick={() => document.getElementById('ai-file-input')?.click()}
              >
                {isLoadingAi ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-sm">Обработка...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Перетащите файл или нажмите
                    </p>
                  </div>
                )}
              </div>
            )}
            <input
              id="ai-file-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'ai')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
