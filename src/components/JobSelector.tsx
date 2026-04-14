'use client';

import { useJobStore, JOB_COLORS } from '@/store/jobStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, CheckCircle2, XCircle } from 'lucide-react';

export function JobSelector() {
  const { jobNames, selectedJob, selectJob, jobs } = useJobStore();
  
  if (jobNames.length === 0) return null;
  
  // Подсчитываем запуски и ошибки для каждой джобы
  const jobStats = new Map<string, { count: number; errors: number }>();
  for (const job of jobs) {
    const existing = jobStats.get(job.name) || { count: 0, errors: 0 };
    existing.count++;
    if (job.status === 3) existing.errors++;
    jobStats.set(job.name, existing);
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Выберите джобу для анализа
        </CardTitle>
        <CardDescription>
          Выберите джобу для просмотра динамики её метрик по дням
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Select value={selectedJob || ''} onValueChange={(value) => selectJob(value || null)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите джобу..." />
          </SelectTrigger>
          <SelectContent>
            {jobNames.map((name) => {
              const stats = jobStats.get(name) || { count: 0, errors: 0 };
              return (
                <SelectItem key={name} value={name}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: JOB_COLORS[name] || '#888' }}
                    />
                    <span>{name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {stats.count} запусков
                    </Badge>
                    {stats.errors > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {stats.errors} ошибок
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
