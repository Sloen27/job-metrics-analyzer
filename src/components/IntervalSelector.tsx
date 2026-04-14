'use client';

import { useState } from 'react';
import { useJobStore, INTERVAL_DEFINITIONS } from '@/store/jobStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check, Filter, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function IntervalSelector() {
  const { 
    selectedInterval, 
    selectInterval, 
    selectedJob, 
    customDate1, 
    customDate2, 
    setCustomDates,
    onlySuccessful,
    toggleSuccessfulOnly,
    jobStatistics 
  } = useJobStore();
  
  const [date1PickerOpen, setDate1PickerOpen] = useState(false);
  const [date2PickerOpen, setDate2PickerOpen] = useState(false);
  
  if (!selectedJob) return null;
  
  // Получаем доступные даты из статистики
  const availableDates = jobStatistics?.dailyMetrics.map(d => d.date) || [];
  
  // Функция для отключения недоступных дат
  const isDateDisabled = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return !availableDates.includes(dateStr);
  };
  
  // Преобразуем строку даты в Date объект (локальное время)
  const parseLocalDate = (dateStr: string | null): Date | undefined => {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  // Преобразуем Date объект в строку даты (локальное время)
  const formatDateStr = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4" />
              Интервал сравнения
            </CardTitle>
            <CardDescription>
              Выберите периоды для сравнения метрик
            </CardDescription>
          </div>
          
          {/* Фильтр успешных */}
          <Button
            variant={onlySuccessful ? 'default' : 'outline'}
            size="sm"
            onClick={toggleSuccessfulOnly}
            className="flex items-center gap-2"
          >
            {onlySuccessful ? (
              <>
                <Check className="h-4 w-4" />
                Только успешные
              </>
            ) : (
              <>
                <Filter className="h-4 w-4" />
                Все запуски
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Пресеты интервалов */}
        <div className="flex flex-wrap gap-2">
          <ToggleGroup 
            type="single" 
            value={selectedInterval} 
            onValueChange={(value) => value && selectInterval(value as typeof selectedInterval)}
            className="flex flex-wrap justify-start gap-2"
          >
            {INTERVAL_DEFINITIONS.filter(def => def.key !== 'custom').map((interval) => (
              <ToggleGroupItem
                key={interval.key}
                value={interval.key}
                aria-label={interval.label}
                className="px-4 py-2 text-sm border rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {interval.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        
        {/* Кастомный выбор дат */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium">Свой интервал:</span>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Первая дата */}
            <Popover open={date1PickerOpen} onOpenChange={setDate1PickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={selectedInterval === 'custom' && customDate1 ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !customDate1 && "text-muted-foreground"
                  )}
                  onClick={() => {
                    selectInterval('custom');
                    setDate1PickerOpen(true);
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDate1 ? format(parseLocalDate(customDate1)!, 'd MMMM', { locale: ru }) : 'Дата 1'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseLocalDate(customDate1)}
                  onSelect={(date) => {
                    if (date) {
                      const dateStr = formatDateStr(date);
                      if (customDate2) {
                        setCustomDates(dateStr, customDate2);
                      } else {
                        setCustomDates(dateStr, '');
                      }
                    }
                    setDate1PickerOpen(false);
                  }}
                  disabled={isDateDisabled}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-muted-foreground">vs</span>
            
            {/* Вторая дата */}
            <Popover open={date2PickerOpen} onOpenChange={setDate2PickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={selectedInterval === 'custom' && customDate2 ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !customDate2 && "text-muted-foreground"
                  )}
                  onClick={() => {
                    selectInterval('custom');
                    setDate2PickerOpen(true);
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDate2 ? format(parseLocalDate(customDate2)!, 'd MMMM', { locale: ru }) : 'Дата 2'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseLocalDate(customDate2)}
                  onSelect={(date) => {
                    if (date) {
                      const dateStr = formatDateStr(date);
                      if (customDate1) {
                        setCustomDates(customDate1, dateStr);
                      } else {
                        setCustomDates('', dateStr);
                      }
                    }
                    setDate2PickerOpen(false);
                  }}
                  disabled={isDateDisabled}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Информация о текущем сравнении */}
        {jobStatistics?.comparisonDates && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>
              Сравниваем: {format(parseLocalDate(jobStatistics.comparisonDates.date1)!, 'd MMMM', { locale: ru })} 
              {' vs '}
              {format(parseLocalDate(jobStatistics.comparisonDates.date2)!, 'd MMMM', { locale: ru })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
