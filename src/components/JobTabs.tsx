'use client';

import { useJobStore, JOB_COLORS, JOB_NAMES_RU } from '@/store/jobStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function JobTabs() {
  const { jobNames, selectedJob, selectJob, jobs, onlySuccessful } = useJobStore();
  
  if (jobNames.length === 0) return null;
  
  // Подсчитываем запуски и ошибки для каждой джобы
  const jobStats = new Map<string, { count: number; errors: number; successful: number }>();
  for (const job of jobs) {
    const existing = jobStats.get(job.name) || { count: 0, errors: 0, successful: 0 };
    existing.count++;
    if (job.status === 1) existing.successful++;
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
          Каждая вкладка показывает метрики отдельной джобы
          {onlySuccessful && ' • Только успешные запуски'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {jobNames.map((name) => {
            const stats = jobStats.get(name) || { count: 0, errors: 0, successful: 0 };
            const color = JOB_COLORS[name] || '#888';
            const displayName = JOB_NAMES_RU[name] || name;
            const isSelected = selectedJob === name;
            
            return (
              <button
                key={name}
                onClick={() => selectJob(isSelected ? null : name)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                  "hover:bg-accent hover:text-accent-foreground",
                  isSelected 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-background border-border"
                )}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium whitespace-nowrap">
                  {displayName}
                </span>
                <Badge 
                  variant={isSelected ? "secondary" : "outline"} 
                  className={cn(
                    "ml-1 text-xs",
                    isSelected && "bg-primary-foreground/20 text-primary-foreground"
                  )}
                >
                  {onlySuccessful ? stats.successful : stats.count}
                </Badge>
                {stats.errors > 0 && !onlySuccessful && (
                  <Badge 
                    variant="destructive" 
                    className="ml-0.5 text-xs px-1.5"
                  >
                    {stats.errors}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
