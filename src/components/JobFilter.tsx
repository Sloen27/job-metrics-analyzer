'use client';

import { useJobStore, JOB_COLORS } from '@/store/jobStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

export function JobFilter() {
  const { statistics, selectedJob, selectJob } = useJobStore();
  
  if (statistics.length === 0) return null;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Фильтр по джобе
          </CardTitle>
          {selectedJob && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => selectJob(null)}
            >
              <X className="h-4 w-4 mr-1" />
              Сбросить
            </Button>
          )}
        </div>
        <CardDescription>
          Выберите джобу для фильтрации графиков
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="w-full">
          <div className="flex flex-wrap gap-2">
            {statistics.map((stat) => (
              <Button
                key={stat.name}
                variant={selectedJob === stat.name ? 'default' : 'outline'}
                size="sm"
                className="h-auto py-1.5 px-3"
                onClick={() => selectJob(selectedJob === stat.name ? null : stat.name)}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: JOB_COLORS[stat.name] || '#888' }}
                />
                <span className="truncate max-w-[180px]">{stat.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {stat.count}
                </Badge>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
