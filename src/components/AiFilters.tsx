'use client';

import { useAiLogStore, AI_JOB_NAMES_RU } from '@/store/aiLogStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Filter, X } from 'lucide-react';

export function AiFilters() {
  const { filters, setFilters, resetFilters, getUniqueValues, getFilteredRecords, records } = useAiLogStore();
  const uniqueValues = getUniqueValues();
  const filteredCount = getFilteredRecords().length;
  const totalCount = records.length;
  
  const hasActiveFilters = 
    filters.periodStart || 
    filters.periodEnd || 
    filters.name || 
    filters.provider || 
    filters.modelName || 
    filters.configType ||
    filters.status !== 'all' ||
    filters.onlyErrors ||
    filters.tokensAboveZero;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Фильтры</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredCount} из {totalCount} записей
            </span>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={resetFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Сбросить
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Фильтрация данных AI логов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Период с */}
          <div className="space-y-2">
            <Label htmlFor="periodStart">Период с</Label>
            <Input
              id="periodStart"
              type="date"
              value={filters.periodStart || ''}
              onChange={(e) => setFilters({ periodStart: e.target.value || null })}
            />
          </div>
          
          {/* Период по */}
          <div className="space-y-2">
            <Label htmlFor="periodEnd">Период по</Label>
            <Input
              id="periodEnd"
              type="date"
              value={filters.periodEnd || ''}
              onChange={(e) => setFilters({ periodEnd: e.target.value || null })}
            />
          </div>
          
          {/* Джоба */}
          <div className="space-y-2">
            <Label>Джоба</Label>
            <Select
              value={filters.name || 'all'}
              onValueChange={(value) => setFilters({ name: value === 'all' ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все джобы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все джобы</SelectItem>
                {uniqueValues.names.map((name) => (
                  <SelectItem key={name} value={name}>
                    {AI_JOB_NAMES_RU[name] || name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Провайдер */}
          <div className="space-y-2">
            <Label>Провайдер</Label>
            <Select
              value={filters.provider || 'all'}
              onValueChange={(value) => setFilters({ provider: value === 'all' ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все провайдеры" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все провайдеры</SelectItem>
                {uniqueValues.providers.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Модель */}
          <div className="space-y-2">
            <Label>Модель</Label>
            <Select
              value={filters.modelName || 'all'}
              onValueChange={(value) => setFilters({ modelName: value === 'all' ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все модели" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все модели</SelectItem>
                {uniqueValues.modelNames.map((modelName) => (
                  <SelectItem key={modelName} value={modelName}>
                    {modelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Статус */}
          <div className="space-y-2">
            <Label>Статус</Label>
            <Select
              value={filters.status}
              onValueChange={(value: 'all' | 'success' | 'error') => setFilters({ status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="success">Успешные</SelectItem>
                <SelectItem value="error">С ошибками</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Переключатели */}
        <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id="onlyErrors"
              checked={filters.onlyErrors}
              onCheckedChange={(checked) => setFilters({ onlyErrors: checked })}
            />
            <Label htmlFor="onlyErrors" className="cursor-pointer">
              Только ошибки
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="tokensAboveZero"
              checked={filters.tokensAboveZero}
              onCheckedChange={(checked) => setFilters({ tokensAboveZero: checked })}
            />
            <Label htmlFor="tokensAboveZero" className="cursor-pointer">
              Токены &gt; 0
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
