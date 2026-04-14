'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter, X, RotateCcw } from 'lucide-react';
import { CombinedFilters as CombinedFiltersType, CoverageType } from '@/lib/aiTypes';

interface CombinedFiltersProps {
  filters: CombinedFiltersType;
  uniqueValues: {
    providers: string[];
    models: string[];
    configTypes: string[];
  };
  onFiltersChange: (filters: Partial<CombinedFiltersType>) => void;
  onReset: () => void;
}

export function CombinedFiltersComponent({
  filters,
  uniqueValues,
  onFiltersChange,
  onReset,
}: CombinedFiltersProps) {
  const hasActiveFilters = 
    filters.search !== '' ||
    filters.coverageType !== 'all' ||
    filters.provider !== null ||
    filters.modelName !== null ||
    filters.configType !== null ||
    filters.onlyWithAiErrors ||
    filters.onlyWithTokens;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Фильтры
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Сбросить
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Поиск по имени */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Поиск по имени джобы</Label>
          <Input
            placeholder="Введите название..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="h-9"
          />
        </div>

        {/* Фильтры в ряд */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Покрытие */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Покрытие</Label>
            <Select
              value={filters.coverageType}
              onValueChange={(value) => onFiltersChange({ coverageType: value as CoverageType | 'all' })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="both">Оба источника</SelectItem>
                <SelectItem value="operation_only">Только OperationLog</SelectItem>
                <SelectItem value="ai_only">Только AiLog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Провайдер */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Провайдер</Label>
            <Select
              value={filters.provider || 'all'}
              onValueChange={(value) => onFiltersChange({ provider: value === 'all' ? null : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {uniqueValues.providers.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Модель */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Модель</Label>
            <Select
              value={filters.modelName || 'all'}
              onValueChange={(value) => onFiltersChange({ modelName: value === 'all' ? null : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {uniqueValues.models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ConfigType */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Config Type</Label>
            <Select
              value={filters.configType || 'all'}
              onValueChange={(value) => onFiltersChange({ configType: value === 'all' ? null : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {uniqueValues.configTypes.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Чекбоксы */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="only-errors"
              checked={filters.onlyWithAiErrors}
              onCheckedChange={(checked) => onFiltersChange({ onlyWithAiErrors: checked === true })}
            />
            <Label htmlFor="only-errors" className="text-sm cursor-pointer">
              Только с AI ошибками
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="only-tokens"
              checked={filters.onlyWithTokens}
              onCheckedChange={(checked) => onFiltersChange({ onlyWithTokens: checked === true })}
            />
            <Label htmlFor="only-tokens" className="text-sm cursor-pointer">
              Только с токенами &gt; 0
            </Label>
          </div>
        </div>

        {/* Активные фильтры */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">Активные:</span>
            {filters.search && (
              <Badge variant="secondary" className="text-xs">
                Поиск: {filters.search}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ search: '' })}
                />
              </Badge>
            )}
            {filters.coverageType !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Покрытие: {filters.coverageType === 'both' ? 'Оба' : 
                  filters.coverageType === 'operation_only' ? 'OperationLog' : 'AiLog'}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ coverageType: 'all' })}
                />
              </Badge>
            )}
            {filters.provider && (
              <Badge variant="secondary" className="text-xs">
                Провайдер: {filters.provider}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ provider: null })}
                />
              </Badge>
            )}
            {filters.modelName && (
              <Badge variant="secondary" className="text-xs">
                Модель: {filters.modelName}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ modelName: null })}
                />
              </Badge>
            )}
            {filters.configType && (
              <Badge variant="secondary" className="text-xs">
                Config: {filters.configType}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ configType: null })}
                />
              </Badge>
            )}
            {filters.onlyWithAiErrors && (
              <Badge variant="secondary" className="text-xs">
                С ошибками AI
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ onlyWithAiErrors: false })}
                />
              </Badge>
            )}
            {filters.onlyWithTokens && (
              <Badge variant="secondary" className="text-xs">
                С токенами
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ onlyWithTokens: false })}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
