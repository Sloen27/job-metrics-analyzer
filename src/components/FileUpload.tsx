'use client';

import { Upload, FileText, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJobStore } from '@/store/jobStore';

export function FileUpload() {
  const { loadFile, isLoading, jobs, clearData } = useJobStore();
  
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      loadFile(content);
    };
    reader.readAsText(file);
  };
  
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };
  
  if (jobs.length > 0) {
    const jobCount = new Set(jobs.map(j => j.name)).size;
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Данные загружены</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearData}
            >
              <X className="h-4 w-4 mr-1" />
              Очистить
            </Button>
          </div>
          <CardDescription>
            {jobs.length} записей • {jobCount} джоб
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Загрузка файла логов
        </CardTitle>
        <CardDescription>
          Перетащите CSV файл с логами джоб или нажмите для выбора
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Обработка файла...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Перетащите файл сюда или нажмите для выбора
              </p>
              <p className="text-sm text-muted-foreground">
                Поддерживаются CSV файлы с разделителем ;
              </p>
            </div>
          )}
          <input
            id="file-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </CardContent>
    </Card>
  );
}
